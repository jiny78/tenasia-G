import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../../_check";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;
  const { id } = await params;
  const { action, discount = 20, note } = await req.json();

  const cred = await prisma.mediaCredential.findUnique({ where: { id } });
  if (!cred) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    await Promise.all([
      prisma.mediaCredential.update({
        where: { id },
        data: { status: "approved", reviewNote: note ?? null, reviewedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: cred.userId },
        data: { pressVerified: true, pressDiscount: discount },
      }),
    ]);
    logActivity({ userId: cred.userId, action: "credential_review", detail: `approved, discount=${discount}%` }).catch(() => {});
    return NextResponse.json({ ok: true, status: "approved" });
  }

  if (action === "reject") {
    await prisma.mediaCredential.update({
      where: { id },
      data: { status: "rejected", reviewNote: note ?? null, reviewedAt: new Date() },
    });
    logActivity({ userId: cred.userId, action: "credential_review", detail: `rejected${note ? ": " + note : ""}` }).catch(() => {});
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
