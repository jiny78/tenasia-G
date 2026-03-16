import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const R2_BASE = process.env.R2_BASE ?? "";

function verifyToken(url: string, token: string): boolean {
  const secret = process.env.DOWNLOAD_SECRET;
  if (!secret) return false;

  const now = Math.floor(Date.now() / 30000);
  // 현재 윈도우와 직전 윈도우 허용 (최대 60초)
  for (const w of [now, now - 1]) {
    const expected = createHmac("sha256", secret)
      .update(`${url}:${w}`)
      .digest("hex")
      .slice(0, 24);
    if (expected === token) return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const token = req.nextUrl.searchParams.get("token");

  if (!url || !token) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  // HMAC 토큰 검증
  if (!verifyToken(url, token)) {
    return new NextResponse("Invalid or expired token", { status: 403 });
  }

  // R2 도메인 검증 (토큰 검증 후 추가 안전장치)
  if (R2_BASE && !url.startsWith(R2_BASE)) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const res = await fetch(url, { headers: { "User-Agent": "TenasiaGallery/1.0" } });
    if (!res.ok) return new NextResponse("Image not found", { status: 404 });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const filename = url.split("/").pop()?.split("?")[0] ?? "tenasia-photo.jpg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch {
    return new NextResponse("Download failed", { status: 500 });
  }
}
