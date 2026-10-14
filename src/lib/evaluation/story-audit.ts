import { isDeepStrictEqual } from "node:util";
import type { StorySetup } from "../schemas/analysis";
import type { StoryGenre, StoryPayload } from "../schemas/story";
import { validateStory } from "../generation/validate-story";

export const semanticConstraints: Record<StoryGenre, Array<{ id: string; requirement: string }>> = {
  zombie_apocalypse: [
    { id: "zombie.presence", requirement: "실제 좀비/좀비화된 존재가 사건에 등장한다. 단어·비유 언급만으로 충족되지 않는다." },
    { id: "zombie.threat", requirement: "좀비가 인물/공동체에 실질적 위협을 가한다." },
    { id: "zombie.conflict", requirement: "위협에 따른 생존·방어·탈출·감염 확산 갈등이 행동과 결과로 전개된다." },
  ],
  romance_fantasy: [{ id: "romance.relationship", requirement: "판타지 세계에서 의미 있는 로맨스와 관계의 선택/변화가 사건에 관여한다." }],
  idol_entertainment: [{ id: "idol.activity", requirement: "노래·춤·무대·제작·컴백·팬 교류 등 실제 연예계 활동이 사건의 중심이다. 아이돌이라는 호칭이나 연습실 배경만으로 충족되지 않는다." }],
  mystery: [{ id: "mystery.investigation", requirement: "탐정·조수·구별되는 용의자와 실제 조사/단서 검증이 사건을 진행한다." }, { id: "mystery.deduction", requirement: "개념의 작동 방식과 제시된 단서로 범인/사건을 논리적으로 해결한다. 비유적 살인과 현실의 죽음을 구별한다." }],
  fantasy_academy: [{ id: "fantasy.magic", requirement: "마법/초자연적 작용이 학교 생활·모험·관계의 선택과 결과를 바꾼다. 교수 설명이나 마법 어휘 장식만으로 충족되지 않는다." }],
};
export const commonSemanticConstraints = [
  { id: "concept.identity", requirement: "의인화한 핵심 개념은 실제 명칭으로 행동한다. 임의의 개인 이름으로 대체하지 않는다. 필요한 일반 인물은 역할 호칭을 쓰며 개념 인물을 밀어내지 않는다." },
  { id: "concept.action", requirement: "주요 개념의 기능이 행동·갈등·발견·해결에 직접 기여한다. 정의를 낭독하는 것만으로 충족되지 않는다." },
  { id: "science.fidelity", requirement: "본문의 사실·인과·필수 순서·수량과 비유가 확인된 학습내용에 부합하며 새로운 과학적 의존 관계/확실성을 발명하지 않는다." },
  { id: "narrative.continuity", requirement: "장르와 인물 역할이 이야기 전체에서 유지되며 본문에서 새 인물을 소개한다. Golden의 문체를 참고하되 원문 플롯/문장을 기계적으로 복제하지 않는다." },
];
export type Evidence = { chapterId: number; quote: string };
export type ManualReview = { ruleId: string; status: "pass" | "fail" | "uncertain"; reason: string; evidence: Evidence[] };
export type AutomaticCheck = { id: string; status: "pass" | "fail"; detail: string };
export type AuditResult = {
  automatic: AutomaticCheck[];
  semantic: Array<{ id: string; requirement: string; status: "pending" | "pass" | "fail" | "uncertain"; reason?: string; evidence: Evidence[] }>;
  verdict: "automatic_failed" | "pending_review" | "failed" | "passed";
};

export function auditStory(input: unknown, setup: StorySetup, concepts: Array<{ label: string; aliases: string[] }>, reviews: ManualReview[] = []): AuditResult {
  const automatic: AutomaticCheck[] = [];
  let story: StoryPayload | undefined;
  try { story = validateStory(input); automatic.push({ id: "structure", status: "pass", detail: "스키마·ID·참조·Flow Summary 구조 유효" }); }
  catch { automatic.push({ id: "structure", status: "fail", detail: "스키마 또는 참조 검증 실패; 의미 검증을 대신하지 않음" }); }
  if (story) {
    const check = (id: string, condition: boolean, detail: string) => automatic.push({ id, status: condition ? "pass" : "fail", detail });
    check("genre", story.genre === setup.genre, "요청 장르와 결과 메타데이터 일치");
    check("confirmed_facts", isDeepStrictEqual(story.factAnchors, setup.analysis.internal.factAnchors), "반환된 Fact Anchors의 동일성만 확인; 본문의 정확성 판정 아님");
    check("confirmed_steps", isDeepStrictEqual(story.steps, setup.analysis.internal.steps), "반환된 단계·수량·참조 데이터 동일성");
    check("annotations", story.chapters.every((c) => c.mappings.length > 0) && story.factAnchors.every((f) => story!.chapters.some((c) => c.mappings.some((m) => m.factAnchorIds.includes(f.id)))), "모든 사실의 실제 passage 주석 연결");
    check("excerpt_locations", story.chapters.every((c) => c.mappings.every((m) => c.story.split(/\n\s*\n/).filter((p) => p.includes(m.storyExcerpt)).length === 1)), "주석의 정확한 문단 위치");
    const text = story.chapters.map((c) => c.story).join("\n");
    for (const concept of concepts) check(`term:${concept.label}`, concept.aliases.some((alias) => text.includes(alias)), "명칭 존재만 확인; 캐릭터의 행동/기능 준수 판정 아님");
  }
  const semantic: AuditResult["semantic"] = [...commonSemanticConstraints, ...semanticConstraints[setup.genre]].map((rule) => ({ ...rule, status: "pending", evidence: [] }));
  const seen = new Set<string>();
  for (const review of reviews) {
    if (!["pass", "fail", "uncertain"].includes(review.status)) throw new Error("Invalid manual review status");
    const target = semantic.find((r) => r.id === review.ruleId);
    if (!target || seen.has(review.ruleId)) throw new Error("Unknown or duplicate review rule");
    seen.add(review.ruleId);
    if (!review.reason.trim() || !review.evidence.length || !story) throw new Error("Manual review requires explanation and source evidence");
    for (const evidence of review.evidence) if (!evidence.quote.trim() || !story.chapters.some((c) => c.id === evidence.chapterId && c.story.includes(evidence.quote))) throw new Error("Review evidence is not in the cited chapter");
    Object.assign(target, { status: review.status, reason: review.reason, evidence: review.evidence });
  }
  const verdict = automatic.some((r) => r.status === "fail") ? "automatic_failed" : semantic.some((r) => r.status === "fail") ? "failed" : semantic.every((r) => r.status === "pass") ? "passed" : "pending_review";
  return { automatic, semantic, verdict };
}
