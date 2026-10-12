import { readFile } from "node:fs/promises";
import path from "node:path";
import type { StoryGenre } from "../schemas/story";

// Preserve v1.2 source files. Normalize only their genre hierarchy at the boundary.
let cachedKnowledge: ReturnType<typeof readKnowledge> | undefined;
export function loadKnowledge() {
  return cachedKnowledge ||= readKnowledge().catch((error) => { cachedKnowledge = undefined; throw error; });
}
async function readKnowledge() {
  const root = path.join(process.cwd(), "knowledge");
  const [json, guidance, examples, overrideJson, goldenExamples] = await Promise.all([
    readFile(path.join(root, "storytelling_rules_v1.2.json"), "utf8"),
    readFile(path.join(root, "storytelling_rules_v1.2.md"), "utf8"),
    readFile(path.join(root, "example.md"), "utf8"),
    readFile(path.join(root, "genre_structure_override.json"), "utf8"),
    readFile(path.join(root, "golden_examples.md"), "utf8"),
  ]);
  const source = JSON.parse(json);
  const override = JSON.parse(overrideJson) as {
    description: string;
    genres: Record<StoryGenre, { sourcePath: string; sharedPath?: string }>;
  };
  const atPath = (key: string) => key.split(".").reduce((node, part) => node[part], source.genres);
  const normalizedGenres = Object.fromEntries(Object.entries(override.genres).map(([genre, config]) => [
    genre,
    { ...(config.sharedPath ? { core_fun: atPath(config.sharedPath) } : {}), ...atPath(config.sourcePath) },
  ])) as Record<StoryGenre, Record<string, unknown>>;
  return {
    rules: { ...source, genres: normalizedGenres },
    guidance,
    examples,
    goldenExamples,
    hierarchyOverride: override.description,
  };
}
