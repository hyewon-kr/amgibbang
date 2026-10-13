import { AnalysisSchema, type AnalysisPayload } from "../schemas/analysis";

export function validateAnalysis(input: unknown): AnalysisPayload {
  const analysis = AnalysisSchema.parse(input);
  if (!analysis.recommendedGenre || !analysis.recommendationReason) {
    delete analysis.recommendedGenre;
    delete analysis.recommendationReason;
  }
  const internal = analysis.internal;
  const steps = new Set(internal.steps.map((step) => step.id));
  const facts = new Set(internal.factAnchors.map((fact) => fact.id));
  if (steps.size !== internal.steps.length || facts.size !== internal.factAnchors.length) throw new Error("분석 항목 ID가 중복되어 있어요.");
  for (const step of internal.steps) {
    if (step.factAnchorIds.some((id) => !facts.has(id))) throw new Error("단계와 연결된 사실을 확인해주세요.");
  }
  for (const relation of internal.causalRelations) {
    if (!steps.has(relation.fromStepId) || !steps.has(relation.toStepId)) throw new Error("인과관계에 연결된 단계를 확인해주세요.");
  }
  if (new Set(internal.requiredOrder).size !== internal.requiredOrder.length || internal.requiredOrder.some((id) => !steps.has(id))) throw new Error("필수 순서의 단계 참조를 확인해주세요.");
  return analysis;
}
