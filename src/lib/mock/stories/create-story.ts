import type { StoryPayload } from "../../schemas/story";
import { validateStory } from "../../generation/validate-story";
import { factAnchors, steps } from "../backbone";

type GenreStory = Pick<StoryPayload, "title" | "genre" | "drivingQuestion" | "narrativePlan" | "chapters">;

export function createMockStory(input: GenreStory): StoryPayload {
  return validateStory({
    ...input,
    schemaVersion: "1.0",
    rulesVersion: "1.2",
    factAnchors,
    steps,
    flowSummary: steps.map((step, index) => ({
      id: `flow${index + 1}`,
      label: step.label,
      description: step.description,
      factAnchorIds: step.factAnchorIds,
      chapterIds: input.chapters.filter((chapter) => chapter.stepIds.includes(step.id)).map((chapter) => chapter.id),
      nextIds: index < steps.length - 1 ? [`flow${index + 2}`] : [],
    })),
  });
}
