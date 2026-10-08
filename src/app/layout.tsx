import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "암기빵 — 개념이 이야기로 구워지는 곳",
  description: "한 조각의 이야기로 차근차근 이해하는 인터랙티브 학습 프로토타입.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
