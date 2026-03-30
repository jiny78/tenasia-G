import { Webhooks } from "@polar-sh/nextjs";
import { type NextRequest } from "next/server";
import { requireEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import polar from "@/lib/polar";

const LOG = "[POLAR_WEBHOOK]";

// 상품 ID → 충전 크레딧 수량 매핑
const CREDIT_MAP: Record<string, number> = {
  "f39a6822-9403-4561-b3ae-fd7479f5c847": 10,
  "55423584-6f68-469a-8d0d-d9052be47e50": 50,
  "73aaa166-f4a6-4e50-bee3-a9dd19fc832b": 100,
  "89730975-6c13-4bcf-93ec-849cfd474d80": 0,  // 단건 구매
};

const SINGLE_PHOTO_PRODUCT_ID = "89730975-6c13-4bcf-93ec-849cfd474d80";

// ── Webhooks 핸들러 (서명 검증 포함) ─────────────────────────────
const webhookHandler = Webhooks({
  webhookSecret: requireEnv("POLAR_WEBHOOK_SECRET"),

  onOrderPaid: async (payload) => {
    // payload = WebhookOrderPaidPayload { type, timestamp, data: Order }
    const order = payload.data;

    const orderId    = order.id;
    const productId  = order.productId ?? null;
    const amount     = order.totalAmount;           // cents (after discounts+taxes)
    const currency   = order.currency ?? "usd";
    const metadata   = order.metadata as Record<string, string>;
    const externalCustomerId = order.customer.externalId ?? null;
    const customerEmail      = order.customer.email;

    console.log(`${LOG} ── onOrderPaid 수신 ──────────────────────────`);
    console.log(`${LOG} orderId:            ${orderId}`);
    console.log(`${LOG} productId:          ${productId ?? "(없음)"}`);
    console.log(`${LOG} amount:             ${amount} ${currency}`);
    console.log(`${LOG} externalCustomerId: ${externalCustomerId ?? "(없음)"}`);
    console.log(`${LOG} customerEmail:      ${customerEmail ?? "(없음)"}`);
    console.log(`${LOG} metadata:           ${JSON.stringify(metadata)}`);

    // ── 1. 사용자 조회 ─────────────────────────────────────────────
    let user: { id: string } | null = null;

    if (externalCustomerId) {
      user = await prisma.user.findUnique({
        where:  { id: externalCustomerId },
        select: { id: true },
      });
      console.log(`${LOG} DB 조회 (externalId): ${user ? `found → ${user.id}` : "not found"}`);
    }
    if (!user && customerEmail) {
      user = await prisma.user.findUnique({
        where:  { email: customerEmail },
        select: { id: true },
      });
      console.log(`${LOG} DB 조회 (email):      ${user ? `found → ${user.id}` : "not found"}`);
    }
    if (!user) {
      console.error(`${LOG} ❌ 사용자를 찾을 수 없음 — 처리 중단`, {
        externalCustomerId,
        email: customerEmail,
        orderId,
      });
      return;
    }

    const creditsToAdd  = productId != null ? (CREDIT_MAP[productId] ?? 0) : 0;
    const isSinglePhoto = productId === SINGLE_PHOTO_PRODUCT_ID;
    const polarOrderKey = `polar_${orderId}`;

    console.log(`${LOG} creditsToAdd:       ${creditsToAdd}`);
    console.log(`${LOG} isSinglePhoto:      ${isSinglePhoto}`);

    // ── 2. 멱등성 체크 ─────────────────────────────────────────────
    const existing = await prisma.purchase.findUnique({
      where:  { stripeSessionId: polarOrderKey },
      select: { id: true },
    });
    if (existing) {
      console.log(`${LOG} ⚠️  중복 이벤트 감지 — 스킵 (orderId: ${orderId})`);
      return;
    }

    // ── 3. 단건 구매: checkout metadata에서 photoId 조회 ───────────
    // metadata는 checkout URL에서 넘긴 { photoId, licenseType }
    let singlePhotoId:   string | null = metadata?.photoId     ?? null;
    let singlePhotoName: string | null = metadata?.photoName   ?? null;
    let singleLicense:   string        = metadata?.licenseType ?? "editorial";

    if (isSinglePhoto) {
      console.log(`${LOG} 단건 구매 photoId:   ${singlePhotoId ?? "(메타데이터 없음)"}`);
      console.log(`${LOG} 단건 구매 license:   ${singleLicense}`);

      // metadata에 photoId가 없으면 order API 재조회 (fallback)
      if (!singlePhotoId) {
        console.log(`${LOG} order API 재조회 중 (fallback)...`);
        try {
          const orderDetail = await polar.orders.get({ id: orderId });
          const meta        = orderDetail.metadata as Record<string, string>;
          singlePhotoId   = meta?.photoId     ?? null;
          singlePhotoName = meta?.photoName   ?? null;
          singleLicense   = meta?.licenseType ?? "editorial";
          console.log(`${LOG} 재조회 photoId:   ${singlePhotoId ?? "(여전히 없음)"}`);
        } catch (e) {
          console.error(`${LOG} ❌ order 재조회 실패`, e instanceof Error ? e.stack : e);
        }
      }

      if (!singlePhotoId) {
        console.warn(`${LOG} ⚠️  photoId 없음 — 다운로드 권한 부여 불가`);
      }
    }

    // ── 4. 트랜잭션: 구매 기록 + 크레딧 충전 + 다운로드 권한 ──────
    console.log(`${LOG} DB 트랜잭션 시작...`);
    try {
      const result = await prisma.$transaction(async (tx) => {
        const purchase = await tx.purchase.create({
          data: {
            userId:          user!.id,
            stripeSessionId: polarOrderKey,
            polarProductId:  productId    ?? null,
            orderType:       isSinglePhoto ? "single_photo" : "credit_pack",
            photoId:         singlePhotoId ?? null,
            amount,
            currency:        currency ?? "usd",
            creditsAdded:    creditsToAdd,
            status:          "completed",
          },
        });

        let newBalance: number | null = null;

        if (creditsToAdd > 0) {
          const updated = await tx.credit.upsert({
            where:  { userId: user!.id },
            create: { userId: user!.id, balance: creditsToAdd },
            update: { balance: { increment: creditsToAdd } },
          });
          newBalance = updated.balance;
        }

        let downloadGranted = false;
        if (isSinglePhoto && singlePhotoId) {
          const expiresAt      = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
          const alreadyGranted = await tx.download.findFirst({
            where: { userId: user!.id, photoId: singlePhotoId, licenseType: singleLicense },
          });
          if (!alreadyGranted) {
            await tx.download.create({
              data: {
                userId:      user!.id,
                photoId:     singlePhotoId,
                photoName:   singlePhotoName,
                licenseType: singleLicense,
                creditsUsed: 0,
                purchaseId:  purchase.id,
                expiresAt,
              },
            });
            downloadGranted = true;
          } else {
            console.log(`${LOG} 이미 다운로드 권한 있음 — 중복 생성 스킵`);
          }
        }

        return { purchaseId: purchase.id, newBalance, downloadGranted };
      });

      console.log(`${LOG} ✅ 트랜잭션 완료`);
      console.log(`${LOG} purchaseId:         ${result.purchaseId}`);
      if (result.newBalance !== null) {
        console.log(`${LOG} 크레딧 충전 완료:   +${creditsToAdd} → 잔액 ${result.newBalance}`);
      }
      if (isSinglePhoto) {
        console.log(`${LOG} 다운로드 권한:      ${result.downloadGranted ? "부여됨" : "이미 존재"}`);
      }
    } catch (e) {
      console.error(`${LOG} ❌ 트랜잭션 실패`, e instanceof Error ? e.stack : e);
      throw e;  // Webhooks 헬퍼가 500 반환 → Polar가 재시도
    }

    console.log(`${LOG} ── 처리 완료 ────────────────────────────────`);
  },
});

// ── POST 핸들러: 요청 도달 여부 디버깅 로그 추가 ─────────────────
export async function POST(req: NextRequest) {
  console.log(`${LOG} ── 요청 수신 (서명 검증 전) ───────────────────`);
  console.log(`${LOG} webhook-id:        ${req.headers.get("webhook-id") ?? "(없음)"}`);
  console.log(`${LOG} webhook-timestamp: ${req.headers.get("webhook-timestamp") ?? "(없음)"}`);
  console.log(`${LOG} webhook-signature: ${(req.headers.get("webhook-signature") ?? "(없음)").slice(0, 30)}...`);
  console.log(`${LOG} content-type:      ${req.headers.get("content-type") ?? "(없음)"}`);
  console.log(`${LOG} content-length:    ${req.headers.get("content-length") ?? "(없음)"}`);

  // 바디 크기 확인 (clone으로 원본 스트림 보존)
  try {
    const clone = req.clone();
    const text  = await clone.text();
    console.log(`${LOG} body length:       ${text.length} chars`);
  } catch {
    console.log(`${LOG} body length:       (clone 실패)`);
  }

  const resp = await webhookHandler(req);
  console.log(`${LOG} 응답 상태:         ${resp.status}`);
  return resp;
}
