import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/account/credits — 잔액 조회
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credit = await prisma.credit.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ balance: credit?.balance ?? 0 });
}

// POST /api/account/credits — 크레딧 차감 (action: "spend")
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, amount = 1 } = await req.json();
  if (action !== "spend") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const credit = await prisma.credit.findUnique({
    where: { userId: session.user.id },
  });
  const balance = credit?.balance ?? 0;
  if (balance < amount) {
    return NextResponse.json({ error: "Insufficient credits", balance }, { status: 402 });
  }

  const updated = await prisma.credit.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, balance: 0 },
    update: { balance: { decrement: amount } },
  });

  return NextResponse.json({ success: true, balance: updated.balance });
}
