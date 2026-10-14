import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { conformanceCases } from "../tests/fixtures/conformance-cases";
import { auditStory, type ManualReview } from "../src/lib/evaluation/story-audit";
import { auditRequest } from "../src/lib/evaluation/request-audit";
import { withGenerationDiagnostics } from "../src/lib/generation/diagnostics";
import { openaiProvider } from "../src/lib/generation/openai-provider";
import { StoryRequest } from "../src/lib/generation/api-contract";

const args = process.argv.slice(2);
function option(name: string) { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; }
async function main() {
  const id = option("--case");
  const testCase = conformanceCases.find((c) => c.id === id);
  if (!testCase) throw new Error("Choose --case ecg|immunity|inhibition|respiration");
  const saved = option("--saved");
  const generate = args.includes("--generate");
  if (Boolean(saved) === generate) throw new Error("Choose exactly one: --saved FILE (no API) or --generate (paid, explicit)");
  const runs = Number(option("--runs") || 1);
  if (!Number.isInteger(runs) || runs < 1 || runs > 3 || (saved && runs !== 1)) throw new Error("Runs must be 1–3; saved result uses one run");
  const out = option("--out") || "artifacts/conformance";
  const reviewFile = option("--review");
  const reviews: ManualReview[] = reviewFile ? JSON.parse(await readFile(reviewFile, "utf8")) : [];
  await mkdir(out, { recursive: true });
  for (let run = 1; run <= runs; run++) {
    const events: Record<string, unknown>[] = [];
    const started = Date.now();
    const existing = saved ? JSON.parse(await readFile(saved, "utf8")) : null;
    const setup = StoryRequest.parse(existing?.setup ?? testCase.setup);
    const request = await auditRequest(setup);
    if (request.checks.some((check) => check.status === "fail")) throw new Error("Request conformance check failed before generation");
    let story: unknown = existing?.story;
    let generationError: string | null = null;
    if (generate) {
      if (request.model !== "gpt-6-luna" || request.reasoning !== "none") throw new Error("Evaluation requires gpt-6-luna / none; configuration unchanged");
      try { story = await withGenerationDiagnostics((event) => { events.push(event); }, () => openaiProvider.createStory(setup)); }
      catch { generationError = "Generation or existing format-validation failed"; }
    }
    const automaticConcepts = testCase.concepts.map((label) => ({ label, aliases: [label] }));
    const audit = auditStory(story, setup, automaticConcepts, reviews);
    const responses = events.filter((event) => event.category === "openai_response");
    const result = {
      runId: `${Date.now()}-${testCase.id}-${run}`, createdAt: new Date().toISOString(), caseId: testCase.id,
      source: generate ? "actual_generation" : "saved_output", datasetSource: testCase.source,
      // Old saved outputs do NOT inherit today's model/revision/usage metadata.
      generation: generate ? { model: request.model, reasoning: request.reasoning, rulesRevision: request.rulesRevision, goldenVersion: request.goldenVersion, seconds: (Date.now() - started) / 1000, calls: events.filter((e) => e.category === "openai_request").length, responses: responses.map((e) => ({ model: e.model, status: e.responseStatus, milliseconds: e.durationMs, inputTokens: e.inputTokens, outputTokens: e.outputTokens, reasoningTokens: e.reasoningTokens, cachedTokens: e.cachedTokens })) } : { model: existing.generation?.model ?? "unknown", reasoning: existing.generation?.reasoning ?? "unknown", rulesRevision: existing.generation?.rulesRevision ?? "unknown", goldenVersion: existing.generation?.goldenVersion ?? "unknown", seconds: existing.seconds ?? existing.generation?.seconds ?? null, responses: existing.generation?.responses ?? null },
      currentRequestAudit: request, setup, story: story ?? null, generationError, ...audit,
    };
    const filename = path.join(out, result.runId + ".json");
    await writeFile(filename, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ file: filename, verdict: audit.verdict, automaticFailures: audit.automatic.filter((c) => c.status === "fail").map((c) => c.id), semantic: audit.semantic.map((c) => ({ rule: c.id, status: c.status })) }));
    if (generationError || audit.verdict === "automatic_failed" || audit.verdict === "failed") process.exitCode = 1;
    else if (audit.verdict === "pending_review" && process.exitCode !== 1) process.exitCode = 2;
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Evaluation failed"); process.exitCode = 1; });
