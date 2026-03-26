/**
 * 기존 R2 사진 전체 썸네일 사전 생성 스크립트
 *
 * 실행: node scripts/generate-thumbs.mjs
 *
 * - photos/ 아래 모든 이미지를 480px WebP로 변환
 * - thumbs/480/{original_key} 에 업로드
 * - 이미 존재하면 스킵 (재실행 안전)
 * - 동시 처리 5개
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ── .env.local 파싱 ────────────────────────────────────────────
const envPath = join(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.error("❌ .env.local 파일이 없습니다. 프로젝트 루트에서 실행하세요.");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx < 0) continue;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  env[key] = val;
}

const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = env;
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error("❌ R2 환경변수가 없습니다 (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)");
  process.exit(1);
}

// ── 설정 ───────────────────────────────────────────────────────
const THUMB_WIDTH   = 480;
const THUMB_QUALITY = 75;
const CONCURRENCY   = 5;
const THUMB_PREFIX  = `thumbs/${THUMB_WIDTH}/`;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// ── R2 photos/ 전체 목록 ───────────────────────────────────────
async function listAllPhotos() {
  const keys = [];
  let token;
  do {
    const r = await s3.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: "photos/",
      ContinuationToken: token,
      MaxKeys: 1000,
    }));
    for (const obj of r.Contents ?? []) {
      if (/\.(jpg|jpeg|png|webp)$/i.test(obj.Key ?? "")) keys.push(obj.Key);
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

// ── 썸네일 존재 여부 확인 ──────────────────────────────────────
async function thumbExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: THUMB_PREFIX + key }));
    return true;
  } catch {
    return false;
  }
}

// ── 썸네일 생성 + 업로드 ───────────────────────────────────────
async function generateThumb(key) {
  const obj = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of obj.Body) chunks.push(chunk);
  const original = Buffer.concat(chunks);

  const thumb = await sharp(original)
    .resize(THUMB_WIDTH, undefined, { withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer();

  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: THUMB_PREFIX + key,
    Body: thumb,
    ContentType: "image/webp",
  }));

  return thumb.length;
}

// ── 동시성 제한 실행 ───────────────────────────────────────────
async function pool(items, fn, limit) {
  const results = [];
  const running = new Set();

  for (const item of items) {
    const p = fn(item).finally(() => running.delete(p));
    results.push(p);
    running.add(p);
    if (running.size >= limit) await Promise.race(running);
  }

  return Promise.allSettled(results);
}

// ── 메인 ───────────────────────────────────────────────────────
async function main() {
  console.log("📋 R2에서 사진 목록 가져오는 중...");
  const photos = await listAllPhotos();
  console.log(`📷 총 ${photos.length}장 발견\n`);

  let done = 0, skipped = 0, errors = 0;
  const startTime = Date.now();

  await pool(photos, async (key) => {
    const num = photos.indexOf(key) + 1;
    const name = key.split("/").pop();

    if (await thumbExists(key)) {
      skipped++;
      process.stdout.write(`\r[${num}/${photos.length}] ⏭  스킵: ${name.slice(0, 50).padEnd(52)}`);
      return;
    }

    try {
      const bytes = await generateThumb(key);
      done++;
      process.stdout.write(`\r[${num}/${photos.length}] ✅ 생성: ${name.slice(0, 40).padEnd(42)} ${(bytes / 1024).toFixed(0).padStart(5)}KB`);
    } catch (e) {
      errors++;
      console.error(`\n❌ 오류: ${key} — ${e.message}`);
    }
  }, CONCURRENCY);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✨ 완료! 생성: ${done}장 | 스킵: ${skipped}장 | 오류: ${errors}장 | 소요: ${elapsed}초`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
