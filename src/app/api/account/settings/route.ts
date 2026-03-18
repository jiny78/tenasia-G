import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/account/settings — 프로필 + 비밀번호 수정
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, company, jobTitle, country, currentPassword, newPassword } =
    await req.json();

  const userId = session.user.id;
  const user   = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (name     !== undefined) updateData.name     = name     || null;
  if (company  !== undefined) updateData.company  = company  || null;
  if (jobTitle !== undefined) updateData.jobTitle = jobTitle || null;
  if (country  !== undefined) updateData.country  = country  || null;

  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password required" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }
    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  await prisma.user.update({ where: { id: userId }, data: updateData });
  return NextResponse.json({ ok: true });
}
