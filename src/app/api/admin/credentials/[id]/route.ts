import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../../_check";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;
  const { id } = await params;
  const { action, discount = 20, note } = await req.json();

  const credential = await prisma.mediaCredential.findUnique({ where: { id } });
  if (!credential) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    const normalizedDiscount = Number(discount);
    if (!Number.isInteger(normalizedDiscount) || normalizedDiscount < 0 || normalizedDiscount > 100) {
      return NextResponse.json({ error: "Invalid discount" }, { status: 400 });
    }

    await Promise.all([
      prisma.mediaCredential.update({
        where: { id },
        data: { status: "approved", reviewNote: note ?? null, reviewedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: credential.userId },
        data: { pressVerified: true, pressDiscount: normalizedDiscount },
      }),
    ]);
    logActivity({
      userId: credential.userId,
      action: "credential_review",
      detail: `approved, discount=${normalizedDiscount}%`,
    }).catch(() => {});
    return NextResponse.json({ ok: true, status: "approved" });
  }

  if (action === "reject") {
    await prisma.mediaCredential.update({
      where: { id },
      data: { status: "rejected", reviewNote: note ?? null, reviewedAt: new Date() },
    });
    logActivity({
      userId: credential.userId,
      action: "credential_review",
      detail: `rejected${note ? `: ${note}` : ""}`,
    }).catch(() => {});
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
