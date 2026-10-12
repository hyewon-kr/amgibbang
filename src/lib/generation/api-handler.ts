import { boundedText, protectRequest, ProtectionError, type RequestLease } from "../security/request-protection";
import OpenAI from "openai";
import { z } from "zod";
import { GenerationError } from "./generation-error";
import { diagnostic, safeErrorMessage } from "./diagnostics";

export function validRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const source = new URL(origin);
    // App Hosting forwards requests to a Cloud Run host. Compare browser
    // origins against the configured public URL rather than that internal host.
    if (process.env.NODE_ENV === "production" && process.env.APP_ORIGIN) {
      const publicUrl = new URL(process.env.APP_ORIGIN);
      return publicUrl.protocol === "https:" && source.origin === publicUrl.origin;
    }
    const target = new URL(request.url);
    // Next.js may reconstruct request.url with localhost even when the incoming
    // Host and browser Origin are 127.0.0.1. Host is the actual HTTP destination.
    const protocol = process.env.NODE_ENV === "production" ? (request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || target.protocol.replace(":", "")) + ":" : target.protocol;
    return source.origin === `${protocol}//${request.headers.get("host") || target.host}`;
  } catch { return false; }
}
export async function handleGeneration<T>(request: Request, schema: z.ZodType<T>, generate: (value: T) => Promise<unknown>) {
  const started = Date.now();
  const route = new URL(request.url).pathname;
  const task = route.endsWith("story") ? "이야기 생성" : "분석";
  const respond = (status: number, category: string, message: string, details: Record<string, unknown> = {}) => {
    diagnostic({ route, status, category, durationMs: Date.now() - started, ...details });
    return Response.json({ error: message, code: category }, { status, headers: { "Cache-Control": "no-store" } });
  };
  if (!validRequestOrigin(request)) return respond(403, "origin_validation", "요청 출처를 확인하지 못했습니다. 접속 주소를 확인해주세요.", {
    origin: request.headers.get("origin"), host: request.headers.get("host"), requestUrlOrigin: new URL(request.url).origin,
  });
  let body: unknown;
  try {
    const text = await boundedText(request);
    if (text.length > 100000) return respond(413, "input_validation", "입력 내용이 너무 길어요.");
    body = JSON.parse(text);
  } catch (error) { return respond(error instanceof ProtectionError ? error.status : 400, "input_validation", error instanceof ProtectionError ? error.message : "입력 내용을 확인해주세요."); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return respond(400, "input_validation", "입력 내용을 확인해주세요.", { issues: parsed.error.issues.map((i) => ({ path: i.path, code: i.code })) });
  let release: RequestLease | undefined;
  try {
    release = await protectRequest(request, parsed.data);
    const result = release.cached !== undefined ? release.cached : await generate(parsed.data);
    if (release.cached === undefined) await release.complete?.(result);
    diagnostic({ route, status: 200, category: "success", durationMs: Date.now() - started, cacheHit: release.cached !== undefined });
    return Response.json(result, { headers: { "Cache-Control": "no-store", "X-Generation-Ms": String(Date.now() - started), "X-Result-Reused": String(release.cached !== undefined) } });
  } catch (error) {
    if (error instanceof ProtectionError) {
      const response = respond(error.status, error.status === 202 ? "request_pending" : "request_protection", error.message);
      response.headers.set("Retry-After", String(error.retryAfter));
      return response;
    }
    if (error instanceof OpenAI.APIError) {
      const details = { upstreamStatus: error.status, type: error.type, code: error.code, message: safeErrorMessage(error.message), requestId: error.requestID };
      if (error.status === 401) return respond(401, "authentication", "서버 API 키 인증을 확인해주세요.", details);
      if (error.status === 429) {
        const response = respond(429, error.code === "insufficient_quota" ? "quota" : "rate_limit", "API 사용량 또는 요청 한도를 확인해주세요.", details);
        response.headers.set("Retry-After", error.headers?.get("retry-after") || "2");
        return response;
      }
      if (error instanceof OpenAI.APIConnectionError && !(error instanceof OpenAI.APIConnectionTimeoutError)) return respond(503, "upstream_network", "AI 서버 연결이 일시적으로 불안정해요.", details);
      if (error instanceof OpenAI.APIConnectionTimeoutError || error instanceof OpenAI.APIUserAbortError) return respond(504, "timeout", "AI 요청 시간이 초과되었습니다. 다시 시도해주세요.", details);
      return respond(502, "openai_api", `AI ${task} 요청에 실패했습니다.`, details);
    }
    if (error instanceof GenerationError) {
      const status = error.kind === "configuration" ? 503 : error.kind === "refusal" ? 422 : 502;
      return respond(status, error.kind, error.kind === "refusal" || error.kind === "configuration" ? error.message : `AI ${task} 결과의 형식이 올바르지 않습니다.`);
    }
    if (error instanceof z.ZodError) return respond(502, "zod_validation", `AI ${task} 결과의 형식이 올바르지 않습니다.`, { issues: error.issues.map((i) => ({ path: i.path, code: i.code })) });
    if (error instanceof SyntaxError) return respond(502, "structured_output", `AI ${task} 결과의 형식이 올바르지 않습니다.`);
    return respond(502, "server_error", `AI ${task} 요청에 실패했습니다.`, { type: error instanceof Error ? error.name : "unknown" });
  } finally { await release?.(); }
}
