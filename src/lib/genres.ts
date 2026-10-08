import type { StoryGenre } from "./schemas/story";

export const genres: Array<{
  id: StoryGenre;
  name: string;
  description: string;
  number: string;
}> = [
  { id: "romance_fantasy", name: "로맨스판타지", description: "욕망 · 관계 · 구원과 각성", number: "01" },
  { id: "zombie_apocalypse", name: "좀비 아포칼립스", description: "생존 · 위기 · 구역 돌파", number: "02" },
  { id: "idol_entertainment", name: "아이돌/연예계", description: "데뷔 · 평가 · 경쟁과 성장", number: "03" },
  { id: "mystery", name: "추리", description: "단서 · 추론 · 원인 발견", number: "04" },
  { id: "fantasy_academy", name: "판타지 아카데미", description: "시험 · 퀘스트 · 성장", number: "05" },
];
