import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../../_check";
import { logActivity } from "@/lib/activity-log";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      credits: true,
      mediaCredential: true,
      purchases: { orderBy: { createdAt: "desc" }, take: 20 },
      downloads: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;
  const { id } = await params;
  const body = await req.json();

  if (body.action === "adjustCredits") {
    const amount = Number(body.amount);
    const reason = typeof body.reason === "string" ? body.reason : "";

    if (!Number.isInteger(amount) || amount === 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (amount > 0) {
      const updated = await prisma.credit.upsert({
        where: { userId: id },
        create: { userId: id, balance: amount },
        update: { balance: { increment: amount } },
      });
      logActivity({ userId: id, action: "credit_adjust", detail: `+${amount} | ${reason}` }).catch(() => {});
      return NextResponse.json({ balance: updated.balance });
    }

    const decrement = Math.abs(amount);
    const deducted = await prisma.credit.updateMany({
      where: {
        userId: id,
        balance: { gte: decrement },
      },
      data: {
        balance: { decrement },
      },
    });

    if (deducted.count === 0) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const updated = await prisma.credit.findUnique({
      where: { userId: id },
      select: { balance: true },
    });
    logActivity({ userId: id, action: "credit_adjust", detail: `${amount} | ${reason}` }).catch(() => {});
    return NextResponse.json({ balance: updated?.balance ?? 0 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
