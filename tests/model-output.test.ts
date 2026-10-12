import assert from "node:assert/strict";
import test from "node:test";
import { ModelAnalysisSchema, assembleAnalysis, assembleNarrative, narrativeModelSchema } from "../src/lib/generation/model-output";
import { mockAnalysis } from "../src/lib/mock/carbohydrate";
import { mockStories } from "../src/lib/mock/stories";
import { validateAnalysis } from "../src/lib/generation/validate-analysis";
import { validateStory } from "../src/lib/generation/validate-story";

test("required order is assembled from actual steps, without copying IDs from the model", () => {
  const internal = { factAnchors: mockAnalysis.internal.factAnchors, causalRelations: mockAnalysis.internal.causalRelations, steps: mockAnalysis.internal.steps.map((step) => ({ ...step, requiredInOrder: true })) };
  const model = ModelAnalysisSchema.parse({ userFacing: mockAnalysis.userFacing, internal });
  assert.deepEqual(validateAnalysis(assembleAnalysis(model)), mockAnalysis);
  assert.ok(!("requiredInOrder" in assembleAnalysis(model).internal.steps[0]));
});
test("paragraph annotations assemble exact excerpts and preserve all five reader contracts", () => {
  const schema = narrativeModelSchema(mockAnalysis);
  for (const story of Object.values(mockStories)) {
    const model = schema.parse({
      title: story.title, drivingQuestion: story.drivingQuestion,
      narrativePlan: { protagonistDesire: story.narrativePlan.protagonistDesire, motivation: story.narrativePlan.motivation, relationshipArc: story.narrativePlan.relationshipArc, payoff: story.narrativePlan.payoff },
      chapters: story.chapters.map((chapter) => ({
        title: chapter.title, conflict: "Source constraint", resolution: "Source transition",
        stepNumbers: chapter.stepIds.map((id) => mockAnalysis.internal.steps.findIndex((step) => step.id === id) + 1),
        paragraphs: chapter.story.split("\n\n").map((text) => {
          const mappings = chapter.mappings.filter((m) => text.includes(m.storyExcerpt));
          return { text, annotation: mappings.length ? { factNumbers: [...new Set(mappings.flatMap((m) => m.factAnchorIds))].map((id) => mockAnalysis.internal.factAnchors.findIndex((f) => f.id === id) + 1), explanation: mappings.map((m) => m.explanation).join("\n"), metaphorLimit: mappings[0].metaphorLimit } : null };
        }),
      })),
    });
    const assembled = validateStory({ ...story, ...assembleNarrative(model, mockAnalysis) });
    assert.equal(assembled.genre, story.genre);
    assert.deepEqual(assembled.chapters.map((c) => c.story), story.chapters.map((c) => c.story));
    assert.ok(assembled.factAnchors.every((f) => assembled.chapters.some((c) => c.mappings.some((m) => m.factAnchorIds.includes(f.id)))));
    for (const chapter of assembled.chapters) for (const mapping of chapter.mappings) assert.ok(chapter.story.split("\n\n").includes(mapping.storyExcerpt));
  }
});
