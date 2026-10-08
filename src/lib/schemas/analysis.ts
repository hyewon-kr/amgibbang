import { z } from "zod";
import { FactAnchorSchema, StepSchema, type StoryGenre } from "./story";

export const AnalysisSchema = z.object({
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
export type StorySetup = {
  originalContent: string;
  analysis: AnalysisPayload;
  userPriority: string;
  comprehensionNeeds: string;
  genre: StoryGenre;
};
