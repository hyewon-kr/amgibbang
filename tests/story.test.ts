import assert from "node:assert/strict";
import test from "node:test";
import { mockAnalysis } from "../src/lib/mock/carbohydrate";
import { mockStories } from "../src/lib/mock/stories";
const mockStory = mockStories.romance_fantasy;
import { validateStory } from "../src/lib/generation/validate-story";
import { validateAnalysis } from "../src/lib/generation/validate-analysis";
import { loadKnowledge } from "../src/lib/generation/knowledge-provider";
import { genres } from "../src/lib/genres";
import { flowReducer, initialState } from "../src/features/learning-flow/reducer";
import { readSession } from "../src/features/learning-flow/session";

test("all facts, mappings, chapter references, and flow links are valid", () => {
  assert.equal(validateStory(mockStory).title, mockStory.title);
  const invalid = structuredClone(mockStory);
  invalid.flowSummary[0].chapterIds = [999];
  assert.throws(() => validateStory(invalid), /unknown reference/);
  const invalidMapping = structuredClone(mockStory);
  invalidMapping.chapters[0].mappings[0].factAnchorIds = ["f6"];
  assert.throws(() => validateStory(invalidMapping), /unknown reference/);
});

test("five peer genres are consistently derived from preserved rules", async () => {
  const knowledge = await loadKnowledge();
  assert.deepEqual(Object.keys(knowledge.rules.genres).sort(), genres.map((g) => g.id).sort());
  assert.equal(knowledge.rules.genres.idol_entertainment.driving_question, "다음 라운드를 통과하고 최종 데뷔할 수 있는가?");
  assert.equal("subgenre" in mockStory, false);
  assert.equal("modern_web_fiction" in knowledge.rules.genres, false);
});

test("internal analysis validates required order without exposing editing workload", () => {
  validateAnalysis(mockAnalysis);
  const invalid = structuredClone(mockAnalysis);
  invalid.internal.requiredOrder.push("s1");
  assert.throws(() => validateAnalysis(invalid), /순서/);
  const broken = structuredClone(mockAnalysis);
  broken.internal.requiredOrder[0] = "missing";
  assert.throws(() => validateAnalysis(broken), /순서/);
  assert.deepEqual(Object.keys(mockAnalysis.userFacing), ["summary", "coreConcept", "coreFlow"]);
});

test("analysis stays in setup; generation alone opens reader; annotations toggle independently", () => {
  let state = flowReducer(initialState, { type: "INPUT", value: "탄수화물" });
  state = flowReducer(state, { type: "ANALYZED", analysis: mockAnalysis });
  assert.equal(state.screen, "setup");
  state = flowReducer(state, { type: "REQUEST", field: "userPriority", value: "효소 이름" });
  state = flowReducer(state, { type: "REQUEST", field: "comprehensionNeeds", value: "작용 장소" });
  state = flowReducer(state, { type: "GENRE", genre: "romance_fantasy" });
  state = flowReducer(state, { type: "STORY", story: mockStory });
  assert.equal(state.screen, "reader");
  state = flowReducer(state, { type: "ANNOTATION", id: "chapter-2-passage-0" });
  state = flowReducer(state, { type: "ANNOTATION", id: "chapter-3-passage-0" });
  state = flowReducer(state, { type: "ANNOTATION", id: "chapter-2-passage-0" });
  assert.deepEqual(state.openAnnotations, ["chapter-3-passage-0"]);
  state = flowReducer(state, { type: "BACK_TO_SETUP" });
  assert.equal(state.userPriority, "효소 이름");
  assert.equal(state.comprehensionNeeds, "작용 장소");
  state = flowReducer(state, { type: "INPUT", value: "새 내용" });
  assert.equal(state.analysis, null);
  assert.equal(state.story, null);
  assert.deepEqual(state.openAnnotations, []);
});

test("session restores new setup and annotation state, and rejects obsolete versions", () => {
  assert.equal(readSession("bad json"), null);
  const state = { ...initialState, ready: true, screen: "reader", analysis: mockAnalysis, genre: "romance_fantasy", story: mockStory, openAnnotations: ["chapter-2-passage-0"] };
  assert.equal(readSession(JSON.stringify({ version: 1, state })), null);
  assert.deepEqual(readSession(JSON.stringify({ version: 2, state }))?.openAnnotations, ["chapter-2-passage-0"]);
  state.story = null as unknown as typeof mockStory;
  assert.equal(readSession(JSON.stringify({ version: 2, state })), null);
});

test("every mapping attaches to a real paragraph; at most one trigger per passage", () => {
  for (const chapter of mockStory.chapters) {
    const passages = chapter.story.split("\n\n");
    for (const mapping of chapter.mappings) assert.equal(passages.filter((p) => p.includes(mapping.storyExcerpt)).length, 1);
    const triggers = passages.filter((p) => chapter.mappings.some((m) => p.includes(m.storyExcerpt))).length;
    assert.ok(triggers <= 2);
  }
});

// Old IDs/session payloads must continue to resolve to the new displayed genre.
test("Fantasy retains its compatible ID and adventure rules without exam defaults", async () => {
  const knowledge = await loadKnowledge();
  const fantasy = genres.find((genre) => genre.id === "fantasy_academy")!;
  assert.equal(fantasy.name, "판타지");
  assert.equal(knowledge.rules.genres.fantasy_academy.display_name, "판타지");
  assert.ok(knowledge.rules.genres.fantasy_academy.core_fun.includes("모험"));
  const story = validateStory(mockStories.fantasy_academy);
  assert.equal(story.genre, fantasy.id);
  assert.match(story.narrativePlan.protagonistDesire, /등대/);
  assert.doesNotMatch(story.chapters.map((chapter) => chapter.story).join("\n"), /교수|수업|시험|합격/);
});
