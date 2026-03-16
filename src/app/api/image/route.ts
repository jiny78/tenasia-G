import { NextRequest, NextResponse } from "next/server";

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

  const imageUrl = `${R2_BASE.replace(/\/$/, "")}/${decoded}`;

  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "TenasiaGallery/1.0" },
    });

    if (!res.ok) return new NextResponse("Not found", { status: 404 });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(buffer, {
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
