import type { AnalysisPayload, StorySetup } from "../schemas/analysis";
import type { StoryPayload } from "../schemas/story";

export interface LearningProvider {
  analyze(input: string): Promise<AnalysisPayload>;
  createStory(setup: StorySetup): Promise<StoryPayload>;
}
