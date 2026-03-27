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

  try {
    const key      = url.replace(R2_BASE.replace(/\/$/, "") + "/", "");
    const filename = key.split("/").pop()?.split("?")[0] ?? "tenasia-photo.jpg";

    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));

    if (!obj.Body) {
      return new NextResponse("Empty file", { status: 500 });
    }

    // R2 → Vercel → 브라우저 스트리밍 (메모리 버퍼링 없음)
    const nodeStream = obj.Body as AsyncIterable<Uint8Array>;
    const webStream  = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of nodeStream) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new NextResponse(webStream, {
      headers: {
        "Content-Type":        obj.ContentType ?? "image/jpeg",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length":      String(obj.ContentLength ?? ""),
        "Cache-Control":       "no-store",
        "X-Robots-Tag":        "noindex",
      },
    });
  } catch (e) {
    console.error("Download error:", e);
    return new NextResponse("Download failed", { status: 500 });
  }
}
