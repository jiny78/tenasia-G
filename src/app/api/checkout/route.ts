import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const stripe  = new Stripe(secretKey);
    const session = await getServerSession(authOptions);
    const { priceId, credits } = await req.json();

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_URL ?? "";

    // 프레스 할인 적용
    const discountPct = session?.user?.pressDiscount ?? 0;
    const discounts: Stripe.Checkout.SessionCreateParams["discounts"] = [];
    if (discountPct > 0 && session?.user?.pressVerified) {
      // 프레스 인증 쿠폰은 별도 생성 필요 — 현재는 메타데이터에만 기록
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}`,
      metadata: {
        credits: String(credits),
        userId:  session?.user?.id ?? "",
      },
      ...(discounts.length ? { discounts } : {}),
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
