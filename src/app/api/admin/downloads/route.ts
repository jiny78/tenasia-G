import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../_check";

export async function GET(req: NextRequest) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;

  const sp      = req.nextUrl.searchParams;
  const license = sp.get("license") ?? "all";
  const range   = sp.get("range")   ?? "30d";
  const search  = sp.get("search")  ?? "";
  const page    = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit   = 20;

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const from = new Date(Date.now() - days * 86400000);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const where: Record<string, unknown> = { createdAt: { gte: from } };
  if (license !== "all") where.licenseType = license;
  if (search) where.photoId = { contains: search, mode: "insensitive" };

  const [downloads, total, todayCount, monthCount, editorialCount, commercialCount] = await Promise.all([
    prisma.download.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.download.count({ where }),
    prisma.download.count({ where: { createdAt: { gte: today } } }),
    prisma.download.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.download.count({ where: { licenseType: "editorial",  createdAt: { gte: monthStart } } }),
    prisma.download.count({ where: { licenseType: "commercial", createdAt: { gte: monthStart } } }),
  ]);

  // 아티스트별 순위 (photoName에서 추출)
  const topPhotos = await prisma.download.groupBy({
    by: ["photoId", "photoName"], _count: { id: true },
    where: { createdAt: { gte: from } },
    orderBy: { _count: { id: "desc" } }, take: 10,
  });

  return NextResponse.json({
    downloads, total, page, limit,
    stats: { todayCount, monthCount, editorialCount, commercialCount },
    topPhotos: topPhotos.map((d) => ({ photoId: d.photoId, photoName: d.photoName, count: d._count.id })),
  });
}
