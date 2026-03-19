import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const R2_BASE = process.env.R2_BASE ?? "";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return new NextResponse("Missing path", { status: 400 });

  // 경로 순회 공격 방지
  const decoded = decodeURIComponent(path);
  if (
    decoded.includes("..") ||
    decoded.startsWith("/") ||
    decoded.includes("\\") ||
    decoded.includes("\0")
  ) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  if (!R2_BASE) {
    return new NextResponse("Storage not configured", { status: 503 });
  }

  // w 파라미터: 썸네일 너비 (없으면 원본 반환)
  const wParam = req.nextUrl.searchParams.get("w");
  const targetWidth = wParam ? Math.min(parseInt(wParam, 10), 2400) : null;

  const imageUrl = `${R2_BASE.replace(/\/$/, "")}/${decoded}`;

  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "TenasiaGallery/1.0" },
    });

    if (!res.ok) return new NextResponse("Not found", { status: 404 });

    const buffer = Buffer.from(await res.arrayBuffer());

    // 리사이징 요청인 경우 sharp로 처리
    if (targetWidth) {
      const resized = await sharp(buffer)
        .resize(targetWidth, undefined, { withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true })
        .toBuffer();

      return new NextResponse(new Uint8Array(resized), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=604800, immutable",
          "X-Content-Type-Options": "nosniff",
          "X-Robots-Tag": "noindex, noarchive",
        },
      });
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, noarchive",
      },
    });
  } catch {
    return new NextResponse("Fetch failed", { status: 500 });
  }
}
