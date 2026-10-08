import type { LearningProvider } from "./provider";
async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "요청을 처리하지 못했어요. 다시 시도해주세요.");
  return result;
}
export const apiProvider: LearningProvider = {
  analyze: (input) => post("/api/analyze", { input }),
  createStory: (setup) => post("/api/story", setup),
};
