import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export const maxDuration = 60;

const R2_BASE = process.env.R2_BASE ?? "";

function verifyToken(url: string, token: string): boolean {
  const secret = process.env.DOWNLOAD_SECRET;
  if (!secret) return false;
  const now = Math.floor(Date.now() / 30000);
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
  const url   = req.nextUrl.searchParams.get("url");
  const token = req.nextUrl.searchParams.get("token");

  if (!url || !token) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  if (!verifyToken(url, token)) {
    return new NextResponse("Invalid or expired token", { status: 403 });
  }

  if (R2_BASE && !url.startsWith(R2_BASE)) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const key      = url.replace(R2_BASE.replace(/\/$/, "") + "/", "");
  const filename = key.split("/").pop()?.split("?")[0] ?? "tenasia-photo.jpg";

  // S3 SDK 대신 R2 공개 CDN URL로 직접 fetch
  // url에 한글/공백이 포함될 수 있으므로 encodeURI로 유효한 URL로 변환
  const safeUrl = encodeURI(url);
  console.log("[download] fetching:", safeUrl);
  const r2Res = await fetch(safeUrl, {
    signal: AbortSignal.timeout(55000),
  }).catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[download] fetch error:", msg);
    return null;
  });

  if (!r2Res) {
    return new NextResponse("Fetch to R2 failed (network)", { status: 500 });
  }
  if (!r2Res.ok) {
    console.error("[download] R2 responded:", r2Res.status, "url:", url);
    return new NextResponse(`R2 error: ${r2Res.status}`, { status: r2Res.status });
  }

  const buffer = await r2Res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        r2Res.headers.get("content-type") ?? "image/jpeg",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length":      String(buffer.byteLength),
      "Cache-Control":       "no-store",
      "X-Robots-Tag":        "noindex",
    },
  });
}
