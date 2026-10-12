import assert from "node:assert/strict";
import test from "node:test";
import { post } from "../src/lib/generation/api-provider";

test("network retry and pending poll keep request identity; failures preserve manual retry", async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } });
  const ids: string[] = [];
  let calls = 0;
  try {
    globalThis.fetch = async (_url, options) => {
      const headers = new Headers(options?.headers);
      ids.push(headers.get("X-Request-Id")!);
      assert.ok(headers.get("X-Client-Id"));
      calls++;
      if (calls === 1) throw new TypeError("network disconnected");
      if (calls === 2) return Response.json({ code: "request_pending" }, { status: 202, headers: { "Retry-After": "1" } });
      return Response.json({ title: "real response" });
    };
    assert.deepEqual(await post("/api/story", { test: "retry" }), { title: "real response" });
    assert.equal(calls, 3);
    assert.equal(new Set(ids).size, 1);
    globalThis.fetch = async (_url, options) => {
      ids.push(new Headers(options?.headers).get("X-Request-Id")!);
      return Response.json({ error: "format error", code: "zod_validation" }, { status: 502 });
    };
    await assert.rejects(post("/api/story", { test: "manual" }), /실패한 단계/);
    const failedId = ids.at(-1);
    globalThis.fetch = async (_url, options) => {
      assert.equal(new Headers(options?.headers).get("X-Request-Id"), failedId);
      return Response.json({ title: "recovered" });
    };
    assert.deepEqual(await post("/api/story", { test: "manual" }), { title: "recovered" });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage) Object.defineProperty(globalThis, "sessionStorage", originalStorage);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});
