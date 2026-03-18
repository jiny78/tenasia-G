import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../_check";

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;

  const now = new Date();
  const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfDay     = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalUsers, newUsersMonth,
    revMTD, revPrevMonth,
    dlMTD, dlEditorial, dlCommercial,
    pvToday, pvSessionsToday,
    countries,
    pendingCreds,
    topDownloads,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.purchase.aggregate({ _sum: { amount: true }, where: { status: "completed", createdAt: { gte: startOfMonth } } }),
    prisma.purchase.aggregate({ _sum: { amount: true }, where: { status: "completed", createdAt: { gte: startOfPrevMonth, lt: startOfMonth } } }),
    prisma.download.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.download.count({ where: { createdAt: { gte: startOfMonth }, licenseType: "editorial" } }),
    prisma.download.count({ where: { createdAt: { gte: startOfMonth }, licenseType: "commercial" } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.pageView.findMany({ where: { createdAt: { gte: startOfDay } }, select: { sessionId: true }, distinct: ["sessionId"] }),
    prisma.pageView.groupBy({ by: ["country"], _count: { id: true }, where: { country: { not: null }, createdAt: { gte: new Date(now.getTime() - 30 * 86400000) } }, orderBy: { _count: { id: "desc" } }, take: 10 }),
    prisma.mediaCredential.findMany({ where: { status: "pending" }, include: { user: { select: { name: true, email: true, company: true } } }, orderBy: { createdAt: "asc" }, take: 5 }),
    prisma.download.groupBy({ by: ["photoId", "photoName"], _count: { id: true }, _sum: { creditsUsed: true }, orderBy: { _count: { id: "desc" } }, take: 10 }),
  ]);

  const revMTDVal = revMTD._sum.amount ?? 0;
  const revPrevVal = revPrevMonth._sum.amount ?? 0;
  const revChange = revPrevVal > 0 ? Math.round(((revMTDVal - revPrevVal) / revPrevVal) * 100) : null;

  return NextResponse.json({
    totalUsers, newUsersMonth,
    revMTD: revMTDVal, revPrevMonth: revPrevVal, revChange,
    dlMTD, dlEditorial, dlCommercial,
    pvToday, uniqueToday: pvSessionsToday.length,
    countries: countries.map((c) => ({ country: c.country, count: c._count.id })),
    pendingCreds,
    topDownloads: topDownloads.map((d) => ({
      photoId:    d.photoId,
      photoName:  d.photoName,
      downloads:  d._count.id,
      revenue:    (d._sum.creditsUsed ?? 0) * 4,
    })),
  });
}
