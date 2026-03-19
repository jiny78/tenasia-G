import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal & Policies | Tenasia Gallery",
  description:
    "Legal policies, licensing terms, and privacy information for Tenasia Gallery — operated by The Korea Entertainment Media.",
};

const POLICY_CARDS = [
  {
    icon: "🔒",
    href: "/policies/privacy",
    title: "Privacy Policy",
    desc: "How we collect, use, and protect your personal data",
  },
  {
    icon: "📷",
    href: "/policies/copyright",
    title: "Copyright & Licensing",
    desc: "Content ownership, license types, and usage rights",
  },
  {
    icon: "💳",
    href: "/policies/sales",
    title: "Sales Terms",
    desc: "Purchasing process, pricing, credits, and delivery",
  },
  {
    icon: "🛡️",
    href: "/policies/security",
    title: "Security Policy",
    desc: "Technical and organizational measures protecting your data and our content",
  },
  {
    icon: "↩️",
    href: "/policies/refund",
    title: "Refund Policy",
    desc: "Refund eligibility, process, and credit refund terms",
  },
];

export default function PoliciesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Legal &amp; Policies</h1>
      <p className="text-sm opacity-50 mb-10">
        Tenasia Gallery — Operated by The Korea Entertainment Media.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {POLICY_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-current/10 p-6 hover:border-current/25 transition-colors"
          >
            <span className="text-2xl mb-3 block">{card.icon}</span>
            <h2 className="font-semibold mb-1.5">{card.title}</h2>
            <p className="text-sm opacity-50">{card.desc}</p>
          </Link>
        ))}
      </div>

      <p className="mt-12 text-sm opacity-50">
        For legal inquiries:{" "}
        <a
          href="mailto:tenasia.trend@gmail.com"
          className="underline underline-offset-2 hover:opacity-100 transition-opacity"
        >
          tenasia.trend@gmail.com
        </a>
      </p>
    </div>
  );
}
