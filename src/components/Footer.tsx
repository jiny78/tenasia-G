"use client";

import Link from "next/link";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

export default function Footer() {
  const { lang } = useLang();
  const tr = TRANSLATIONS[lang];

  const links = [
    { href: "/policies/privacy",   label: tr.policiesPrivacy },
    { href: "/policies/copyright", label: tr.policiesCopyright },
    { href: "/policies/sales",     label: tr.policiesSales },
    { href: "/policies/security",  label: tr.policiesSecurity },
    { href: "/policies/refund",    label: tr.policiesRefund },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 bg-black/85 backdrop-blur-md border-t border-white/10">
      <div className="max-w-screen-2xl mx-auto px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-xs text-white/50 shrink-0">
          © 2026 TenAsia Media Corp. All rights reserved.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1.5">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
