import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createHmac } from "crypto";
import { authOptions } from "@/lib/auth";
import { requireEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const CREDIT_COST: Record<string, number> = {
  editorial: 1,
  commercial: 3,
  extended: 15,
  single: 0,
};

function makeToken(url: string): string {
  const secret = requireEnv("DOWNLOAD_SECRET");
  const window = Math.floor(Date.now() / 30000);
  return createHmac("sha256", secret)
    .update(`${url}:${window}`)
    .digest("hex")
    .slice(0, 24);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10));
  const license = req.nextUrl.searchParams.get("license") ?? "";
  const skip = (page - 1) * limit;

  const where = {
    userId: session.user.id,
    ...(license ? { licenseType: license } : {}),
  };

  const [downloads, total] = await Promise.all([
    prisma.download.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.download.count({ where }),
  ]);

  const now = new Date();
  return NextResponse.json({
    downloads: downloads.map((download) => ({
      ...download,
      expired: download.expiresAt < now,
    })),
    total,
    page,
    limit,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { photoId, photoName, licenseType = "editorial" } = await req.json();
  if (!photoId || typeof photoId !== "string") {
    return NextResponse.json({ error: "Missing photoId" }, { status: 400 });
  }

  const normalizedLicense = typeof licenseType === "string" ? licenseType.toLowerCase() : "editorial";
  const costAmount = CREDIT_COST[normalizedLicense];
  if (costAmount === undefined) {
    return NextResponse.json({ error: "Invalid licenseType" }, { status: 400 });
  }

  const userId = session.user.id;
  const now = new Date();
  const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const existing = await prisma.download.findFirst({
    where: {
      userId,
      photoId,
      licenseType: normalizedLicense,
      createdAt: { gte: cutoff },
    },
    select: { id: true },
  });

  if (!existing) {
    const deducted = await prisma.credit.updateMany({
      where: {
        userId,
        balance: { gte: costAmount },
      },
      data: {
        balance: { decrement: costAmount },
      },
    });

    if (deducted.count === 0) {
      const credit = await prisma.credit.findUnique({
        where: { userId },
        select: { balance: true },
      });
      return NextResponse.json(
        { error: "Insufficient credits", balance: credit?.balance ?? 0 },
        { status: 402 },
      );
    }

    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    await prisma.download.create({
      data: {
        userId,
        photoId,
        photoName: photoName || null,
        licenseType: normalizedLicense,
        creditsUsed: costAmount,
        expiresAt,
      },
    });
  }

  try {
    const token = makeToken(photoId);
    return NextResponse.json({ token, redownload: !!existing });
  } catch {
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
  }
}
