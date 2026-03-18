import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../_check";

export async function GET(req: NextRequest) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;

  const sp     = req.nextUrl.searchParams;
  const range  = sp.get("range") ?? "30d";
  const status = sp.get("status") ?? "all";
  const page   = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit  = 20;

  const days = range === "30d" ? 30 : range === "90d" ? 90 : range === "1y" ? 365 : 3650;
  const from = new Date(Date.now() - days * 86400000);

  const where: Record<string, unknown> = { createdAt: { gte: from } };
  if (status !== "all") where.status = status;

  const [purchases, total, totalRevenue, monthRevenue, avgOrder, creditStats] = await Promise.all([
    prisma.purchase.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.purchase.count({ where }),
    prisma.purchase.aggregate({ _sum: { amount: true }, where: { status: "completed" } }),
    prisma.purchase.aggregate({ _sum: { amount: true }, where: { status: "completed", createdAt: { gte: new Date(new Date().setDate(1)) } } }),
    prisma.purchase.aggregate({ _avg: { amount: true }, where: { status: "completed" } }),
    Promise.all([
      prisma.credit.aggregate({ _sum: { balance: true } }),
      prisma.purchase.aggregate({ _sum: { creditsAdded: true } }),
      prisma.download.aggregate({ _sum: { creditsUsed: true } }),
    ]),
  ]);

  // 일별 집계
  const byDate = new Map<string, number>();
  const allPurchases = await prisma.purchase.findMany({
    where: { status: "completed", createdAt: { gte: from } },
    select: { createdAt: true, amount: true },
  });
  for (const p of allPurchases) {
    const d = p.createdAt.toISOString().slice(0, 10);
    byDate.set(d, (byDate.get(d) ?? 0) + p.amount);
  }
  const trend = [...byDate.entries()].sort().map(([date, amount]) => ({ date, amount }));

  return NextResponse.json({
    purchases, total, page, limit,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    monthRevenue: monthRevenue._sum.amount ?? 0,
    avgOrder:     Math.round(avgOrder._avg.amount ?? 0),
    trend,
    credits: {
      remaining: creditStats[0]._sum.balance ?? 0,
      issued:    creditStats[1]._sum.creditsAdded ?? 0,
      used:      creditStats[2]._sum.creditsUsed ?? 0,
    },
  });
}
