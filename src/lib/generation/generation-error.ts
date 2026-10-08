export class GenerationError extends Error {
  constructor(message: string, public kind: "configuration" | "refusal" | "structured_output" | "zod_validation" = "structured_output") { super(message); }
}
