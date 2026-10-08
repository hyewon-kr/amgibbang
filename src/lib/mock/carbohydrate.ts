import type { AnalysisPayload } from "../schemas/analysis";
import { factAnchors, steps } from "./backbone";
export { sampleInput, originalFactFlow } from "./backbone";

export const mockAnalysis: AnalysisPayload = {
  userFacing: {
    summary: "탄수화물 소화는 한 효소가 끝까지 해내는 일이 아니라, 장소에 따라 다른 효소가 역할을 이어받는 과정이에요. 입에서 시작한 분해는 위의 산성 환경에서 제약을 만나고, 소장과 솔가장자리에서 이어진 뒤 흡수와 이동으로 연결돼요.",
    coreConcept: "핵심은 ‘어디에서, 누가, 무엇을 하는가’를 연결해서 이해하는 거예요. 분해하는 단계와 흡수·이동하는 단계를 구분하면 전체 흐름이 보입니다.",
    coreFlow: ["입에서 전분 소화 시작", "위에서 침 아밀레이스 활성 소실", "소장에서 추가 분해", "솔가장자리에서 최종 분해", "단당류의 소장 흡수", "간문맥 → 간"],
  },
  internal: {
  factAnchors,
  steps,
  causalRelations: [
    { id: "c1", fromStepId: "s2", toStepId: "s3", explanation: "위의 강한 산성 환경에 도착하자 침 아밀레이스의 활성이 사라지기 시작한다. 소장에서는 췌장 아밀레이스가 남은 전분을 더 작은 당류로 분해한다." },
    { id: "c2", fromStepId: "s4", toStepId: "s5", explanation: "말타아제, 수크라아제, 락타아제가 각각 담당하는 당을 최종 분해한다. 단당류들은 소장에서 흡수된다." },
  ],
  requiredOrder: steps.map((step) => step.id),
  },
};
