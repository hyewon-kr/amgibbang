import { StoryPayloadSchema, type StoryPayload } from "../schemas/story";

export function validateStory(input: unknown): StoryPayload {
  const story = StoryPayloadSchema.parse(input);
  function unique(ids: Array<string | number>, name: string) {
    if (new Set(ids).size !== ids.length) throw new Error(`${name}: duplicate ID`);
  }
  unique(story.factAnchors.map((f) => f.id), "facts");
  unique(story.steps.map((s) => s.id), "steps");
  unique(story.chapters.map((c) => c.id), "chapters");
  unique(story.flowSummary.map((f) => f.id), "flow");
  const facts = new Set(story.factAnchors.map((f) => f.id));
  const steps = new Set(story.steps.map((s) => s.id));
  const chapters = new Set(story.chapters.map((c) => c.id));
  const flows = new Set(story.flowSummary.map((f) => f.id));
  function refs<T>(ids: T[], valid: Set<T>, name: string) {
    if (ids.some((id) => !valid.has(id))) throw new Error(`${name}: unknown reference`);
  }
  for (const step of story.steps) refs(step.factAnchorIds, facts, "step facts");
  for (const chapter of story.chapters) {
    refs(chapter.stepIds, steps, "chapter steps");
    refs(chapter.factAnchorIds, facts, "chapter facts");
    for (const mapping of chapter.mappings) {
      refs(mapping.factAnchorIds, new Set(chapter.factAnchorIds), "mapping facts");
      if (!chapter.story.includes(mapping.storyExcerpt)) throw new Error("mapping excerpt absent from story");
    }
  }
  for (const fact of facts) {
    if (!story.chapters.some((c) => c.factAnchorIds.includes(fact))) throw new Error("uncovered fact");
  }
  for (const item of story.flowSummary) {
    refs(item.factAnchorIds, facts, "flow facts");
    refs(item.chapterIds, chapters, "flow chapters");
    refs(item.nextIds, flows, "flow links");
  }
  for (const conflict of story.narrativePlan.conflictProgression) refs([conflict.chapterId], chapters, "conflict chapters");
  return story;
}
