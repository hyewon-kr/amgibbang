import type { StorySetup } from "../../src/lib/schemas/analysis";
import { storyQualityCases } from "./story-quality-cases";
function base(id: string) { return structuredClone(storyQualityCases.find((c) => c.id === id)!.setup); }
function append(setup: StorySetup, facts: string[]) {
  for (const text of facts) {
    const i = setup.analysis.internal.factAnchors.length + 1;
    setup.analysis.internal.factAnchors.push({ id: `f${i}`, text });
    setup.analysis.internal.steps.push({ id: `s${i}`, order: i, label: `개념 ${i}`, description: text, factAnchorIds: [`f${i}`] });
  }
  setup.originalContent = setup.analysis.internal.factAnchors.map((f) => f.text).join("\n");
  return setup;
}
const ecg = append(base("ecg"), [
  "우각차단은 전형적으로 QRS 연장 및 형태 변화를 보이지만 오른쪽 심실이 완전히 멈춘다는 뜻은 아니다.",
  "P 뒤 QRS 누락은 일부 방실차단에서 나타날 수 있으나 구체적 유형을 판단하려면 추가 ECG 소견이 필요하다.",
]);
const respiration = append(base("glycolysis"), [
  "피루브산은 아세틸-CoA로 변환되며 CO₂가 방출되고 NADH가 만들어진다.",
  "TCA 회로는 NADH와 FADH₂를 생성하며 이들은 전자를 운반한다.",
  "전자전달계는 전자 전달 에너지를 이용해 H⁺ 기울기를 형성한다. ATP 합성효소를 통한 H⁺ 이동이 ADP와 무기인산으로부터 ATP 합성을 구동한다.",
  "산소는 전자전달계의 최종 전자 수용체이고 물이 생성된다.",
  "해당과정은 세포질, 피루브산 산화와 TCA 회로는 미토콘드리아 기질, 전자전달계와 ATP 합성효소는 미토콘드리아 내막에서 일어난다.",
]);
export const conformanceCases = [
  { id: "ecg", source: "사용자 제공 ECG Golden 원문/비유 한계; ECG와 전도 이상(RBBB/AV block)에 한정", setup: ecg, concepts: ["동방결절", "방실결절", "QRS", "T파"] },
  { id: "immunity", source: "사용자 제공 선천/적응면역 Golden 학습내용", setup: base("antigen"), concepts: ["호중구", "대식세포", "수지상세포", "보조 T세포", "B세포"] },
  { id: "inhibition", source: "사용자 제공 효소 저해 Golden 학습내용", setup: base("inhibition"), concepts: ["효소", "기질", "경쟁적 저해", "비경쟁적 저해"] },
  { id: "respiration", source: "사용자 제공 세포호흡 Golden 학습내용/비유 한계", setup: respiration, concepts: ["포도당", "피루브산", "ATP", "NADH", "ATP 합성효소", "산소"] },
];
