import { NextRequest, NextResponse } from "next/server";
import polar from "@/lib/polar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CREDIT_MAP: Record<string, number> = {
  "f39a6822-9403-4561-b3ae-fd7479f5c847": 10,
  "55423584-6f68-469a-8d0d-d9052be47e50": 50,
  "73aaa166-f4a6-4e50-bee3-a9dd19fc832b": 100,
};

const SINGLE_PHOTO_PRODUCT_ID = "89730975-6c13-4bcf-93ec-849cfd474d80";

// GET /api/polar/checkout-status?checkout_id=xxx
export async function GET(req: NextRequest) {
  const checkoutId = req.nextUrl.searchParams.get("checkout_id");
  if (!checkoutId) {
    return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
  }

  try {
    const checkout = await polar.checkouts.get({ id: checkoutId });

    const productId      = checkout.product?.id ?? null;
    const creditsAdded   = productId ? (CREDIT_MAP[productId] ?? 0) : 0;
    const isSinglePhoto  = productId === SINGLE_PHOTO_PRODUCT_ID;

    // 로그인 상태면 현재 잔액도 함께 반환
    let balance: number | null = null;
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const credit = await prisma.credit.findUnique({
        where:  { userId: session.user.id },
        select: { balance: true },
      });
      balance = credit?.balance ?? 0;
    }

    // 단건 구매 + 결제 완료 시: 주문 메타데이터에서 photoId 조회
    let photoId: string | null = null;
    if (isSinglePhoto && checkout.status === "succeeded") {
      try {
        const orders = await polar.orders.list({ checkoutId, limit: 1 });
        const order  = orders.result.items[0];
        if (order?.metadata) {
          photoId = (order.metadata as Record<string, string>).photoId ?? null;
        }
      } catch {
        // 조회 실패해도 나머지 응답은 정상 반환
      }
    }

    return NextResponse.json({
      status:        checkout.status,   // "open" | "confirmed" | "succeeded" | "failed" | "expired"
      creditsAdded,
      isSinglePhoto,
      photoId,
      balance,
      amount:        checkout.amount,
      currency:      checkout.currency ?? "usd",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[checkout-status]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
