// Imported only by server generation code; never expose through NEXT_PUBLIC_*.
export function generationModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-6.1-sol";
}
