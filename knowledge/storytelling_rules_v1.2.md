# trytry Storytelling — current rules

`storytelling_rules_v1.2.json` is the single active generation rule source, revision `trytry-2026-10-13-full-originals`. The public StoryPayload `rulesVersion: "1.2"` is retained for compatibility. This Markdown explains the architecture; it is not appended to model prompts.

Concept as Character → Function as Action → Concept-Driven Plot. When personification fits, original learning terms identify characters before invented personal names. Functions determine actions, constraints, relationships and consequences. Evidence, objects and magical rules remain valid alternatives; not every concept requires a character.

Preserve source definitions, mechanisms, values, causal relationships, distinctions and required order. Fictional events and relationships have creative freedom. Brief contextual meaning, dialogue and in-world notes support natural understanding. The reader contains fiction; annotations contain precise facts and analogy limits; Flow Summary retains source structure. Humor is optional and conceptual closure should feel like a story ending.

Five peer genres retain existing API IDs: Romance Fantasy, Zombie Apocalypse, Idol/Entertainment, Mystery, Fantasy Academy (`fantasy_academy`). Academy means magical life and adventure, not obligatory classes/exams. Mystery may personify inhibition as a murder, but must distinguish that analogy from actual death and actual criminal proof.

## Reference provenance and prompt budget

- `trytry_codex_prompt.txt`: unchanged supplied implementation requirements.
- `trytry_golden_examples.txt`: unchanged supplied excerpts, outlines and summaries, **not full originals**.
- `trytry_golden_index.json`: full-original file paths, hashes and accepted/candidate status. The new supplied RTF and its UTF-8 originals are preserved under `golden-originals/`. Five accepted entries and one Academy candidate; all six have supplied full text.
- `golden_examples.md`, `example.md`, `genre_structure_override.json`: historical references, excluded from current generation context. Their full manuscript status does not change the provenance of the new supplied collection.

The loader reads and validates the current JSON rules/index once per server process. The prompt includes common rules once, only the selected genre and its full originals; idol includes both works. No summaries or truncation replace originals. Implementation instructions are not sent per request. No new LLM calls, model changes, API fields, storage or deployment configuration changes are introduced.

## Verification

`tests/story-instructions.test.ts` checks genre selection, reference provenance, source excerpt integrity and bounded context. `tests/fixtures/story-quality-cases.ts` holds five reviewed study cases: RAAS, antigen recognition, ECG P/QRS/T, enzyme inhibition and glycolysis. Existing tests preserve reader annotations, Flow Summary, API validation, deduplication and retries. The opt-in smoke script calls the actual model once per case, saves validated output and reports timing; creative quality requires reading its results, not merely passing Zod.
