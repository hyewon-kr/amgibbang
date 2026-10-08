// Shared canonical factual backbone. Do not personalize these facts by genre.
export const sampleInput = "탄수화물의 소화 과정을 공부하고 싶어요.";
export const originalFactFlow = "입: 침 아밀레이스가 전분 소화 시작 → 위: 산성 환경에서 침 아밀레이스 활성 소실 → 소장: 췌장 아밀레이스가 전분을 더 작은 당류로 분해 → 솔가장자리: 말타아제/수크라아제/락타아제 → 포도당/과당/갈락토오스 → 소장 흡수 → 간문맥 → 간";

export const factAnchors = [
  { id: "f1", text: "입: 침 아밀레이스가 전분 소화 시작" },
  { id: "f2", text: "위: 산성 환경에서 침 아밀레이스 활성 소실" },
  { id: "f3", text: "소장: 췌장 아밀레이스가 전분을 더 작은 당류로 분해" },
  { id: "f4", text: "솔가장자리: 말타아제/수크라아제/락타아제 → 포도당/과당/갈락토오스" },
  { id: "f5", text: "소장 흡수" },
  { id: "f6", text: "간문맥 → 간" },
];

export const steps = [
  { id: "s1", order: 1, label: "입", description: factAnchors[0].text, factAnchorIds: ["f1"] },
  { id: "s2", order: 2, label: "위", description: factAnchors[1].text, factAnchorIds: ["f2"] },
  { id: "s3", order: 3, label: "소장", description: factAnchors[2].text, factAnchorIds: ["f3"] },
  { id: "s4", order: 4, label: "솔가장자리 · 단당류", description: factAnchors[3].text, factAnchorIds: ["f4"] },
  { id: "s5", order: 5, label: "소장 흡수", description: factAnchors[4].text, factAnchorIds: ["f5"] },
  { id: "s6", order: 6, label: "간문맥 → 간", description: factAnchors[5].text, factAnchorIds: ["f6"] },
];
