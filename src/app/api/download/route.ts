import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const R2_BASE = process.env.R2_BASE ?? "";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT ?? "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const BUCKET = process.env.R2_BUCKET ?? "";

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
    // R2_BASE prefix를 제거해 S3 key 추출
    const key = url.replace(R2_BASE.replace(/\/$/, "") + "/", "");
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const contentType = obj.ContentType ?? "image/jpeg";
    const filename = key.split("/").pop()?.split("?")[0] ?? "tenasia-photo.jpg";

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
