import type { LearningProvider } from "./provider";
import type { AnalysisPayload } from "../schemas/analysis";
import type { StoryPayload } from "../schemas/story";

export class ApiRequestError extends Error {
  constructor(message: string, public status = 0, public code = "network") { super(message); }
}
let clientId: string | undefined;
const pendingIds = new Map<string, string>();
function browserId() {
  if (clientId) return clientId;
  try { clientId = sessionStorage.getItem("amgippang-client-id") || crypto.randomUUID(); sessionStorage.setItem("amgippang-client-id", clientId); }
  catch { clientId = crypto.randomUUID(); }
  return clientId;
}
function requestId(url: string, body: string) {
  const key = url + body;
  if (pendingIds.has(key)) return pendingIds.get(key)!;
  let id: string | undefined;
  try { const previous = JSON.parse(sessionStorage.getItem("amgippang-pending:" + url) || "null"); if (previous?.body === body) id = previous.id; } catch {}
  id ||= crypto.randomUUID();
  if (pendingIds.size >= 16) pendingIds.clear();
  pendingIds.set(key, id);
  try { sessionStorage.setItem("amgippang-pending:" + url, JSON.stringify({ body, id })); } catch {}
  return id;
}
export async function post<T = unknown>(url: string, body: unknown): Promise<T> {
  const encoded = JSON.stringify(body);
  const id = requestId(url, encoded);
  const deadline = Date.now() + 280000;
  let retries = 0;
  for (;;) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Client-Id": browserId(), "X-Request-Id": id },
        body: encoded, signal: AbortSignal.timeout(Math.min(165000, Math.max(1, deadline - Date.now()))),
      });
    } catch {
      if (retries++ < 1 && Date.now() + 2000 < deadline) { await delay(1500); continue; }
      throw new ApiRequestError("서버 연결 또는 대기 시간이 초과됐어요. 입력과 선택은 유지되어 있으니 같은 버튼으로 다시 시도해주세요.");
    }
    let result: { error?: string; code?: string };
    try { result = await response.json(); }
    catch { throw new ApiRequestError("서버에서 정상적인 결과를 받지 못했어요. 입력과 선택을 유지한 채 다시 시도해주세요.", response.status, "invalid_response"); }
    if (response.ok && response.status !== 202) {
      pendingIds.delete(url + encoded);
      try { sessionStorage.removeItem("amgippang-pending:" + url); } catch {}
      return result as T;
    }
    const waitSeconds = Math.max(1, Number(response.headers.get("Retry-After")) || 2);
    const pending = response.status === 202 && result.code === "request_pending";
    const transient = ((response.status === 503 && result.code !== "configuration") || (response.status === 429 && waitSeconds <= 10 && result.code !== "quota")) && retries < 2;
    if ((pending || transient) && Date.now() + waitSeconds * 1000 < deadline) {
      if (!pending) retries++;
      await delay(Math.min(waitSeconds, 10) * 1000);
      continue;
    }
    throw new ApiRequestError((result.error || "요청을 처리하지 못했어요.") + " 입력과 선택은 유지되어 있어요. 실패한 단계에서 다시 시도해주세요.", response.status, result.code);
  }
}
function delay(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }
export const apiProvider: LearningProvider = {
  analyze: (input) => post<AnalysisPayload>("/api/analyze", { input }),
  createStory: (setup) => post<StoryPayload>("/api/story", setup),
};
