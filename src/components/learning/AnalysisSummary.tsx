import type { AnalysisPayload } from "@/lib/schemas/analysis";
export function AnalysisSummary({ analysis }: { analysis: AnalysisPayload }) {
  const { summary, coreConcept, coreFlow } = analysis.userFacing;
  return <section className="analysis-summary" aria-labelledby="analysis-title"><p className="eyebrow">FIND THE STORY IN THE INFORMATION</p><h2 id="analysis-title" tabIndex={-1}>이 내용은 이렇게 이해했어요</h2><p className="analysis-copy">{summary}</p><div className="core-concept"><h3>핵심은 이거예요</h3><p>{coreConcept}</p></div><div className="core-flow"><h3>핵심 흐름</h3><ol>{coreFlow.map((step, i) => <li key={i}><span>{step}</span>{i < coreFlow.length - 1 && <span className="core-arrow" aria-hidden="true">→</span>}</li>)}</ol></div><p className="muted">AI가 분석한 핵심 흐름이에요. 내용을 확인하고 아래에서 원하는 이야기를 골라주세요.</p></section>;
}
