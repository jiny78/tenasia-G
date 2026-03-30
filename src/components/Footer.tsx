"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

export default function Footer() {
  const { lang } = useLang();
  const tr = TRANSLATIONS[lang];
  const pathname = usePathname();
  const isHome = pathname === "/";

  const links = [
    { href: "/policies/privacy", label: tr.policiesPrivacy },
    { href: "/policies/copyright", label: tr.policiesCopyright },
    { href: "/policies/sales", label: tr.policiesSales },
    { href: "/policies/security", label: tr.policiesSecurity },
    { href: "/policies/refund", label: tr.policiesRefund },
  ];

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 z-20 backdrop-blur-md ${
        isHome ? "border-t border-black/5 bg-[#fcf9f8]/88" : "border-t border-white/10 bg-black/85"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto flex flex-col items-start justify-between gap-2 px-6 py-2.5 sm:flex-row sm:items-center">
        <p className={`text-xs shrink-0 ${isHome ? "text-black/45" : "text-white/50"}`}>
          짤 2026 The Korea Entertainment Media. All rights reserved.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1.5">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                isHome ? "text-black/60 hover:text-[#006492]" : "text-white/70 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
