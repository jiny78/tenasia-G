import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createHmac } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function makeToken(url: string): string {
  const secret = process.env.DOWNLOAD_SECRET;
  if (!secret) throw new Error("DOWNLOAD_SECRET not set");
  const window = Math.floor(Date.now() / 30000);
  return createHmac("sha256", secret)
    .update(`${url}:${window}`)
    .digest("hex")
    .slice(0, 24);
}

// GET /api/account/downloads?page=1&limit=20&license=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page    = Math.max(1, parseInt(req.nextUrl.searchParams.get("page")    ?? "1",  10));
  const limit   = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit")   ?? "20", 10));
  const license = req.nextUrl.searchParams.get("license") ?? "";
  const skip    = (page - 1) * limit;

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
  const result = downloads.map((d) => ({
    ...d,
    expired: d.expiresAt < now,
  }));

  return NextResponse.json({ downloads: result, total, page, limit });
}

// POST /api/account/downloads — 다운로드 기록 + 크레딧 차감 (또는 90일 재다운로드)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { photoId, photoUrl, photoName } = await req.json();
  if (!photoId || !photoUrl) {
    return NextResponse.json({ error: "Missing photoId or photoUrl" }, { status: 400 });
  }

  const userId = session.user.id;
  const now    = new Date();
  const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // 90일 내 동일 사진 재다운로드 확인
  const existing = await prisma.download.findFirst({
    where: {
      userId,
      photoId,
      createdAt: { gte: cutoff },
    },
  });

  if (!existing) {
    // 크레딧 차감
    const credit = await prisma.credit.findUnique({ where: { userId } });
    const balance = credit?.balance ?? 0;
    if (balance < 1) {
      return NextResponse.json({ error: "Insufficient credits", balance }, { status: 402 });
    }
    await prisma.credit.update({
      where:  { userId },
      data:   { balance: { decrement: 1 } },
    });

    // 다운로드 기록 생성 (90일 만료)
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    await prisma.download.create({
      data: {
        userId,
        photoId,
        photoName: photoName || null,
        expiresAt,
      },
    });
  }

  // 서명된 다운로드 토큰 반환
  try {
    const token = makeToken(photoUrl);
    return NextResponse.json({ token, redownload: !!existing });
  } catch {
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
  }
}
