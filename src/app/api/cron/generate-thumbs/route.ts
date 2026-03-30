import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT ?? "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const BUCKET = process.env.R2_BUCKET ?? "";

const THUMB_WIDTH   = 480;
const THUMB_QUALITY = 75;
const BATCH_LIMIT   = 50; // 한 번 실행당 최대 처리 수 (Vercel 10s timeout 고려)

async function readStream(body: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function listAllKeys(prefix: string): Promise<Set<string>> {
  const keys = new Set<string>();
  let token: string | undefined;
  do {
    const r = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: token,
      MaxKeys: 1000,
    }));
    for (const obj of r.Contents ?? []) {
      if (obj.Key) keys.add(obj.Key);
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function generateThumb(key: string): Promise<void> {
  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const buffer = await readStream(obj.Body as AsyncIterable<Uint8Array>);
  const thumb = await sharp(buffer)
    .resize(THUMB_WIDTH, undefined, { withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer();
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `thumbs/${THUMB_WIDTH}/${key}`,
    Body: thumb,
    ContentType: "image/webp",
  }));
}

export async function GET(req: NextRequest) {
  // Vercel Cron 인증 (Authorization: Bearer {CRON_SECRET})
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!BUCKET) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  try {
    const [photoKeys, thumbKeys] = await Promise.all([
      listAllKeys("photos/"),
      listAllKeys(`thumbs/${THUMB_WIDTH}/photos/`),
    ]);

    // 썸네일 키를 photos/ 형식으로 변환하여 비교
    const existingThumbs = new Set<string>();
    for (const k of thumbKeys) {
      // thumbs/480/photos/... → photos/...
      const original = k.replace(`thumbs/${THUMB_WIDTH}/`, "");
      existingThumbs.add(original);
    }

    const missing: string[] = [];
    for (const key of photoKeys) {
      if (/\.(jpg|jpeg|png|webp)$/i.test(key) && !existingThumbs.has(key)) {
        missing.push(key);
      }
    }

    const batch = missing.slice(0, BATCH_LIMIT);
    let done = 0;
    const errors: string[] = [];

    for (const key of batch) {
      try {
        await generateThumb(key);
        done++;
      } catch (e) {
        errors.push(key);
        console.error(`Thumb generation failed: ${key}`, e);
      }
    }

    return NextResponse.json({
      total: photoKeys.size,
      missing: missing.length,
      processed: done,
      remaining: missing.length - done,
      errors: errors.length,
    });
  } catch (e) {
    console.error("Cron generate-thumbs error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
