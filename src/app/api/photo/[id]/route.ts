import { NextRequest, NextResponse } from "next/server";
import { S3Client, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "crypto";
import { getAllPhotos } from "@/lib/r2";
import { decodePhotoKey } from "@/lib/photoKey";

const s3 = new S3Client({
  region:   "auto",
  endpoint: process.env.R2_ENDPOINT ?? "",
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID     ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET  = process.env.R2_BUCKET  ?? "";
const R2_BASE = process.env.R2_BASE    ?? "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let key: string;
  try {
    key = decodePhotoKey(id);
  } catch {
    return NextResponse.json({ error: "Invalid photo id" }, { status: 400 });
  }

  try {
    // ── 파일 크기 ─────────────────────────────────────────
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    const fileSize = head.ContentLength ?? 0;

    // ── 이미지 치수 (처음 64KB) ───────────────────────────
    let width = 0, height = 0, format = "jpeg";
    try {
      const obj = await s3.send(new GetObjectCommand({
        Bucket: BUCKET,
        Key:    key,
        Range:  "bytes=0-65535",
      }));
      const chunks: Buffer[] = [];
      for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) {
        chunks.push(Buffer.from(chunk));
      }
      const buf   = Buffer.concat(chunks);
      const sharp = (await import("sharp")).default;
      const meta  = await sharp(buf).metadata();
      width  = meta.width  ?? 0;
      height = meta.height ?? 0;
      format = meta.format ?? "jpeg";
    } catch { /* 치수 불명 시 0으로 유지 */ }

    // ── Photo 기본 정보 (r2 캐시) ─────────────────────────
    const allPhotos = await getAllPhotos();
    const photo     = allPhotos.find((p) => p.id === key);

    // ── Photo ID: TEN-YYYY-HASH4 ──────────────────────────
    const year    = photo?.date?.slice(0, 4) ?? "0000";
    const hash    = createHash("md5").update(key).digest("hex").slice(0, 4).toUpperCase();
    const photoId = `TEN-${year}-${hash}`;

    // ── 방향 ──────────────────────────────────────────────
    const orientation =
      width > height ? "landscape" :
      width < height ? "portrait"  : "square";

    return NextResponse.json({
      id,
      key,
      url:         photo?.url ?? `${R2_BASE}/${key}`,
      person:      photo?.person ?? null,
      event:       photo?.role   ?? null,
      date:        photo?.date   ?? null,
      resolution:  { width, height },
      fileSize,
      orientation,
      photoId,
      format,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
