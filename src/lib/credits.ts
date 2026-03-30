"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const KEY = "tg-credits";
const SESSIONS_KEY = "tg-paid-sessions";

export function getCredits(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(KEY) ?? "0", 10);
}

export function addCredits(n: number): number {
  const next = getCredits() + n;
  localStorage.setItem(KEY, String(next));
  return next;
}

export function spendLocalCredit(): boolean {
  const credits = getCredits();
  if (credits <= 0) return false;
  localStorage.setItem(KEY, String(credits - 1));
  return true;
}

export function markSession(sessionId: string): boolean {
  const raw = localStorage.getItem(SESSIONS_KEY) ?? "[]";
  const sessions: string[] = JSON.parse(raw);
  if (sessions.includes(sessionId)) return false;
  sessions.push(sessionId);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return true;
}

export function useCredits() {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (session?.user?.id) {
      try {
        const res = await fetch("/api/account/credits");
        const data = await res.json();
        setBalance(data.balance ?? 0);
      } catch {
        setBalance(0);
      }
    } else {
      setBalance(0);
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === "loading") return;
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [status, refresh]);

  const spendAndGetToken = useCallback(
    async (
      photoId: string,
      _photoUrl: string,
      photoName?: string,
      licenseType = "editorial",
    ): Promise<string | null> => {
      if (!session?.user?.id) {
        return null;
      }

      const res = await fetch("/api/account/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, photoName, licenseType }),
      });
      const data = await res.json();
      if (!res.ok) return null;

      const creditsRes = await fetch("/api/account/credits");
      const creditsData = await creditsRes.json();
      setBalance(creditsData.balance ?? 0);
      return data.token as string;
    },
    [session?.user?.id],
  );

  return { balance, loading, refresh, spendAndGetToken };
}
