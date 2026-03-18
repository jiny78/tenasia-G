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
      purchases:  { orderBy: { createdAt: "desc" }, take: 20 },
      downloads:  { orderBy: { createdAt: "desc" }, take: 20 },
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
    const { amount, reason } = body;
    const updated = await prisma.credit.upsert({
      where:  { userId: id },
      create: { userId: id, balance: Math.max(0, amount) },
      update: { balance: { increment: amount } },
    });
    logActivity({ userId: id, action: "credit_adjust", detail: `${amount > 0 ? "+" : ""}${amount} — ${reason}` }).catch(() => {});
    return NextResponse.json({ balance: updated.balance });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
