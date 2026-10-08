import { mockAnalysis } from "../mock/carbohydrate";
import { mockStories } from "../mock/stories";
import type { LearningProvider } from "./provider";

export const mockProvider: LearningProvider = {
  async analyze() { return structuredClone(mockAnalysis); },
  async createStory(setup) {
    // Priorities and comprehension needs are carried in the request.
    // The canonical mock does not pretend to personalize its fixed text.
    return structuredClone(mockStories[setup.genre]);
  },
};
