import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { StoryGenreSchema } from "../schemas/story";

const GenreRuleSchema = z.object({
  display_name: z.string(), driving_question: z.string(), core_fun: z.array(z.string()),
  identity: z.string(), naming: z.string(), accuracy: z.string().optional(),
  variety: z.string().optional(), deduction: z.string().optional(),
}).strict();
const RulesSchema = z.object({
  version: z.literal("1.2"), revision: z.string(), project: z.literal("trytry"), technique: z.literal("storytelling"),
  scope: z.object({ primary_goal: z.array(z.string()), secondary_goal: z.array(z.string()) }).strict(),
  principles: z.record(z.string(), z.string()), character_system: z.record(z.string(), z.string()),
  genres: z.record(StoryGenreSchema, GenreRuleSchema),
  reference_policy: z.record(z.string(), z.string()), quality_review: z.array(z.string()),
}).strict();
const ReferenceSchema = z.object({
  id: z.string(), genre: StoryGenreSchema, title: z.string(),
  status: z.enum(["accepted", "candidate"]),
  sourceKind: z.enum(["excerpt_and_outline", "plot_summary", "plot_and_dialogue_summary", "excerpt_and_plot_summary", "preferred_excerpt_and_outline"]),
  fullOriginalAvailable: z.literal(false), topics: z.array(z.string()),
  summary: z.string(), excerpts: z.array(z.string()), principle: z.string(), limits: z.string(),
}).strict();
const ReferencesSchema = z.object({
  version: z.string(), sourceFile: z.string(), editorialNote: z.string(), examples: z.array(ReferenceSchema),
}).strict();
export type GoldenReference = z.infer<typeof ReferenceSchema>;

// One active rules source. Historical Markdown/examples are reference archives,
// never appended as competing generation instructions. Cache local reads only.
let cachedKnowledge: ReturnType<typeof readKnowledge> | undefined;
export function loadKnowledge() {
  return cachedKnowledge ||= readKnowledge().catch((error) => { cachedKnowledge = undefined; throw error; });
}
async function readKnowledge() {
  const root = path.join(process.cwd(), "knowledge");
  const [rules, references] = await Promise.all([
    readFile(path.join(root, "storytelling_rules_v1.2.json"), "utf8"),
    readFile(path.join(root, "trytry_golden_index.json"), "utf8"),
  ]);
  return { rules: RulesSchema.parse(JSON.parse(rules)), references: ReferencesSchema.parse(JSON.parse(references)) };
}
