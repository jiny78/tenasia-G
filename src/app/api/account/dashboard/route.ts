import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [creditResult, purchasesResult, downloadsResult] = await Promise.allSettled([
    prisma.credit.findUnique({
      where: { userId },
      select: { balance: true },
    }),
    prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        creditsAdded: true,
        amount: true,
        createdAt: true,
      },
    }),
    prisma.download.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        photoId: true,
        photoName: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
  ]);

  const now = new Date();

  return NextResponse.json({
    balance:
      creditResult.status === "fulfilled"
        ? (creditResult.value?.balance ?? 0)
        : 0,
    purchases:
      purchasesResult.status === "fulfilled"
        ? purchasesResult.value
        : [],
    downloads:
      downloadsResult.status === "fulfilled"
        ? downloadsResult.value.map((download) => ({
            ...download,
            expired: download.expiresAt < now,
          }))
        : [],
    partial:
      creditResult.status === "rejected"
      || purchasesResult.status === "rejected"
      || downloadsResult.status === "rejected",
  });
}
