import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function makeToken(url: string): string {
  const secret = requireEnv("DOWNLOAD_SECRET");
  const window = Math.floor(Date.now() / 30000);
  return createHmac("sha256", secret)
    .update(`${url}:${window}`)
    .digest("hex")
    .slice(0, 24);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const download = await prisma.download.findFirst({
    where: {
      userId: session.user.id,
      photoId: url,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!download) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const token = makeToken(url);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
  }
}
