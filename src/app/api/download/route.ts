import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const maxDuration = 60;

const R2_BASE = process.env.R2_BASE ?? "";

// presigned URL 생성용 — forcePathStyle 명시
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT ?? "",
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID     ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
  forcePathStyle: true,
});
const BUCKET = process.env.R2_BUCKET ?? "";

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
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }
  if (!verifyToken(url, token)) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }
  if (R2_BASE && !url.startsWith(R2_BASE)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // URL에서 R2 key 추출 (공백/한글 그대로 유지 — SDK가 내부에서 인코딩)
  const key      = url.replace(R2_BASE.replace(/\/$/, "") + "/", "");
  const filename = key.split("/").pop()?.split("?")[0] ?? "tenasia-photo.jpg";

  console.log("[download] key:", JSON.stringify(key));

  try {
    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key:    key,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        ResponseContentType: "application/octet-stream",
      }),
      { expiresIn: 300 },
    );

    console.log("[download] presigned ok, host:", new URL(presignedUrl).host);
    return NextResponse.json({ url: presignedUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[download] presign error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
