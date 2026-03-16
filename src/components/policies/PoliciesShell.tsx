"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

type ThemeKey = "black" | "charcoal" | "cream" | "white";

const THEMES: Record<ThemeKey, {
  swatch: string; bg: string; header: string; border: string; text: string; sub: string;
}> = {
  black:    { swatch: "#111111", bg: "bg-[#111]",    header: "bg-[#111]/95",    border: "border-white/8",  text: "text-white",      sub: "text-white/30" },
  charcoal: { swatch: "#2a2a2a", bg: "bg-[#2a2a2a]", header: "bg-[#2a2a2a]/95", border: "border-white/10", text: "text-white",      sub: "text-white/30" },
  cream:    { swatch: "#ede8df", bg: "bg-[#ede8df]", header: "bg-[#ede8df]/95", border: "border-black/8",  text: "text-[#1a1a1a]", sub: "text-[#1a1a1a]/40" },
  white:    { swatch: "#f5f5f3", bg: "bg-[#f5f5f3]", header: "bg-[#f5f5f3]/95", border: "border-black/8",  text: "text-[#111]",    sub: "text-[#111]/35" },
};

const THEME_LABELS: Record<ThemeKey, Record<"en" | "ko", string>> = {
  black:    { en: "Black",    ko: "흑" },
  charcoal: { en: "Charcoal", ko: "회" },
  cream:    { en: "Cream",    ko: "크림" },
  white:    { en: "White",    ko: "백" },
};

export default function PoliciesShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLang();
  const [theme, setThemeState] = useState<ThemeKey>("black");

  useEffect(() => {
    const saved = localStorage.getItem("tg-theme") as ThemeKey | null;
    if (saved && THEMES[saved]) setThemeState(saved);
  }, []);

  const changeTheme = (k: ThemeKey) => {
    setThemeState(k);
    localStorage.setItem("tg-theme", k);
  };

  const t = THEMES[theme];

  return (
    <div className={`${t.bg} ${t.text} transition-colors duration-300`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-30 ${t.header} backdrop-blur border-b ${t.border} transition-colors duration-300`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-baseline gap-2 shrink-0 hover:opacity-80 transition-opacity"
          >
            <span className="text-base font-bold tracking-[0.15em] uppercase">Tenasia</span>
            <span className={`text-[10px] tracking-[0.4em] uppercase ${t.sub}`}>Gallery</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div
              className={`flex items-center text-[11px] font-medium border rounded-full overflow-hidden ${t.border}`}
            >
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 transition-colors ${
                  lang === "en"
                    ? theme === "black" || theme === "charcoal"
                      ? "bg-white text-black"
                      : "bg-black text-white"
                    : `${t.sub} hover:opacity-80`
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("ko")}
                className={`px-2 py-0.5 transition-colors ${
                  lang === "ko"
                    ? theme === "black" || theme === "charcoal"
                      ? "bg-white text-black"
                      : "bg-black text-white"
                    : `${t.sub} hover:opacity-80`
                }`}
              >
                한
              </button>
            </div>

            {/* Theme swatches */}
            <div className="flex gap-1.5">
              {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => changeTheme(k)}
                  title={THEME_LABELS[k][lang]}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    theme === k
                      ? "ring-2 ring-offset-1 ring-current scale-110"
                      : "opacity-50 hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor: THEMES[k].swatch,
                    borderColor:
                      theme === "white" || theme === "cream" ? "#00000030" : "#ffffff30",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
