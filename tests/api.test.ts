import OpenAI from "openai";
import assert from "node:assert/strict";
import test from "node:test";
import { AnalyzeRequest, StoryRequest } from "../src/lib/generation/api-contract";
import { handleGeneration } from "../src/lib/generation/api-handler";
import { GenerationError } from "../src/lib/generation/openai-provider";
import { mockAnalysis } from "../src/lib/mock/carbohydrate";

test("API validates requests before invoking generation", async () => {
  let invoked = false;
  for (const body of ['{', '{}', JSON.stringify({ input: ' '.repeat(10) }), JSON.stringify({ input: 'a'.repeat(12001) })]) {
    const response = await handleGeneration(new Request('http://localhost/api/analyze', { method: 'POST', body }), AnalyzeRequest, async () => { invoked = true; return {}; });
    assert.equal(response.status, 400);
  }
  assert.equal(invoked, false);
  const denied = await handleGeneration(new Request('http://localhost/api/analyze', { method: 'POST', headers: { origin: 'http://other.test' }, body: '{"input":"test"}' }), AnalyzeRequest, async () => ({}));
  assert.equal(denied.status, 403);
});
test("API returns validated input to generator and safe errors", async () => {
  const makeRequest = () => new Request('http://localhost/api/analyze', { method: 'POST', body: '{"input":" test "}' });
  const response = await handleGeneration(makeRequest(), AnalyzeRequest, async ({ input }) => ({ input }));
  assert.deepEqual(await response.json(), { input: 'test' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const failure = await handleGeneration(makeRequest(), AnalyzeRequest, async () => { throw new Error('private upstream detail'); });
  assert.equal(failure.status, 502);
  assert.ok(!JSON.stringify(await failure.json()).includes('private'));
  const missingKey = await handleGeneration(makeRequest(), AnalyzeRequest, async () => { throw new GenerationError('서버의 OPENAI_API_KEY를 설정해주세요.', 'configuration'); });
  assert.equal(missingKey.status, 503);
});
test("story request accepts five genres and carries personalization and facts", () => {
  for (const genre of ['romance_fantasy', 'zombie_apocalypse', 'idol_entertainment', 'mystery', 'fantasy_academy']) {
    const setup = { originalContent: '탄수화물', analysis: mockAnalysis, genre, userPriority: '효소', comprehensionNeeds: '환경' };
    assert.deepEqual(StoryRequest.parse(setup), setup);
  }
});

test("Origin uses incoming Host rather than Next reconstructed localhost URL", async () => {
  let called = false;
  const response = await handleGeneration(new Request('http://localhost:3000/api/analyze', {
    method: 'POST', headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' }, body: '{"input":"photosynthesis"}',
  }), AnalyzeRequest, async () => { called = true; return {}; });
  assert.equal(response.status, 200);
  assert.equal(called, true);
  const denied = await handleGeneration(new Request('http://localhost:3000/api/analyze', {
    method: 'POST', headers: { host: '127.0.0.1:3000', origin: 'http://evil.test:3000' }, body: '{"input":"photosynthesis"}',
  }), AnalyzeRequest, async () => { throw new Error('must not call'); });
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).code, 'origin_validation');
});

test("format failures and actual refusals have distinct error codes", async () => {
  const cases = [
    { error: new SyntaxError('private output'), code: 'structured_output', status: 502 },
    { error: new GenerationError('refusal', 'refusal'), code: 'refusal', status: 422 },
    { error: new GenerationError('invalid mapping'), code: 'structured_output', status: 502 },
  ];
  for (const item of cases) {
    const response = await handleGeneration(new Request('http://localhost/api/analyze', { method: 'POST', body: '{"input":"test"}' }), AnalyzeRequest, async () => { throw item.error; });
    assert.equal(response.status, item.status);
    assert.equal((await response.json()).code, item.code);
  }
});

test("authentication and quota errors preserve distinct HTTP statuses", async () => {
  for (const status of [401, 429, 400]) {
    const upstream = OpenAI.APIError.generate(status, { error: { message: 'safe configuration error', type: 'invalid_request_error', code: 'example' } }, undefined, new Headers());
    const response = await handleGeneration(new Request('http://localhost/api/analyze', { method: 'POST', body: '{"input":"test"}' }), AnalyzeRequest, async () => { throw upstream; });
    assert.equal(response.status, status === 400 ? 502 : status);
    const result = await response.json();
    assert.equal(result.code, status === 401 ? 'authentication' : status === 429 ? 'rate_limit' : 'openai_api');
    assert.ok(!result.error.includes('허용되지'));
  }
});
