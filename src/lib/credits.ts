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

export function useCredit(): boolean {
  const c = getCredits();
  if (c <= 0) return false;
  localStorage.setItem(KEY, String(c - 1));
  return true;
}

/** 이미 처리한 Stripe session인지 확인 (중복 충전 방지) */
export function markSession(sessionId: string): boolean {
  const raw = localStorage.getItem(SESSIONS_KEY) ?? "[]";
  const sessions: string[] = JSON.parse(raw);
  if (sessions.includes(sessionId)) return false;
  sessions.push(sessionId);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return true;
}
