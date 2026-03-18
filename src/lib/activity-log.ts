import { prisma } from "@/lib/prisma";

type Action = "login" | "download" | "purchase" | "credential_submit" | "credential_review" | "credit_adjust";

export async function logActivity({
  userId,
  action,
  detail,
  ip,
}: {
  userId?: string;
  action: Action | string;
  detail?: string;
  ip?: string;
}) {
  try {
    await prisma.activityLog.create({ data: { userId, action, detail, ip } });
  } catch (e) {
    console.error("activityLog error:", e);
  }
}
