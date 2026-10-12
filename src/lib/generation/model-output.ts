import { z } from "zod";
import { AnalysisSchema, type AnalysisPayload } from "../schemas/analysis";
import { StepSchema, StoryPayloadSchema } from "../schemas/story";

// Generation-only contracts. The public API and reader payload stay unchanged.
export const ModelAnalysisSchema = AnalysisSchema.extend({
  internal: AnalysisSchema.shape.internal.omit({ requiredOrder: true }).extend({
    steps: z.array(StepSchema.extend({ requiredInOrder: z.boolean() })).min(1),
  }),
});
export function assembleAnalysis(input: z.infer<typeof ModelAnalysisSchema>): AnalysisPayload {
  const steps = input.internal.steps.map(({ id, order, label, description, factAnchorIds }) => ({ id, order, label, description, factAnchorIds }));
  const requiredOrder = [...input.internal.steps].sort((a, b) => a.order - b.order).filter((step) => step.requiredInOrder).map((step) => step.id);
  return { userFacing: input.userFacing, internal: { ...input.internal, steps, requiredOrder: requiredOrder.length ? requiredOrder : [steps[0].id] } };
}
export function narrativeModelSchema(analysis: AnalysisPayload) {
  const factNumber = z.number().int().min(1).max(analysis.internal.factAnchors.length);
  const stepNumber = z.number().int().min(1).max(analysis.internal.steps.length);
  return z.object({
    title: z.string().min(1), drivingQuestion: z.string().min(1),
    narrativePlan: StoryPayloadSchema.shape.narrativePlan.omit({ conflictProgression: true }),
    chapters: z.array(z.object({
      title: z.string().min(1), conflict: z.string(), resolution: z.string(),
      stepNumbers: z.array(stepNumber).min(1),
      paragraphs: z.array(z.object({
        text: z.string().min(1),
        annotation: z.object({
          factNumbers: z.array(factNumber).min(1), explanation: z.string().min(1), metaphorLimit: z.string().nullable(),
        }).strict().nullable(),
      }).strict()).min(1),
    }).strict()).min(1),
  }).strict();
}
export type ModelNarrative = z.infer<ReturnType<typeof narrativeModelSchema>>;
export function assembleNarrative(narrative: ModelNarrative, analysis: AnalysisPayload) {
  const chapters = narrative.chapters.map((chapter, index) => {
    const paragraphs = chapter.paragraphs.map((paragraph) => ({ ...paragraph, text: paragraph.text.trim().replace(/\n\s*\n/g, "\n") }));
    const mappings = paragraphs.filter((p) => p.annotation !== null).map((p) => ({
      storyExcerpt: p.text,
      factAnchorIds: [...new Set(p.annotation!.factNumbers.map((n) => analysis.internal.factAnchors[n - 1].id))],
      explanation: p.annotation!.explanation, metaphorLimit: p.annotation!.metaphorLimit,
    }));
    return { id: index + 1, title: chapter.title, story: paragraphs.map((p) => p.text).join("\n\n"),
      stepIds: [...new Set(chapter.stepNumbers.map((n) => analysis.internal.steps[n - 1].id))],
      factAnchorIds: [...new Set(mappings.flatMap((m) => m.factAnchorIds))], mappings };
  });
  return { title: narrative.title, drivingQuestion: narrative.drivingQuestion,
    narrativePlan: { ...narrative.narrativePlan, conflictProgression: narrative.chapters.map((chapter, index) => ({ chapterId: index + 1, conflict: chapter.conflict, resolution: chapter.resolution })) }, chapters };
}
