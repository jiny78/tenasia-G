"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

const NAV_ITEMS = [
  { key: "accountDashboard",  href: "/account"            },
  { key: "accountPurchases",  href: "/account/purchases"  },
  { key: "accountDownloads",  href: "/account/downloads"  },
  { key: "accountSettings",   href: "/account/settings"   },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]["key"];

export default function AccountSidebar() {
  const { lang } = useLang();
  const tr       = TRANSLATIONS[lang];
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-48 shrink-0 gap-0.5">
        {NAV_ITEMS.map(({ key, href }) => {
          const active =
            href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(href);
          return (
            <a
              key={key}
              href={href}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-white/8 text-white font-medium"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              {tr[key as NavKey]}
            </a>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-2 px-3 py-2 rounded-lg text-sm text-white/25 hover:text-white/60
                     hover:bg-white/5 transition-colors text-left"
        >
          {tr.authSignOut}
        </button>
      </nav>

      {/* Mobile tabs */}
      <div className="flex md:hidden gap-1 mb-6 overflow-x-auto pb-1">
        {NAV_ITEMS.map(({ key, href }) => {
          const active =
            href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(href);
          return (
            <a
              key={key}
              href={href}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors border ${
                active
                  ? "bg-white text-black font-medium border-white"
                  : "text-white/40 border-white/10 hover:text-white/80"
              }`}
            >
              {tr[key as NavKey]}
            </a>
          );
        })}
      </div>
    </>
  );
}
