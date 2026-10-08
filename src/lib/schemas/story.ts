import { z } from "zod";

export const StoryGenreSchema = z.enum([
  "romance_fantasy",
  "zombie_apocalypse",
  "idol_entertainment",
  "mystery",
  "fantasy_academy",
]);
export type StoryGenre = z.infer<typeof StoryGenreSchema>;

export const FactAnchorSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
}).strict();

export const StepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  label: z.string().min(1),
  description: z.string().min(1),
  factAnchorIds: z.array(z.string()).min(1),
}).strict();

export const StoryPayloadSchema = z.object({
  schemaVersion: z.literal("1.0"),
  rulesVersion: z.literal("1.2"),
  title: z.string().min(1),
  genre: StoryGenreSchema,
  drivingQuestion: z.string().min(1),
  narrativePlan: z.object({
    protagonistDesire: z.string().min(1),
    motivation: z.string().min(1),
    relationshipArc: z.array(z.object({
      character: z.string(),
      role: z.string(),
      development: z.string(),
      laterConsequence: z.string(),
    }).strict()),
    conflictProgression: z.array(z.object({
      chapterId: z.number().int().positive(),
      conflict: z.string(),
      resolution: z.string(),
    }).strict()),
    payoff: z.string().min(1),
  }).strict(),
  steps: z.array(StepSchema).min(1),
  factAnchors: z.array(FactAnchorSchema).min(1),
  chapters: z.array(z.object({
    id: z.number().int().positive(),
    title: z.string().min(1),
    story: z.string().min(1),
    stepIds: z.array(z.string()).min(1),
    factAnchorIds: z.array(z.string()).min(1),
    mappings: z.array(z.object({
      storyExcerpt: z.string().min(1),
      factAnchorIds: z.array(z.string()).min(1),
      explanation: z.string().min(1),
      metaphorLimit: z.string().nullable(),
    }).strict()).min(1),
  }).strict()).min(1),
  flowSummary: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1),
    factAnchorIds: z.array(z.string()).min(1),
    chapterIds: z.array(z.number().int().positive()).min(1),
    nextIds: z.array(z.string()),
  }).strict()).min(1),
}).strict();

export type StoryPayload = z.infer<typeof StoryPayloadSchema>;
export type Chapter = StoryPayload["chapters"][number];
