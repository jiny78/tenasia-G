import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../_check";

export async function GET(req: NextRequest) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;

  const sp     = req.nextUrl.searchParams;
  const search = sp.get("search") ?? "";
  const filter = sp.get("filter") ?? "all";
  const sort   = sp.get("sort")   ?? "createdAt";
  const page   = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit  = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name:    { contains: search, mode: "insensitive" } },
      { email:   { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }
  if (filter === "verified")  where.pressVerified = true;
  if (filter === "pending")   where.mediaCredential = { status: "pending" };
  if (filter === "submitted") where.mediaCredential = { isNot: null };

  const orderBy: Record<string, string> = {};
  if (sort === "createdAt") orderBy.createdAt = "desc";

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, orderBy, skip: (page - 1) * limit, take: limit,
      include: {
        credits:         { select: { balance: true } },
        mediaCredential: { select: { status: true } },
        _count:          { select: { downloads: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({
      id:            u.id,
      name:          u.name,
      email:         u.email,
      company:       u.company,
      country:       u.country,
      createdAt:     u.createdAt,
      pressVerified: u.pressVerified,
      pressStatus:   u.mediaCredential?.status ?? null,
      credits:       u.credits?.balance ?? 0,
      downloads:     u._count.downloads,
    })),
    total, page, limit,
  });
}
