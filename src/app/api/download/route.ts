import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url", { status: 400 });
  }

  // URL이 허용된 R2 도메인인지 검증
  const r2Base = process.env.NEXT_PUBLIC_R2_BASE ?? "";
  if (r2Base && !url.startsWith(r2Base)) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  try {
    const res = await fetch(url, { headers: { "User-Agent": "TenasiaGallery/1.0" } });
    if (!res.ok) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const filename = url.split("/").pop()?.split("?")[0] ?? "tenasia-photo.jpg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("Download failed", { status: 500 });
  }
}
