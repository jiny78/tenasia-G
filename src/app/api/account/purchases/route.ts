import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/account/purchases?page=1&limit=10
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page  = Math.max(1, parseInt(req.nextUrl.searchParams.get("page")  ?? "1",  10));
  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") ?? "10", 10));
  const skip  = (page - 1) * limit;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.purchase.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ purchases, total, page, limit });
}
