import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 5분 내 중복 방지 (메모리 캐시)
const recentViews = new Map<string, number>();

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-middleware-token");
  if (token !== (process.env.MIDDLEWARE_SECRET ?? "dev")) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const { path, ip, country, city, userAgent, referrer, sessionId } = await req.json();

    const key = `${sessionId ?? ""}:${path}`;
    const now = Date.now();
    const last = recentViews.get(key);
    if (last && now - last < 5 * 60 * 1000) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    recentViews.set(key, now);
    if (recentViews.size > 2000) {
      const cutoff = now - 5 * 60 * 1000;
      for (const [k, v] of recentViews) if (v < cutoff) recentViews.delete(k);
    }

    await prisma.pageView.create({ data: { path, ip, country, city, userAgent, referrer, sessionId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
