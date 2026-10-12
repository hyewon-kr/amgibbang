import assert from "node:assert/strict";
import test from "node:test";
import { boundedText, protectRequest, ProtectionError, reserve, replayBucket } from "../src/lib/security/request-protection";
test("limits, in-flight leases and duplicate cooldown are enforced", () => {
  const now = 1000000;
  const first = reserve({}, now, 3, "digest", "owner");
  assert.throws(() => reserve(first, now + 1, 3, "other", "new"), ProtectionError);
  const released = { ...first, activeUntil: 0, duplicateUntil: now + 15000 };
  assert.throws(() => reserve(released, now + 1, 3, "digest", "new"), ProtectionError);
  const second = reserve(released, now + 1, 3, "other", "new");
  assert.equal(second.count, 2);
  assert.throws(() => reserve({ start: now, count: 3 }, now + 100, 3, "other", "new"), ProtectionError);
  assert.equal(reserve({ start: now, count: 3 }, now + 600001, 3, "other", "new").count, 1);
  assert.equal(reserve(first, now + 600001, 3, "digest", "new").lease, "new");
});
test("byte limit applies to UTF-8 and streams without content-length", async () => {
  assert.equal(await boundedText(new Request('http://localhost', { method: 'POST', body: 'abc' }), 3), 'abc');
  await assert.rejects(boundedText(new Request('http://localhost', { method: 'POST', body: '가가' }), 5), (error: unknown) => error instanceof ProtectionError && error.status === 413);
});
test("production protection fails closed when configuration is absent", async () => {
  const old = { node: process.env.NODE_ENV, backend: process.env.RATE_LIMIT_BACKEND, salt: process.env.RATE_LIMIT_SALT };
  try {
    Object.assign(process.env, { NODE_ENV: 'production' }); delete process.env.RATE_LIMIT_BACKEND; delete process.env.RATE_LIMIT_SALT;
    await assert.rejects(protectRequest(new Request('http://localhost/api/analyze'), {}), (error: unknown) => error instanceof ProtectionError && error.status === 503);
  } finally {
    for (const [key, value] of [['NODE_ENV', old.node], ['RATE_LIMIT_BACKEND', old.backend], ['RATE_LIMIT_SALT', old.salt]]) {
      if (value === undefined) delete process.env[key!]; else process.env[key!] = value;
    }
  }
});

test("replay requires matching content and request identity; analysis can reuse facts", () => {
  const bucket = { digest: "body", requestId: "owner", result: JSON.stringify({ title: "real result" }), resultUntil: 2000 };
  assert.deepEqual(replayBucket(bucket, "body", "owner", false, 1000), { title: "real result" });
  assert.equal(replayBucket(bucket, "changed", "owner", false, 1000), undefined);
  assert.equal(replayBucket(bucket, "body", "new", false, 1000), undefined);
  assert.deepEqual(replayBucket(bucket, "body", "new", true, 1000), { title: "real result" });
  assert.equal(replayBucket(bucket, "body", "owner", false, 2001), undefined);
  assert.equal(replayBucket({ ...bucket, result: undefined }, "body", "owner", false, 1000), undefined);
});
