import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { Firestore } from "@google-cloud/firestore";
export class ProtectionError extends Error {
  constructor(message: string, public status = 429, public retryAfter = 60) { super(message); }
}
export type Bucket = { start?: number; count?: number; activeUntil?: number; lease?: string; digest?: string; duplicateUntil?: number };
export function reserve(bucket: Bucket, now: number, limit: number, digest: string, lease: string): Bucket {
  if ((bucket.activeUntil || 0) > now) throw new ProtectionError("이미 요청을 처리하고 있어요. 잠시 기다려주세요.", 429, Math.ceil((bucket.activeUntil! - now) / 1000));
  if (bucket.digest === digest && (bucket.duplicateUntil || 0) > now) throw new ProtectionError("같은 요청을 방금 처리했어요. 잠시 후 다시 시도해주세요.", 429, 15);
  const start = bucket.start && now - bucket.start < 600000 ? bucket.start : now;
  const count = start === bucket.start ? bucket.count || 0 : 0;
  if (count >= limit) throw new ProtectionError("요청 한도를 초과했어요. 잠시 후 다시 시도해주세요.", 429, Math.ceil((start + 600000 - now) / 1000));
  return { start, count: count + 1, activeUntil: now + 360000, lease, digest, duplicateUntil: now + 360000 };
}
let database: Firestore | undefined;
export async function protectRequest(request: Request, body: unknown): Promise<() => Promise<void>> {
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
  const clientRef = database.collection("amgippangApiLimits").doc(hash(ip));
  const globalRef = database.collection("amgippangApiLimits").doc(`day-${day}`);
  try {
    await database.runTransaction(async (transaction) => {
      const [client, global] = await transaction.getAll(clientRef, globalRef);
      const current = client.data() || {};
      const bucket = reserve((current[route] || {}) as Bucket, now, route.endsWith("story") ? 5 : 6, digest, lease);
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
  return async () => {
    try {
      await database!.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(clientRef);
        const current = snapshot.data();
        if (!current || current.lease !== lease) return;
        // update() interprets keys as field paths and rejects route keys
        // containing '/'. set() accepts these literal document field names.
        transaction.set(clientRef, { activeUntil: 0, [route]: { ...current[route], activeUntil: 0, duplicateUntil: Date.now() + 15000 } }, { merge: true });
      });
    } catch { /* Lease expires after six minutes; never expose raw SDK errors. */ }
  };
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
