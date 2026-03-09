import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "텐아시아 갤러리",
  description: "K-아티스트 포토 갤러리 — 배우, 감독, 가수",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
