import { z } from "zod";
import { AnalysisSchema } from "@/lib/schemas/analysis";
import { StoryGenreSchema, StoryPayloadSchema } from "@/lib/schemas/story";
import { validateStory } from "@/lib/generation/validate-story";
import { validateAnalysis } from "@/lib/generation/validate-analysis";
import type { FlowState } from "./reducer";

export const sessionKey = "amgippang.mock.v2";
const SavedSessionSchema = z.object({
  version: z.literal(2),
  state: z.object({
    screen: z.enum(["setup", "reader"]),
    originalContent: z.string().max(6000),
    analysis: AnalysisSchema.nullable(),
    userPriority: z.string().max(1500),
    comprehensionNeeds: z.string().max(1500),
    genre: StoryGenreSchema.nullable(),
    story: StoryPayloadSchema.nullable(),
    openAnnotations: z.array(z.string()),
    ready: z.boolean(),
  }).strict(),
});

export function readSession(raw: string | null): FlowState | null {
  if (!raw) return null;
  try {
    const result = SavedSessionSchema.safeParse(JSON.parse(raw));
    if (!result.success) return null;
    const state = result.data.state;
    if (state.analysis) validateAnalysis(state.analysis);
    if (state.story) validateStory(state.story);
    if (state.screen === "reader" && (!state.analysis || !state.story || state.genre !== state.story.genre)) return null;
    return state;
  } catch { return null; }
}
