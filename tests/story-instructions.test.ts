import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { loadKnowledge } from "../src/lib/generation/knowledge-provider";
import { selectGoldenReferences, storyInstructions } from "../src/lib/generation/story-instructions";
import { StoryGenreSchema } from "../src/lib/schemas/story";
import { validateAnalysis } from "../src/lib/generation/validate-analysis";
import { storyQualityCases } from "./fixtures/story-quality-cases";

test("six full originals are preserved without rewriting, with five adopted works and one candidate", async () => {
  const { references } = await loadKnowledge();
  const source = await readFile(`knowledge/${references.sourceFile}`, "utf8");
  assert.equal(references.examples.length, 6);
  assert.equal(references.examples.filter((r) => r.status === "accepted").length, 5);
  assert.equal(references.examples.find((r) => r.genre === "fantasy_academy")!.status, "candidate");
  for (const reference of references.examples) {
    assert.equal(reference.fullOriginalAvailable, true);
    assert.equal(reference.sourceKind, "full_original");
    assert.equal(reference.originalText, await readFile(`knowledge/${reference.originalFile}`, "utf8"));
    assert.ok(source.includes(reference.originalText), `${reference.id}: changed or incomplete original`);
    assert.ok(reference.originalText.includes(reference.title));
  }
});

test("actual instructions include every byte of selected originals and no other genre originals", async () => {
  const { references } = await loadKnowledge();
  for (const genre of StoryGenreSchema.options) {
    const selected = selectGoldenReferences(references.examples, genre);
    assert.equal(selected.length, genre === "idol_entertainment" ? 2 : 1);
    const prompt = await storyInstructions({ genre, originalContent: "학습 내용" });
    for (const reference of selected) {
      assert.ok(prompt.includes(reference.originalText), `${reference.id}: full original absent from request`);
      assert.ok(prompt.includes(`BEGIN GOLDEN ${reference.id}`));
      assert.ok(prompt.includes(`END GOLDEN ${reference.id}`));
    }
    for (const reference of references.examples.filter((r) => r.genre !== genre)) assert.ok(!prompt.includes(reference.title));
    // Full originals are intentional; budget is common rules plus originals,
    // without extra summaries or repeated copies of a work.
    assert.ok(prompt.length < selected.reduce((n, r) => n + r.originalText.length, 0) + 10000);
    assert.ok(!prompt.includes("암기빵"));
  }
});

test("mystery-specific forensic instructions do not leak into other genres", async () => {
  for (const genre of StoryGenreSchema.options) {
    const prompt = await storyInstructions({ genre, originalContent: "학습 내용" });
    if (genre !== "mystery") assert.ok(!prompt.includes("실제 사람의 살인"));
  }
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
