import { z } from "zod";
import { AnalysisSchema } from "../schemas/analysis";
import { StoryGenreSchema } from "../schemas/story";
export const AnalyzeRequest = z.object({ input: z.string().trim().min(1).max(12000) }).strict();
export const StoryRequest = z.object({
  originalContent: z.string().trim().min(1).max(12000), analysis: AnalysisSchema,
  userPriority: z.string().max(2000), comprehensionNeeds: z.string().max(2000), genre: StoryGenreSchema,
}).strict();
