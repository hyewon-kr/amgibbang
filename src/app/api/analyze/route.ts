import { AnalyzeRequest } from "@/lib/generation/api-contract";
import { handleGeneration } from "@/lib/generation/api-handler";
import { openaiProvider } from "@/lib/generation/openai-provider";
export const runtime = "nodejs";
export const maxDuration = 360;
export async function POST(request: Request) {
  return handleGeneration(request, AnalyzeRequest, ({ input }) => openaiProvider.analyze(input));
}
