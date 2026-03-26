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

const CACHE_IMMUTABLE = "public, max-age=604800, s-maxage=604800, immutable";

async function readStream(body: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

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

  if (!BUCKET) return new NextResponse("Storage not configured", { status: 503 });

  const wParam = req.nextUrl.searchParams.get("w");
  const targetWidth = wParam ? Math.min(parseInt(wParam, 10), 2400) : null;
  const acceptsWebP = req.headers.get("accept")?.includes("image/webp") ?? false;

  const commonHeaders = {
    "Vary": "Accept",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, noarchive",
  };

  try {
    // ── 리사이즈 요청 ───────────────────────────────────────────
    if (targetWidth) {
      // 1) 사전 생성된 썸네일 먼저 확인 (WebP, thumbs/{width}/{key})
      const thumbKey = `thumbs/${targetWidth}/${decoded}`;
      try {
        const thumbObj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: thumbKey }));
        const thumbBuffer = await readStream(thumbObj.Body as AsyncIterable<Uint8Array>);

        if (acceptsWebP) {
          // 썸네일이 WebP이므로 그대로 반환
          return new NextResponse(new Uint8Array(thumbBuffer), {
            headers: {
              "Content-Type": "image/webp",
              "Cache-Control": CACHE_IMMUTABLE,
              ...commonHeaders,
            },
          });
        } else {
          // WebP 썸네일 → JPEG 변환 (원본 대비 수십배 빠름)
          const jpeg = await sharp(thumbBuffer).jpeg({ quality: 75 }).toBuffer();
          return new NextResponse(new Uint8Array(jpeg), {
            headers: {
              "Content-Type": "image/jpeg",
              "Cache-Control": CACHE_IMMUTABLE,
              ...commonHeaders,
            },
          });
        }
      } catch {
        // 썸네일 없음 → on-demand 처리로 폴백
      }

      // 2) On-demand: 원본 다운로드 후 리사이징 (폴백)
      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: decoded }));
      const buffer = await readStream(obj.Body as AsyncIterable<Uint8Array>);

      const img = sharp(buffer).resize(targetWidth, undefined, { withoutEnlargement: true });
      const resized = acceptsWebP
        ? await img.webp({ quality: 75 }).toBuffer()
        : await img.jpeg({ quality: 75, progressive: true }).toBuffer();

      return new NextResponse(new Uint8Array(resized), {
        headers: {
          "Content-Type": acceptsWebP ? "image/webp" : "image/jpeg",
          "Cache-Control": CACHE_IMMUTABLE,
          ...commonHeaders,
        },
      });
    }

    // ── 원본 반환 ──────────────────────────────────────────────
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: decoded }));
    const buffer = await readStream(obj.Body as AsyncIterable<Uint8Array>);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": obj.ContentType ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        ...commonHeaders,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
