import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
  const license    = (licenseType ?? "editorial").toLowerCase();
  const resolution_ = (resolution  ?? "web").toLowerCase();

  const costRow = CREDIT_COST[license];
  if (!costRow) {
    return NextResponse.json({ error: `알 수 없는 licenseType: ${license}` }, { status: 400 });
  }
  const creditCost = costRow[resolution_];
  if (creditCost === undefined) {
    return NextResponse.json({ error: `알 수 없는 resolution: ${resolution_}` }, { status: 400 });
  }

  const photoName = photoId.split("/").pop() ?? "tenasia-photo.jpg";
  const now       = new Date();
  const cutoff90  = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // 3. 90일 내 동일 사진 + 동일 라이선스 재다운로드 확인 (무료 재다운로드)
  const existing = await prisma.download.findFirst({
    where: {
      userId,
      photoId,
      licenseType: license,
      createdAt: { gte: cutoff90 },
    },
    select: { id: true },
  });

  let usedCredits = 0;

  if (!existing) {
    // 4. Atomic 크레딧 차감:
    //    UPDATE "Credit" SET balance = balance - N
    //    WHERE "userId" = ? AND balance >= N
    //    → count === 0 이면 잔액 부족 (race condition 안전)
    const deducted = await prisma.credit.updateMany({
      where: {
        userId,
        balance: { gte: creditCost },
      },
      data: {
        balance: { decrement: creditCost },
      },
    });

    if (deducted.count === 0) {
      // 현재 잔액 조회해서 프론트에 전달
      const credit  = await prisma.credit.findUnique({ where: { userId }, select: { balance: true } });
      const balance = credit?.balance ?? 0;
      return NextResponse.json(
        {
          error:        "크레딧이 부족합니다.",
          code:         "INSUFFICIENT_CREDITS",
          balance,
          required:     creditCost,
        },
        { status: 402 },
      );
    }

    usedCredits = creditCost;

    // 5. 다운로드 이력 저장
    await prisma.download.create({
      data: {
        userId,
        photoId,
        photoName,
        licenseType: license,
        creditsUsed: creditCost,
        expiresAt,
      },
    });
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

  // 업데이트된 잔액 조회
  const updatedCredit = await prisma.credit.findUnique({ where: { userId }, select: { balance: true } });
  const balance       = updatedCredit?.balance ?? 0;

  return NextResponse.json({
    downloadUrl,
    creditsUsed:  usedCredits,
    redownload:   !!existing,
    balance,
    expiresAt:    expiresAt.toISOString(),
  });
}
