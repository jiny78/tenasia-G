"use client";

import Link from "next/link";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

interface TocItem {
  id: string;
  title: string;
}

interface PolicyLayoutProps {
  title: string;
  tocItems: TocItem[];
  currentPath: string;
  children: React.ReactNode;
}

const ALL_POLICIES: { href: string; labelKey: keyof typeof TRANSLATIONS["en"] }[] = [
  { href: "/policies/privacy",   labelKey: "policiesPrivacy" },
  { href: "/policies/copyright", labelKey: "policiesCopyright" },
  { href: "/policies/sales",     labelKey: "policiesSales" },
  { href: "/policies/security",  labelKey: "policiesSecurity" },
  { href: "/policies/refund",    labelKey: "policiesRefund" },
];

export default function PolicyLayout({ title, tocItems, currentPath, children }: PolicyLayoutProps) {
  const { lang } = useLang();
  const tr = TRANSLATIONS[lang];

  const otherPolicies = ALL_POLICIES.filter((p) => p.href !== currentPath);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <Link
        href="/policies"
        className="text-sm opacity-50 hover:opacity-100 transition-opacity mb-6 inline-block"
      >
        ← {tr.policiesBackToAll}
      </Link>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-2 mt-2">{title}</h1>
      <p className="text-sm opacity-50 mb-8">
        {tr.policiesLastUpdated}: March 16, 2026
      </p>

      {/* Table of Contents */}
      <nav className="rounded-xl border border-current/10 p-5 mb-12">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-40 mb-3">
          {tr.policiesTableOfContents}
        </p>
        <ol className="space-y-1.5">
          {tocItems.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-sm opacity-60 hover:opacity-100 transition-opacity"
              >
                {i + 1}. {item.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Page content */}
      <div className="space-y-0">{children}</div>

      {/* Cross-links */}
      <div className="mt-16 pt-8 border-t border-current/10">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-40 mb-4">
          {tr.footerLegal}
        </p>
        <div className="flex flex-wrap gap-3">
          {otherPolicies.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="text-sm opacity-50 hover:opacity-100 transition-opacity underline underline-offset-2"
            >
              {tr[p.labelKey] as string}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
