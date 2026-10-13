import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { genreRecommendation } from "../src/lib/schemas/analysis";
import { validateAnalysis } from "../src/lib/generation/validate-analysis";
import { mockAnalysis } from "../src/lib/mock/carbohydrate";
import { openaiProvider } from "../src/lib/generation/openai-provider";
import { flowReducer, initialState } from "../src/features/learning-flow/reducer";
import { GenreSelector } from "../src/components/learning/GenreSelector";
import { StoryRequest } from "../src/lib/generation/api-contract";
import { readSession } from "../src/features/learning-flow/session";
import { mockStories } from "../src/lib/mock/stories";
import { loadKnowledge } from "../src/lib/generation/knowledge-provider";

const suggestion = { recommendedGenre: "mystery" as const, recommendationReason: "저해 방식의 차이를 사건의 단서로 활용하기 좋아요." };
const analysis = validateAnalysis({ ...mockAnalysis, ...suggestion });

test("analysis returns a single recommendation in its existing one OpenAI request", async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only-not-a-real-key";
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    const request = JSON.parse(String(init?.body));
    if (request.text.format.name === "learning_story") {
      const { references } = await loadKnowledge();
      for (const reference of references.examples.filter((r) => r.genre === "idol_entertainment")) assert.ok(request.instructions.includes(reference.originalText));
      const input = JSON.parse(request.input);
      assert.equal(input.genre, "idol_entertainment");
      assert.ok(!("recommendedGenre" in input.analysis));
      assert.ok(!("recommendationReason" in input.analysis));
      assert.ok(!("userFacing" in input.analysis));
      assert.deepEqual(input.analysis.internal, mockAnalysis.internal);
      const plan = mockStories.idol_entertainment.narrativePlan;
      const model = { title: "Selected genre", drivingQuestion: "선택한 장르의 이야기", narrativePlan: { protagonistDesire: plan.protagonistDesire, motivation: plan.motivation, relationshipArc: plan.relationshipArc, payoff: plan.payoff }, chapters: [{ title: "Test scene", conflict: "", resolution: "", stepNumbers: [1], paragraphs: mockAnalysis.internal.factAnchors.map((fact, index) => ({ text: fact.text, annotation: { factNumbers: [index + 1], explanation: "테스트 연결", metaphorLimit: null } })) }] };
      return Response.json({ id: "resp_story_test", object: "response", status: "completed", model: "test-model", output: [{ id: "msg_story_test", type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(model), annotations: [] }] }] });
    }
    assert.equal(request.text.format.name, "learning_analysis");
    assert.ok(request.instructions.includes("recommend exactly one"));
    assert.equal(request.text.format.schema.properties.recommendedGenre.anyOf[0].enum.length, 5);
    const model = { ...analysis, internal: { ...analysis.internal, steps: analysis.internal.steps.map((step) => ({ ...step, requiredInOrder: true })) } };
    delete (model.internal as Partial<typeof model.internal>).requiredOrder;
    return Response.json({ id: "resp_test", object: "response", status: "completed", model: "test-model", output: [{ id: "msg_test", type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(model), annotations: [] }] }] });
  };
  try {
    const result = await openaiProvider.analyze("경쟁적 저해와 순수 비경쟁적 저해");
    assert.equal(calls, 1);
    assert.deepEqual(genreRecommendation(result), { genre: "mystery", reason: suggestion.recommendationReason });
    assert.deepEqual(result.internal, mockAnalysis.internal);
    const story = await openaiProvider.createStory({ originalContent: "효소 저해", analysis: result, genre: "idol_entertainment", userPriority: "", comprehensionNeeds: "" });
    assert.equal(story.genre, "idol_entertainment");
    assert.equal(calls, 2); // One analysis call, then one explicitly requested story.
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("default recommendation never overwrites an explicit genre or a restored selection", () => {
  let state = flowReducer(initialState, { type: "ANALYZED", analysis });
  assert.equal(state.genre, "mystery");
  state = flowReducer(state, { type: "GENRE", genre: "idol_entertainment" });
  state = flowReducer(state, { type: "ANALYZED", analysis });
  assert.equal(state.genre, "idol_entertainment");
  assert.equal(genreRecommendation(state.analysis)?.genre, "mystery");
  const setup = StoryRequest.parse({ originalContent: "효소 저해", analysis: state.analysis, userPriority: "", comprehensionNeeds: "", genre: state.genre });
  assert.equal(setup.genre, "idol_entertainment");
  const restored = readSession(JSON.stringify({ version: 2, state: { ...state, originalContent: "효소 저해" } }));
  assert.equal(restored?.genre, "idol_entertainment");
  assert.equal(restored?.analysis?.recommendedGenre, "mystery");
});

test("missing, null, incomplete or invalid recommendation leaves valid analysis usable", () => {
  for (const metadata of [
    {}, { recommendedGenre: null, recommendationReason: null },
    { recommendedGenre: "unknown", recommendationReason: "추천 이유" },
    { recommendedGenre: "mystery" }, { recommendationReason: "추천 이유" },
    { recommendedGenre: "mystery", recommendationReason: "가".repeat(61) },
    { recommendedGenre: "mystery", recommendationReason: "두 문장입니다. 다른 문장입니다." },
    { recommendedGenre: "mystery", recommendationReason: "여러\n줄" },
  ]) {
    const result = validateAnalysis({ ...mockAnalysis, ...metadata });
    assert.equal(genreRecommendation(result), null);
    assert.deepEqual(result.internal, mockAnalysis.internal);
    let state = flowReducer(initialState, { type: "ANALYZED", analysis: result });
    state = flowReducer(state, { type: "GENRE", genre: "fantasy_academy" });
    assert.equal(StoryRequest.parse({ originalContent: "학습 내용", analysis: result, userPriority: "", comprehensionNeeds: "", genre: state.genre }).genre, "fantasy_academy");
  }
  // Failed API calls do not dispatch ANALYZED; existing input/selection is retained.
  const state = flowReducer({ ...initialState, originalContent: "학습 내용" }, { type: "GENRE", genre: "mystery" });
  assert.equal(state.originalContent, "학습 내용");
  assert.equal(state.genre, "mystery");
  assert.equal(state.analysis, null);
});

test("selector renders five choices, a persistent recommendation, and no recommendation UI when absent", () => {
  const props = { selected: "idol_entertainment" as const, disabled: false, onSelect: () => {} };
  const html = renderToStaticMarkup(createElement(GenreSelector, { ...props, recommendation: genreRecommendation(analysis) }));
  assert.equal((html.match(/type="radio"/g) || []).length, 5);
  assert.ok(html.includes("✨ AI 추천: 미스터리"));
  assert.ok(html.includes(suggestion.recommendationReason));
  assert.ok(html.includes('class="compact-status">추천</span>'));
  assert.equal((html.match(/checked=""/g) || []).length, 1);
  const plain = renderToStaticMarkup(createElement(GenreSelector, props));
  assert.ok(!plain.includes("AI 추천:"));
  assert.ok(!plain.includes('class="compact-status">추천</span>'));
});
