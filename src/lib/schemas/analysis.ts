import { z } from "zod";
import { FactAnchorSchema, StepSchema, StoryGenreSchema, type StoryGenre } from "./story";

const RecommendationReasonSchema = z.string().trim().min(1).max(60).regex(/^[^.!?。\n\r]+[.!?。]?$/);

export const AnalysisSchema = z.object({
  // Recommendation metadata is optional: old cached analyses remain usable,
  // and malformed suggestions must never invalidate otherwise valid facts.
  recommendedGenre: StoryGenreSchema.optional().catch(undefined),
  recommendationReason: RecommendationReasonSchema.optional().catch(undefined),
  userFacing: z.object({
    summary: z.string().min(1),
    coreConcept: z.string().min(1),
    coreFlow: z.array(z.string().min(1)).min(1),
  }).strict(),
  internal: z.object({
    factAnchors: z.array(FactAnchorSchema).min(1),
    steps: z.array(StepSchema).min(1),
    causalRelations: z.array(z.object({
      id: z.string(),
      fromStepId: z.string(),
      toStepId: z.string(),
      explanation: z.string().min(1),
    }).strict()),
    requiredOrder: z.array(z.string().min(1)).min(1),
  }).strict(),
}).strict();
export type AnalysisPayload = z.infer<typeof AnalysisSchema>;
export function genreRecommendation(analysis: AnalysisPayload | null) {
  return analysis?.recommendedGenre && analysis.recommendationReason
    ? { genre: analysis.recommendedGenre, reason: analysis.recommendationReason } : null;
}
export type StorySetup = {
  originalContent: string;
  analysis: AnalysisPayload;
  userPriority: string;
  comprehensionNeeds: string;
  genre: StoryGenre;
};
