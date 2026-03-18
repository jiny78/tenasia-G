"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin",           label: "개요",      icon: "⊞" },
  { href: "/admin/analytics", label: "방문 분석", icon: "📈" },
  { href: "/admin/users",     label: "사용자",    icon: "👥" },
  { href: "/admin/sales",     label: "매출",      icon: "💰" },
  { href: "/admin/downloads", label: "다운로드",  icon: "⬇" },
  { href: "/admin/content",   label: "콘텐츠",    icon: "🖼" },
  { href: "/admin/export",    label: "내보내기",  icon: "📤" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 bg-zinc-900 border-r border-zinc-800 min-h-screen">
        <div className="px-4 py-5 border-b border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Tenasia</p>
          <p className="text-sm font-semibold text-white mt-0.5">관리자</p>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map((item) => {
            const active = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}>
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden border-b border-zinc-800 bg-zinc-900 overflow-x-auto">
        <div className="flex gap-0 px-2 py-1">
          {NAV.map((item) => {
            const active = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] whitespace-nowrap transition-colors ${
                  active ? "text-white border-b-2 border-blue-400" : "text-zinc-500"
                }`}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
