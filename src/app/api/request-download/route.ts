import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

function makeToken(url: string): string {
  const secret = process.env.DOWNLOAD_SECRET;
  if (!secret) throw new Error("DOWNLOAD_SECRET not set");
  // 30초 윈도우 기반 토큰 (현재 + 이전 윈도우를 /api/download에서 허용)
  const window = Math.floor(Date.now() / 30000);
  return createHmac("sha256", secret)
    .update(`${url}:${window}`)
    .digest("hex")
    .slice(0, 24);
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Referer 검증: 같은 사이트에서만 허용
  const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_URL ?? "";
  if (siteUrl && origin && !origin.startsWith(siteUrl) && !origin.startsWith("http://localhost")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const token = makeToken(url);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
  }
}
