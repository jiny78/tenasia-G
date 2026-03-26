import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT ?? "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const BUCKET = process.env.R2_BUCKET ?? "";

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

  if (!BUCKET) {
    return new NextResponse("Storage not configured", { status: 503 });
  }

  // w 파라미터: 썸네일 너비 (없으면 원본 반환)
  const wParam = req.nextUrl.searchParams.get("w");
  const targetWidth = wParam ? Math.min(parseInt(wParam, 10), 2400) : null;

  const acceptsWebP = req.headers.get("accept")?.includes("image/webp") ?? false;

  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: decoded }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    // 리사이징 요청인 경우 sharp로 처리
    if (targetWidth) {
      const img = sharp(buffer).resize(targetWidth, undefined, { withoutEnlargement: true });
      const resized = acceptsWebP
        ? await img.webp({ quality: 75 }).toBuffer()
        : await img.jpeg({ quality: 75, progressive: true }).toBuffer();

      return new NextResponse(new Uint8Array(resized), {
        headers: {
          "Content-Type": acceptsWebP ? "image/webp" : "image/jpeg",
          "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
          "Vary": "Accept",
          "X-Content-Type-Options": "nosniff",
          "X-Robots-Tag": "noindex, noarchive",
        },
      });
    }

    const contentType = obj.ContentType ?? "image/jpeg";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, noarchive",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
