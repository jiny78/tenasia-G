import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../_check";

export async function GET(req: NextRequest) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const from = new Date(Date.now() - days * 86400000);

  // 일별 페이지뷰
  const views = await prisma.pageView.findMany({
    where: { createdAt: { gte: from } },
    select: { createdAt: true, sessionId: true },
    orderBy: { createdAt: "asc" },
  });

  // 날짜별 집계
  const byDate = new Map<string, { views: number; sessions: Set<string> }>();
  for (const v of views) {
    const d = v.createdAt.toISOString().slice(0, 10);
    if (!byDate.has(d)) byDate.set(d, { views: 0, sessions: new Set() });
    const entry = byDate.get(d)!;
    entry.views++;
    if (v.sessionId) entry.sessions.add(v.sessionId);
  }

  const trend = [...byDate.entries()].map(([date, { views: v, sessions }]) => ({
    date, views: v, unique: sessions.size,
  }));

  // 국가별
  const countryCounts = await prisma.pageView.groupBy({
    by: ["country"], _count: { id: true },
    where: { country: { not: null }, createdAt: { gte: from } },
    orderBy: { _count: { id: "desc" } }, take: 20,
  });

  // 디바이스 (UserAgent 기반 단순 분류)
  const agents = await prisma.pageView.findMany({
    where: { createdAt: { gte: from }, userAgent: { not: null } },
    select: { userAgent: true }, take: 5000,
  });
  let mobile = 0, tablet = 0, desktop = 0;
  for (const a of agents) {
    const ua = a.userAgent?.toLowerCase() ?? "";
    if (/tablet|ipad/.test(ua)) tablet++;
    else if (/mobile|android|iphone/.test(ua)) mobile++;
    else desktop++;
  }

  // 유입 경로
  const referrers = await prisma.pageView.findMany({
    where: { createdAt: { gte: from }, referrer: { not: null } },
    select: { referrer: true }, take: 5000,
  });
  const refMap = new Map<string, number>();
  for (const r of referrers) {
    let domain = "Direct";
    try {
      const u = new URL(r.referrer!);
      const host = u.hostname.replace(/^www\./, "");
      if (host.includes("google")) domain = "Google";
      else if (host.includes("twitter") || host.includes("x.com")) domain = "Twitter/X";
      else if (host.includes("instagram")) domain = "Instagram";
      else if (host.includes("facebook")) domain = "Facebook";
      else domain = host;
    } catch {}
    refMap.set(domain, (refMap.get(domain) ?? 0) + 1);
  }
  const topReferrers = [...refMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([source, count]) => ({ source, count }));

  return NextResponse.json({
    trend,
    countries: countryCounts.map((c) => ({ country: c.country, count: c._count.id })),
    devices: { mobile, tablet, desktop },
    referrers: topReferrers,
  });
}
