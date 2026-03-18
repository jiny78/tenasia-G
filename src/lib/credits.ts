"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const KEY          = "tg-credits";
const SESSIONS_KEY = "tg-paid-sessions";

// ── localStorage 기반 (비로그인 사용자) ──────────────────────────

export function getCredits(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEY) ?? "0", 10);
}

export function addCredits(n: number): number {
  const next = getCredits() + n;
  localStorage.setItem(KEY, String(next));
  return next;
}

export function useCredit(): boolean {
  const c = getCredits();
  if (c <= 0) return false;
  localStorage.setItem(KEY, String(c - 1));
  return true;
}

/** 이미 처리한 Stripe session인지 확인 (중복 충전 방지) */
export function markSession(sessionId: string): boolean {
  const raw      = localStorage.getItem(SESSIONS_KEY) ?? "[]";
  const sessions: string[] = JSON.parse(raw);
  if (sessions.includes(sessionId)) return false;
  sessions.push(sessionId);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return true;
}

// ── DB 기반 hook (로그인 사용자) / localStorage fallback (비로그인) ──

export function useCredits() {
  const { data: session, status } = useSession();
  const [balance, setBalance]     = useState(0);
  const [loading, setLoading]     = useState(true);

  const refresh = useCallback(async () => {
    if (session?.user?.id) {
      try {
        const res  = await fetch("/api/account/credits");
        const data = await res.json();
        setBalance(data.balance ?? 0);
      } catch {
        setBalance(0);
      }
    } else {
      setBalance(getCredits());
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === "loading") return;
    setLoading(true);
    refresh();
  }, [status, refresh]);

  /** 크레딧 1장 차감 + (로그인) 다운로드 기록. 성공 시 signed token 반환 */
  const spendAndGetToken = useCallback(
    async (photoId: string, photoUrl: string, photoName?: string): Promise<string | null> => {
      if (session?.user?.id) {
        const res  = await fetch("/api/account/downloads", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ photoId, photoUrl, photoName }),
        });
        const data = await res.json();
        if (!res.ok) return null;
        // 잔액 갱신
        const cr = await fetch("/api/account/credits");
        const cd = await cr.json();
        setBalance(cd.balance ?? 0);
        return data.token as string;
      } else {
        // 비로그인: localStorage 크레딧 차감 + /api/request-download 토큰 획득
        const ok = useCredit();
        if (!ok) return null;
        setBalance((prev) => Math.max(0, prev - 1));
        const res  = await fetch(`/api/request-download?url=${encodeURIComponent(photoUrl)}`);
        const data = await res.json();
        return data.token ?? null;
      }
    },
    [session?.user?.id]
  );

  return { balance, loading, refresh, spendAndGetToken };
}
