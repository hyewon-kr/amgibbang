import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { loadKnowledge } from "../src/lib/generation/knowledge-provider";
import { selectGoldenReferences, storyInstructions } from "../src/lib/generation/story-instructions";
import { StoryGenreSchema } from "../src/lib/schemas/story";
import { validateAnalysis } from "../src/lib/generation/validate-analysis";
import { storyQualityCases } from "./fixtures/story-quality-cases";

test("reference metadata distinguishes five adopted summaries from the Academy candidate and preserves excerpts", async () => {
  const { references } = await loadKnowledge();
  const source = await readFile(`knowledge/${references.sourceFile}`, "utf8");
  assert.equal(references.examples.filter((r) => r.status === "accepted").length, 5);
  assert.equal(references.examples.filter((r) => r.status === "candidate").length, 1);
  assert.equal(references.examples.find((r) => r.genre === "fantasy_academy")!.status, "candidate");
  for (const reference of references.examples) {
    assert.equal(reference.fullOriginalAvailable, false);
    for (const excerpt of reference.excerpts) assert.ok(source.includes(excerpt), `${reference.id}: unverified quotation`);
  }
});

test("selected context stays bounded to the requested genre and preserves reference status", async () => {
  const { references } = await loadKnowledge();
  for (const genre of StoryGenreSchema.options) {
    const selected = selectGoldenReferences(references.examples, genre, "");
    assert.ok(selected.length >= 1 && selected.length <= 2);
    assert.ok(selected.every((r) => r.genre === genre));
    const prompt = await storyInstructions({ genre, originalContent: "一般 학습 내용" });
    for (const reference of selected) assert.ok(prompt.includes(reference.title));
    for (const reference of references.examples.filter((r) => r.genre !== genre)) assert.ok(!prompt.includes(reference.title));
    assert.ok(prompt.length < 11000, `${genre}: context expanded to ${prompt.length} characters`);
    assert.ok(!prompt.includes("암기빵"));
    assert.ok(!prompt.includes("Amgippang"));
  }
  assert.equal(selectGoldenReferences(references.examples, "idol_entertainment", "DNA RNA 전사 번역")[0].id, "protein-idol");
  assert.equal(selectGoldenReferences(references.examples, "idol_entertainment", "ECG P파 QRS 심전도")[0].id, "ecg-idol");
});

test("five reviewed semantic regression cases keep accurate analysis and unchanged API personalization", () => {
  assert.deepEqual(storyQualityCases.map((c) => c.setup.genre).sort(), [...StoryGenreSchema.options].sort());
  for (const { setup, checks } of storyQualityCases) {
    validateAnalysis(setup.analysis);
    assert.ok(checks.length >= 3);
    assert.ok(setup.userPriority && setup.comprehensionNeeds);
    assert.deepEqual(setup.analysis.internal.factAnchors.map((f) => f.text), setup.originalContent.split("\n"));
  }
});
