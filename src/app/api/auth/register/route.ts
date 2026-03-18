import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, company, jobTitle, country, localCredits } =
      await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name:     name     || null,
        email,
        password: hashed,
        company:  company  || null,
        jobTitle: jobTitle || null,
        country:  country  || null,
      },
    });

    // localStorage 크레딧 병합
    const merge = Math.max(0, parseInt(localCredits ?? "0", 10));
    if (merge > 0) {
      await prisma.credit.create({
        data: { userId: user.id, balance: merge },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
