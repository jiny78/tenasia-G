import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { requireEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

// ── 크레딧 차감 기준표 ──────────────────────────────────────────────
const CREDIT_COST: Record<string, Record<string, number>> = {
  editorial:  { web: 1, print: 2, original: 3  },
  commercial: { web: 3, print: 5, original: 8  },
  extended:   { web: 15, print: 15, original: 15 },
};

type Resolution = "web" | "print" | "original";

// ── R2 presigned URL 생성 클라이언트 ───────────────────────────────
const s3 = new S3Client({
  region:   "auto",
  endpoint: requireEnv("R2_ENDPOINT"),
  credentials: {
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
  },
  forcePathStyle: true,
});
const BUCKET  = requireEnv("R2_BUCKET");
const R2_BASE = requireEnv("R2_BASE");

// ── presigned URL 생성 헬퍼 ─────────────────────────────────────────
async function makePresignedUrl(key: string): Promise<string> {
  const filename = key.split("/").pop() ?? "tenasia-photo.jpg";
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket:                     BUCKET,
      Key:                        key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      ResponseContentType:        "application/octet-stream",
    }),
    { expiresIn: 600 },   // 10분 — 다운로드 시작하기 충분한 시간
  );
}

// ── POST /api/photos/download ────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. 인증 확인
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  // 2. 요청 파싱 + 유효성 검사
  let photoId: string, licenseType: string, resolution: string;
  try {
    ({ photoId, licenseType, resolution } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!photoId || typeof photoId !== "string") {
    return NextResponse.json({ error: "photoId가 필요합니다." }, { status: 400 });
  }
  const license = (licenseType ?? "editorial").toLowerCase();
  const normalizedResolution = (resolution ?? "web").toLowerCase() as Resolution;

  const costRow = CREDIT_COST[license];
  if (!costRow) {
    return NextResponse.json({ error: `알 수 없는 licenseType: ${license}` }, { status: 400 });
  }
  const creditCost = costRow[normalizedResolution];
  if (creditCost === undefined) {
    return NextResponse.json({ error: `알 수 없는 resolution: ${normalizedResolution}` }, { status: 400 });
  }

  const photoName = photoId.split("/").pop() ?? "tenasia-photo.jpg";
  const now = new Date();
  const lockKey = `${userId}:${photoId}:${license}:${normalizedResolution}`;

  let usedCredits = 0;
  let redownload = false;
  let balance = 0;
  let expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  try {
    const txn = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const existing = await tx.download.findFirst({
        where: {
          userId,
          photoId,
          licenseType: license,
          resolution: normalizedResolution,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          expiresAt: true,
        },
      });

      if (existing) {
        const credit = await tx.credit.findUnique({
          where: { userId },
          select: { balance: true },
        });
        return {
          redownload: true,
          usedCredits: 0,
          balance: credit?.balance ?? 0,
          expiresAt: existing.expiresAt,
        };
      }

      const deducted = await tx.credit.updateMany({
        where: {
          userId,
          balance: { gte: creditCost },
        },
        data: {
          balance: { decrement: creditCost },
        },
      });

      if (deducted.count === 0) {
        const credit = await tx.credit.findUnique({
          where: { userId },
          select: { balance: true },
        });
        throw new NextResponse(
          JSON.stringify({
            error: "크레딧이 부족합니다.",
            code: "INSUFFICIENT_CREDITS",
            balance: credit?.balance ?? 0,
            required: creditCost,
          }),
          {
            status: 402,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const nextExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      await tx.download.create({
        data: {
          userId,
          photoId,
          photoName,
          licenseType: license,
          resolution: normalizedResolution,
          creditsUsed: creditCost,
          expiresAt: nextExpiresAt,
        },
      });

      const credit = await tx.credit.findUnique({
        where: { userId },
        select: { balance: true },
      });

      return {
        redownload: false,
        usedCredits: creditCost,
        balance: credit?.balance ?? 0,
        expiresAt: nextExpiresAt,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    redownload = txn.redownload;
    usedCredits = txn.usedCredits;
    balance = txn.balance;
    expiresAt = txn.expiresAt;
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }

  // 6. R2 presigned URL 생성
  const key = R2_BASE
    ? photoId  // photoId가 이미 R2 key인 경우
    : photoId;

  let downloadUrl: string;
  try {
    downloadUrl = await makePresignedUrl(key);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[photos/download] presign error:", msg);
    // 크레딧은 차감됐지만 URL 생성 실패 → 기록은 남아있어 재시도 가능
    return NextResponse.json({ error: "다운로드 URL 생성에 실패했습니다. 다시 시도해주세요." }, { status: 500 });
  }

  return NextResponse.json({
    downloadUrl,
    creditsUsed: usedCredits,
    redownload,
    balance,
    expiresAt: expiresAt.toISOString(),
  });
}
