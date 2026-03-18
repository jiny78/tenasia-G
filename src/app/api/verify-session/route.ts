import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function GET(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const stripe       = new Stripe(secretKey);
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const credits = parseInt(stripeSession.metadata?.credits ?? "0", 10);

    // 로그인 사용자: DB 크레딧 업데이트
    const authSession = await getServerSession(authOptions);
    if (authSession?.user?.id) {
      const userId = authSession.user.id;

      // 중복 처리 방지: Purchase 레코드 체크
      const existing = await prisma.purchase.findUnique({
        where: { stripeSessionId: sessionId },
      });

      if (!existing) {
        await Promise.all([
          prisma.credit.upsert({
            where:  { userId },
            create: { userId, balance: credits },
            update: { balance: { increment: credits } },
          }),
          prisma.purchase.create({
            data: {
              userId,
              stripeSessionId: sessionId,
              amount:       stripeSession.amount_total ?? 0,
              currency:     stripeSession.currency ?? "usd",
              creditsAdded: credits,
            },
          }),
        ]);
        logActivity({ userId, action: "purchase", detail: `${credits} credits, $${(stripeSession.amount_total ?? 0) / 100}` }).catch(() => {});
      }

      const credit = await prisma.credit.findUnique({ where: { userId } });
      return NextResponse.json({
        credits,
        sessionId,
        dbUpdated: true,
        balance: credit?.balance ?? 0,
      });
    }

    // 비로그인 사용자: 크레딧 수만 반환 (localStorage에 저장은 클라이언트가 처리)
    return NextResponse.json({ credits, sessionId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
