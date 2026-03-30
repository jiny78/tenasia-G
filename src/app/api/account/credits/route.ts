import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseSpendAmount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
}

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, amount } = await req.json();
  if (action !== "spend") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const spendAmount = parseSpendAmount(amount);
  if (!spendAmount) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const deducted = await prisma.credit.updateMany({
    where: {
      userId: session.user.id,
      balance: { gte: spendAmount },
    },
    data: {
      balance: { decrement: spendAmount },
    },
  });

  if (deducted.count === 0) {
    const credit = await prisma.credit.findUnique({
      where: { userId: session.user.id },
      select: { balance: true },
    });

    return NextResponse.json(
      { error: "Insufficient credits", balance: credit?.balance ?? 0 },
      { status: 402 },
    );
  }

  const updated = await prisma.credit.findUnique({
    where: { userId: session.user.id },
    select: { balance: true },
  });

  return NextResponse.json({ success: true, balance: updated?.balance ?? 0 });
}
