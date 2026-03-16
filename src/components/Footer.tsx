"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

type ThemeKey = "black" | "charcoal" | "cream" | "white";

const FOOTER_THEMES: Record<ThemeKey, { bg: string; text: string; sub: string; border: string }> = {
  black:    { bg: "bg-[#0a0a0a]",  text: "text-white",      sub: "text-white/40",     border: "border-white/8"  },
  charcoal: { bg: "bg-[#1e1e1e]",  text: "text-white",      sub: "text-white/40",     border: "border-white/10" },
  cream:    { bg: "bg-[#d9d4cc]",  text: "text-[#1a1a1a]",  sub: "text-[#1a1a1a]/50", border: "border-black/8"  },
  white:    { bg: "bg-[#e8e8e6]",  text: "text-[#111]",     sub: "text-[#111]/50",    border: "border-black/8"  },
};

export default function Footer() {
  const { lang } = useLang();
  const tr = TRANSLATIONS[lang];
  const [theme, setThemeState] = useState<ThemeKey>("black");

  useEffect(() => {
    const read = () => {
      const saved = localStorage.getItem("tg-theme") as ThemeKey | null;
      if (saved && FOOTER_THEMES[saved]) setThemeState(saved);
    };
    read();
    // sync when theme changes in another tab
    const onStorage = (e: StorageEvent) => {
      if (e.key === "tg-theme") read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const t = FOOTER_THEMES[theme];

  const links = [
    { href: "/policies/privacy",   label: tr.policiesPrivacy },
    { href: "/policies/copyright", label: tr.policiesCopyright },
    { href: "/policies/sales",     label: tr.policiesSales },
    { href: "/policies/security",  label: tr.policiesSecurity },
    { href: "/policies/refund",    label: tr.policiesRefund },
  ];

  return (
    <footer className={`fixed bottom-0 left-0 right-0 z-20 ${t.bg}/90 ${t.text} border-t ${t.border} backdrop-blur-sm transition-colors duration-300`}>
      <div className="max-w-screen-2xl mx-auto px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className={`text-xs ${t.sub} shrink-0`}>
          © 2026 TenAsia Media Corp. All rights reserved.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1.5">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm ${t.sub} hover:opacity-100 transition-opacity`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
