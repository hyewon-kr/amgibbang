// Opt-in paid test: one story per reviewed case, reusing supplied confirmed facts.
// The existing provider may make its single bounded validation-repair attempt.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { openaiProvider } from "../src/lib/generation/openai-provider";
import { validateStory } from "../src/lib/generation/validate-story";
import { storyQualityCases } from "../tests/fixtures/story-quality-cases";

async function main() {
  const results = [];
  const requested = process.argv.slice(2);
  if (requested.some((id) => !storyQualityCases.some((c) => c.id === id))) throw new Error("Unknown case");
  const cases = requested.length ? storyQualityCases.filter((c) => requested.includes(c.id)) : storyQualityCases;
  for (const { id, setup, checks } of cases) {
    const started = Date.now();
    try {
      const story = validateStory(await openaiProvider.createStory(setup));
      const output = path.join(os.tmpdir(), `trytry-quality-${id}.json`);
      await writeFile(output, JSON.stringify({ setup, checks, story }, null, 2));
      const result = { id, genre: setup.genre, seconds: (Date.now() - started) / 1000, title: story.title, annotations: story.chapters.reduce((n, c) => n + c.mappings.length, 0), output };
      results.push(result);
      console.log(JSON.stringify(result));
    } catch (error) {
      results.push({ id, seconds: (Date.now() - started) / 1000, failed: true });
      console.error(JSON.stringify({ id, error: error instanceof Error ? error.message : "generation failed" }));
      process.exitCode = 1;
    }
  }
  console.log(JSON.stringify({ results }));
}
main().catch(() => { console.error("Smoke test failed before generation."); process.exitCode = 1; });
