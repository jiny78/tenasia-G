import type { Metadata } from "next";
import "./globals.css";
import LangProvider from "@/components/LangProvider";

export const metadata: Metadata = {
  title: "Tenasia Gallery",
  description: "K-Artist Photo Gallery — Actors, Directors, Musicians",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
