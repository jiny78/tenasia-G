import type { Metadata } from "next";
import "./globals.css";
import LangProvider from "@/components/LangProvider";
import Footer from "@/components/Footer";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

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
    <html lang="en">
      <body className="antialiased pb-12">
        <SessionProviderWrapper>
          <LangProvider>
            {children}
            <Footer />
          </LangProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
