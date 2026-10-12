import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { Firestore } from "@google-cloud/firestore";
export class ProtectionError extends Error {
  constructor(message: string, public status = 429, public retryAfter = 60) { super(message); }
}
export type Bucket = { start?: number; count?: number; activeUntil?: number; lease?: string; digest?: string; duplicateUntil?: number; requestId?: string; result?: string; resultUntil?: number };
export type RequestLease = (() => Promise<void>) & { cached?: unknown; complete?: (result: unknown) => Promise<void> };
export function replayBucket(bucket: Bucket, digest: string, requestId: string | undefined, analysis: boolean, now: number) {
  if (bucket.digest === digest && bucket.result && (bucket.resultUntil || 0) > now && (analysis || (requestId && bucket.requestId === requestId))) return JSON.parse(bucket.result) as unknown;
  return undefined;
}
export function reserve(bucket: Bucket, now: number, limit: number, digest: string, lease: string): Bucket {
  if ((bucket.activeUntil || 0) > now) throw new ProtectionError("이미 요청을 처리하고 있어요. 잠시 기다려주세요.", 429, Math.ceil((bucket.activeUntil! - now) / 1000));
  if (bucket.digest === digest && (bucket.duplicateUntil || 0) > now) throw new ProtectionError("같은 요청을 방금 처리했어요. 잠시 후 다시 시도해주세요.", 429, 15);
  const start = bucket.start && now - bucket.start < 600000 ? bucket.start : now;
  const count = start === bucket.start ? bucket.count || 0 : 0;
  if (count >= limit) throw new ProtectionError("요청 한도를 초과했어요. 잠시 후 다시 시도해주세요.", 429, Math.ceil((start + 600000 - now) / 1000));
  return { start, count: count + 1, activeUntil: now + 360000, lease, digest, duplicateUntil: now + 360000 };
}
let database: Firestore | undefined;
export async function protectRequest(request: Request, body: unknown): Promise<RequestLease> {
  const production = process.env.NODE_ENV === "production";
  if (!production && process.env.RATE_LIMIT_BACKEND !== "firestore") return async () => {};
  const salt = process.env.RATE_LIMIT_SALT;
  if (process.env.RATE_LIMIT_BACKEND !== "firestore" || !salt || salt.length < 32) throw new ProtectionError("서버 요청 보호 설정을 확인해주세요.", 503);
  const route = new URL(request.url).pathname;
  const forwarded = (request.headers.get("x-forwarded-for") || "").split(",").map((ip) => ip.trim());
  // Google load balancer appends client-IP, load-balancer-IP. Ignore spoofable
  // values on the left. Unknown proxy layouts share a conservative bucket.
  const candidate = forwarded.length >= 2 ? forwarded.at(-2)! : "";
  const ip = isIP(candidate) ? candidate : "unknown-proxy";
  const hash = (value: string) => createHmac("sha256", salt).update(value).digest("hex");
  const digest = hash(route + JSON.stringify(body));
  const lease = randomUUID();
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  const dailyLimit = Number(process.env.API_DAILY_REQUEST_LIMIT || 100);
  if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 10000) throw new ProtectionError("서버 요청 보호 설정을 확인해주세요.", 503);
  database ||= new Firestore(); // Cloud Run service account via ADC; no credential file.
  // App Hosting / shared study Wi-Fi can present the same proxy IP. A stable
  // browser session separates participants; the shared daily cost cap remains.
  const clientId = request.headers.get("x-client-id");
  const requestId = request.headers.get("x-amgippang-request-id") || undefined;
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if ((clientId && !uuid.test(clientId)) || (requestId && !uuid.test(requestId))) throw new ProtectionError("요청 식별 정보를 확인해주세요.", 400);
  const clientRef = database.collection("amgippangApiLimits").doc(hash(clientId ? "session:" + clientId : "legacy:" + ip));
  const globalRef = database.collection("amgippangApiLimits").doc(`day-${day}`);
  let cached: unknown;
  try {
    await database.runTransaction(async (transaction) => {
      const [client, global] = await transaction.getAll(clientRef, globalRef);
      const current = client.data() || {};
      const previous = (current[route] || {}) as Bucket;
      cached = replayBucket(previous, digest, requestId, route.endsWith("analyze"), now);
      if (cached !== undefined) return;
      if (requestId && previous.requestId === requestId && previous.digest !== digest) throw new ProtectionError("같은 요청 ID에 다른 내용이 전달됐어요.", 400);
      if (requestId && previous.requestId === requestId && Number(previous.activeUntil || 0) > now) throw new ProtectionError("요청을 처리 중입니다. 결과를 확인하고 있어요.", 202, 2);
      const bucket = reserve(previous, now, route.endsWith("story") ? 5 : 6, digest, lease);
      if (requestId) bucket.requestId = requestId;
      // One in-flight operation per client across BOTH endpoints.
      if (Number(current.activeUntil || 0) > now) throw new ProtectionError("이미 요청을 처리하고 있어요. 잠시 기다려주세요.");
      const total = Number(global.data()?.count || 0);
      if (total >= dailyLimit) throw new ProtectionError("오늘의 서비스 요청 한도에 도달했어요. 내일 다시 이용해주세요.", 429, Math.ceil((Date.parse(day) + 86400000 - now) / 1000));
      transaction.set(clientRef, { ...current, [route]: bucket, activeUntil: bucket.activeUntil, lease, expiresAt: new Date(now + 86400000) });
      transaction.set(globalRef, { count: total + 1, expiresAt: new Date(now + 172800000) });
    });
  } catch (error) {
    if (error instanceof ProtectionError) throw error;
    throw new ProtectionError("요청 보호 서비스를 사용할 수 없어요. 잠시 후 다시 시도해주세요.", 503);
  }
  if (cached !== undefined) return Object.assign(async () => {}, { cached });
  let completed = false;
  const finish = async (result?: unknown) => {
    await database!.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(clientRef);
      const current = snapshot.data();
      if (!current || current.lease !== lease) return;
      const bucket = { ...current[route], activeUntil: 0, duplicateUntil: result === undefined ? 0 : Date.now() + 15000 };
      if (result !== undefined) {
        const encoded = JSON.stringify(result);
        if (Buffer.byteLength(encoded) < 850000) { bucket.result = encoded; bucket.resultUntil = Date.now() + 1200000; }
      }
      transaction.set(clientRef, { activeUntil: 0, [route]: bucket }, { merge: true });
    });
  };
  const release: RequestLease = async () => {
    if (completed) return;
    try { await finish(); } catch { /* Crash lease still expires; never log content. */ }
  };
  release.complete = async (result) => {
    try { await finish(result); completed = true; }
    catch { completed = true; throw new ProtectionError("생성 결과를 보관하지 못했어요. 잠시 후 같은 단계에서 다시 확인해주세요.", 503, 2); }
  };
  return release;
}
export async function boundedText(request: Request, maxBytes = 100000) {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new ProtectionError("입력 내용이 너무 길어요.", 413);
  if (!request.body) return "";
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new ProtectionError("입력 내용이 너무 길어요.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString("utf8");
}
