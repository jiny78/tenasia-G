import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createHmac } from "crypto";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { requireEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const CREDIT_COST: Record<string, Record<string, number>> = {
  editorial: { web: 1, print: 2, original: 3 },
  commercial: { web: 3, print: 5, original: 8 },
  extended: { web: 15, print: 15, original: 15 },
  single: { web: 0, print: 0, original: 0 },
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

  const { photoId, photoName, licenseType = "editorial", resolution = "web" } = await req.json();
  if (!photoId || typeof photoId !== "string") {
    return NextResponse.json({ error: "Missing photoId" }, { status: 400 });
  }

  const normalizedLicense = typeof licenseType === "string" ? licenseType.toLowerCase() : "editorial";
  const normalizedResolution = typeof resolution === "string" ? resolution.toLowerCase() : "web";
  const costAmount = CREDIT_COST[normalizedLicense]?.[normalizedResolution];
  if (costAmount === undefined) {
    return NextResponse.json({ error: "Invalid licenseType or resolution" }, { status: 400 });
  }

  const userId = session.user.id;
  const now = new Date();
  const lockKey = `${userId}:${photoId}:${normalizedLicense}:${normalizedResolution}`;

  let redownload = false;

  try {
    const txn = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const existing = await tx.download.findFirst({
        where: {
          userId,
          photoId,
          licenseType: normalizedLicense,
          resolution: normalizedResolution,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (existing) {
        return { redownload: true };
      }

      const deducted = await tx.credit.updateMany({
        where: {
          userId,
          balance: { gte: costAmount },
        },
        data: {
          balance: { decrement: costAmount },
        },
      });

      if (deducted.count === 0) {
        const credit = await tx.credit.findUnique({
          where: { userId },
          select: { balance: true },
        });
        throw new NextResponse(
          JSON.stringify({ error: "Insufficient credits", balance: credit?.balance ?? 0 }),
          {
            status: 402,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      await tx.download.create({
        data: {
          userId,
          photoId,
          photoName: photoName || null,
          licenseType: normalizedLicense,
          resolution: normalizedResolution,
          creditsUsed: costAmount,
          expiresAt,
        },
      });

      return { redownload: false };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    redownload = txn.redownload;
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }

  try {
    const token = makeToken(photoId);
    return NextResponse.json({ token, redownload });
  } catch {
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
  }
}
