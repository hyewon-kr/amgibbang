import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { mockStories } from "../src/lib/mock/stories";
import { mockAnalysis } from "../src/lib/mock/carbohydrate";
import { factAnchors, steps } from "../src/lib/mock/backbone";
import { validateStory } from "../src/lib/generation/validate-story";
import { mockProvider } from "../src/lib/generation/mock-provider";
import { StoryGenreSchema } from "../src/lib/schemas/story";

test("all five expanded mocks preserve canonical titles, identical facts, and valid annotations", async () => {
  const source = await readFile("knowledge/example.md", "utf8");
  for (const genre of StoryGenreSchema.options) {
    const story = validateStory(mockStories[genre]);
    assert.equal(story.genre, genre);
    assert.ok(source.includes(`《${story.title}》`));
    assert.ok(story.chapters.length >= 3 && story.chapters.length <= 5);
    const characterCount = story.chapters.reduce((sum, chapter) => sum + chapter.story.length, 0);
    assert.ok(characterCount >= 1500 && characterCount <= 3000, `${genre}: ${characterCount}`);
    assert.ok(story.chapters.some((chapter) => chapter.stepIds.length > 1));
    assert.deepEqual(story.factAnchors, factAnchors);
    assert.deepEqual(story.steps, steps);
    assert.deepEqual(story.flowSummary.map((item) => item.description), steps.map((step) => step.description));
    for (const fact of factAnchors) assert.ok(story.chapters.some((chapter) => chapter.mappings.some((mapping) => mapping.factAnchorIds.includes(fact.id))));
    for (const chapter of story.chapters) {
      for (const mapping of chapter.mappings) assert.equal(chapter.story.split("\n\n").filter((p) => p.includes(mapping.storyExcerpt)).length, 1);
    }
  }
});

test("provider selects each genre without fallback and returns independent data", async () => {
  for (const genre of StoryGenreSchema.options) {
    const setup = { originalContent: "탄수화물 소화", analysis: mockAnalysis, userPriority: "", comprehensionNeeds: "", genre };
    const story = await mockProvider.createStory(setup);
    assert.equal(story.title, mockStories[genre].title);
    assert.equal(story.genre, genre);
    story.factAnchors[0].text = "modified copy";
    assert.equal(mockStories[genre].factAnchors[0].text, factAnchors[0].text);
  }
});

test("same stomach fact maps to five different genre passages", () => {
  const excerpts = StoryGenreSchema.options.map((genre) => mockStories[genre].chapters.flatMap((chapter) => chapter.mappings).find((mapping) => mapping.factAnchorIds.includes("f2"))!.storyExcerpt);
  assert.equal(new Set(excerpts).size, 5);
});

test("mystery reveals the result first and reconstructs the complete process at the end", () => {
  const story = mockStories.mystery;
  assert.deepEqual(story.chapters[0].stepIds, ["s6"]);
  assert.deepEqual(story.chapters.at(-1)!.stepIds, steps.map((step) => step.id));
  assert.deepEqual(story.flowSummary.map((item) => item.factAnchorIds), steps.map((step) => step.factAnchorIds));
});
