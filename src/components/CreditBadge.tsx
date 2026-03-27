"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCredits } from "@/lib/credits";
import { ThemeKey } from "@/lib/themes";

interface Props {
  theme: ThemeKey;
}

export default function CreditBadge({ theme }: Props) {
  const { data: session, status } = useSession();
  const { balance, loading }      = useCredits();

  // 로그인 상태 확인 중이거나 비로그인이면 미표시
  if (status === "loading" || !session?.user) return null;

  const isDark   = theme === "black" || theme === "charcoal";
  const isEmpty  = !loading && balance === 0;

  return (
    <Link
      href="/account"
      title="크레딧 구매"
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs tabular-nums
        font-medium transition-all duration-150 select-none
        ${isEmpty
          ? isDark
            ? "bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25"
            : "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
          : isDark
            ? "bg-white/10 text-white/80 border border-white/10 hover:bg-white/18 hover:text-white"
            : "bg-black/6 text-black/70 border border-black/8 hover:bg-black/10 hover:text-black"
        }`}
    >
      {/* 코인 아이콘 */}
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
        className={isEmpty ? "text-red-400" : isDark ? "text-white/60" : "text-black/50"}>
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 3.5v5M4.5 4.5h2a1 1 0 1 1 0 2h-1a1 1 0 1 1 0 2H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>

      {loading ? (
        <span className={`w-3 h-3 border rounded-full animate-spin
          ${isDark ? "border-white/20 border-t-white/60" : "border-black/15 border-t-black/50"}`} />
      ) : (
        <span>{balance}</span>
      )}
    </Link>
  );
}
