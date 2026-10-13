import type { AnalysisPayload, StorySetup } from "../../src/lib/schemas/analysis";
import type { StoryGenre } from "../../src/lib/schemas/story";

function studyCase(id: string, genre: StoryGenre, facts: string[], requiredSteps: number[], checks: string[]): { id: string; setup: StorySetup; checks: string[] } {
  const analysis: AnalysisPayload = {
    userFacing: { summary: facts.join(" "), coreConcept: id, coreFlow: facts },
    internal: {
      factAnchors: facts.map((text, i) => ({ id: `f${i + 1}`, text })),
      steps: facts.map((description, i) => ({ id: `s${i + 1}`, order: i + 1, label: `개념 ${i + 1}`, description, factAnchorIds: [`f${i + 1}`] })),
      causalRelations: [], requiredOrder: requiredSteps.map((i) => `s${i}`),
    },
  };
  return { id, setup: { originalContent: facts.join("\n"), analysis, genre, userPriority: "개념의 기능이 인물의 행동과 사건이 되게 해주세요.", comprehensionNeeds: "처음 나오는 용어는 맥락을 짧게 알려주세요." }, checks };
}
// Reviewed supplied learning material, not model output or supposed golden originals.
export const storyQualityCases = [
  studyCase("raas", "romance_fantasy", [
    "혈압 또는 신장 관류 감소에 반응해 신장이 레닌을 분비한다.",
    "레닌은 안지오텐시노겐을 안지오텐신 I으로 전환하고 ACE는 안지오텐신 I을 안지오텐신 II로 전환한다.",
    "안지오텐신 II는 혈관 수축과 알도스테론 분비 촉진을 일으킨다.",
    "알도스테론은 신장의 Na⁺ 재흡수를 증가시키고 간접적으로 물 보존을 돕는다.",
    "혈관 수축과 혈액량 증가는 혈압 회복에 기여한다. 혈관 수축이 끝나야 알도스테론 작용이 시작되는 것은 아니다.",
  ], [1, 2, 3], ["레닌·ACE·안지오텐신 II의 기능이 행동인가", "두 작용을 병렬로 보존하는가", "절제된 로맨스가 본문에 있는가"]),
  studyCase("antigen", "zombie_apocalypse", [
    "호중구와 대식세포는 선천면역의 초기 방어에 기여하고 대식세포는 침입자를 포식한다.",
    "수지상세포는 항원을 처리해 MHC를 통해 제시하고 림프절에서 맞는 수용체를 가진 T세포의 활성화에 기여한다. 공동자극도 중요하다.",
    "보조 T세포는 자신의 수용체로 적절한 peptide–MHC를 인식한다. B세포는 항원을 인식하고 보조 T세포의 도움으로 형질세포로 분화할 수 있다.",
    "항체는 중화와 옵소닌화 등에 기여하며 모든 병원체를 직접 죽이는 것은 아니다. 기억 B/T세포는 같은 항원 재노출 때 더 빠른 반응에 기여하나 감염을 반드시 완전히 차단하지는 않는다.",
  ], [2, 3], ["수용체의 특이적 인식이 발견과 행동을 바꾸는가", "실제 좀비 위협이 있는가", "병원체 비유와 면역의 병렬성이 주석에 있는가"]),
  studyCase("ecg", "idol_entertainment", [
    "동방결절(SA node)에서 시작한 전기 신호가 심방에 퍼진다. P파는 심방 탈분극을 나타낸다.",
    "방실결절(AV node)에서 전도가 지연된 뒤 히스다발, 좌우 다발가지, 푸르키네섬유를 통해 심실로 신호가 전파된다.",
    "QRS군은 심실 탈분극을 나타내며 T파는 심실 재분극을 나타낸다. ECG는 전기적 활동을 기록하며 근육 수축 자체를 기록하지 않는다.",
  ], [1, 2, 3], ["개념의 기능이 제작진/신호 업무로 작동하는가", "P/QRS/T 첫 등장에 의미가 있는가", "사고나 의학 강의 없이 업계의 사건이 있는가"]),
  studyCase("inhibition", "mystery", [
    "효소는 촉매로 반응을 촉진하고 반응에서 소모되지 않는다. 기질은 효소의 활성 부위와 결합해 반응한다.",
    "경쟁적 저해제는 활성 부위를 두고 기질과 경쟁한다. 기질 농도를 높이면 저해 효과를 극복해 같은 Vmax에 접근할 수 있다.",
    "순수 비경쟁적 저해는 Vmax를 감소시키고 Km은 변하지 않는 이상적 유형이다. 기질 농도를 높여도 감소한 Vmax가 회복되지 않으며 혼합 저해와 구별한다.",
    "가역적 효소 저해는 효소의 영구 파괴나 실제 사망과 같지 않다.",
  ], [1], ["효소·기질·저해제 인물의 역할이 구분되는가", "기질 증가 실험이 경쟁적/순수 비경쟁적 저해의 추론을 바꾸는가", "비유적 살인과 실제 사망을 분리하는가"]),
  studyCase("glycolysis", "fantasy_academy", [
    "해당과정은 세포질에서 포도당 한 분자를 피루브산 두 분자로 변환한다.",
    "포도당 한 분자당 해당과정에 ATP 두 개가 투입되고 ATP 네 개가 생성되어 순 ATP 두 개를 얻는다.",
    "ATP가 독립적인 사람으로 행동하는 것은 비유이며 물질의 실제 수량과 기능을 구별해야 한다.",
  ], [1, 2], ["개념명 인물의 변화가 실제 마법 사건인가", "포도당1→피루브산2, ATP 투입2/생성4/순2가 정확한가", "학교 생활과 모험이며 교수 설명이나 원본 장면 복제가 아닌가"]),
];
