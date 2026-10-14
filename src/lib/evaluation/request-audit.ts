import { createHash } from "node:crypto";
import type { StorySetup } from "../schemas/analysis";
import { loadKnowledge } from "../generation/knowledge-provider";
import { storyInstructions, selectGoldenReferences } from "../generation/story-instructions";
import { generationModel, generationEffort } from "../generation/server-config";
export async function auditRequest(setup: StorySetup) {
  const { rules, references } = await loadKnowledge();
  const instructions = await storyInstructions(setup);
  const selected = selectGoldenReferences(references.examples, setup.genre);
  const check = (id: string, passed: boolean) => ({ id, status: passed ? "pass" : "fail" });
  return {
    model: generationModel(), reasoning: generationEffort(), rulesRevision: rules.revision,
    rulesSha256: createHash("sha256").update(JSON.stringify(rules)).digest("hex"), goldenVersion: references.version,
    genre: setup.genre, maxOutputTokens: 12000,
    instructions, instructionsSha256: createHash("sha256").update(instructions).digest("hex"),
    inputSha256: createHash("sha256").update(JSON.stringify(setup)).digest("hex"),
    originals: selected.map((r) => ({ id: r.id, sha256: r.sha256, characters: r.originalText.length })),
    checks: [
      check("selected_originals_complete", selected.length === (setup.genre === "idol_entertainment" ? 2 : 1) && selected.every((r) => instructions.includes(r.originalText))),
      check("other_genres_excluded", references.examples.filter((r) => r.genre !== setup.genre).every((r) => !instructions.includes(r.originalText))),
      check("genre_rules_present", instructions.includes(JSON.stringify(rules.genres[setup.genre]).slice(1, -1))),
      check("naming_priority_present", instructions.includes(rules.character_system.naming_priority)),
    ],
  };
}
