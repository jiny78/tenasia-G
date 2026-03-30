import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireEnv } from "@/lib/env";

export const maxDuration = 60;

const R2_BASE = requireEnv("R2_BASE");

const s3 = new S3Client({
  region: "auto",
  endpoint: requireEnv("R2_ENDPOINT"),
  credentials: {
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
  },
  forcePathStyle: true,
});
const BUCKET = requireEnv("R2_BUCKET");

function verifyToken(url: string, token: string): boolean {
  const secret = process.env.DOWNLOAD_SECRET;
  if (!secret) return false;
  const now = Math.floor(Date.now() / 30000);
  for (const window of [now, now - 1]) {
    const expected = createHmac("sha256", secret)
      .update(`${url}:${window}`)
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
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }
  if (!verifyToken(url, token)) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  const normalizedBase = R2_BASE.replace(/\/$/, "");
  const key = url.startsWith(normalizedBase)
    ? url.replace(`${normalizedBase}/`, "")
    : url;
  const filename = key.split("/").pop()?.split("?")[0] ?? "tenasia-photo.jpg";

  try {
    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        ResponseContentType: "application/octet-stream",
      }),
      { expiresIn: 300 },
    );

    return NextResponse.json({ url: presignedUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[download] presign error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
