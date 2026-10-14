import { AsyncLocalStorage } from "node:async_hooks";

const observer = new AsyncLocalStorage<(data: Record<string, unknown>) => void>();
export function withGenerationDiagnostics<T>(callback: (data: Record<string, unknown>) => void, work: () => Promise<T>): Promise<T> {
  return observer.run(callback, work);
}

export function diagnostic(data: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    const allowed = new Set(["category", "route", "status", "model", "responseStatus", "requestId", "durationMs", "inputTokens", "outputTokens", "reasoningTokens", "cachedTokens", "upstreamStatus", "type", "code", "attempt", "cacheHit", "promptCharacters", "instructionsSha256", "reasoning"]);
    data = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.has(key)));
  }
  observer.getStore()?.(data);
  console.info("[generation]", JSON.stringify(data));
}
// API errors can echo a credential or user text. Preserve useful configuration
// information but redact credentials and quoted values; never log request bodies.
export function safeErrorMessage(message: string) {
  const key = process.env.OPENAI_API_KEY;
  let safe = key ? message.split(key).join("[redacted]") : message;
  safe = safe.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]").replace(/(["'`])[^\n]*?\1/g, "[quoted value redacted]");
  return safe.slice(0, 500);
}
