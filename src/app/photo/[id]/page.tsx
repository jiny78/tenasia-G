import { Metadata } from "next";
import { notFound } from "next/navigation";
import { S3Client, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "crypto";
import { getAllPhotos, cacheOrientation } from "@/lib/r2";
import { decodePhotoKey, encodePhotoKey } from "@/lib/photoKey";
import PhotoDetailClient from "@/components/PhotoDetailClient";

// ── S3 클라이언트 ─────────────────────────────────────────────
const s3 = new S3Client({
  region:   "auto",
  endpoint: process.env.R2_ENDPOINT ?? "",
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID     ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const BUCKET  = process.env.R2_BUCKET ?? "";
const R2_BASE = process.env.R2_BASE   ?? "";

// ── 타입 ─────────────────────────────────────────────────────
export interface PhotoMeta {
  id:          string;
  key:         string;
  url:         string;
  person:      string | null;
  event:       string | null;
  date:        string | null;
  resolution:  { width: number; height: number };
  fileSize:    number;
  orientation: "landscape" | "portrait" | "square";
  photoId:     string;
  format:      string;
}

// ── 데이터 조회 (서버사이드) ──────────────────────────────────
async function getPhotoMeta(id: string): Promise<PhotoMeta | null> {
  let key: string;
  try { key = decodePhotoKey(id); } catch { return null; }

  try {
    const head     = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    const fileSize = head.ContentLength ?? 0;

    let width = 0, height = 0, format = "jpeg";
    try {
      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key, Range: "bytes=0-65535" }));
      const chunks: Buffer[] = [];
      for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) chunks.push(Buffer.from(chunk));
      const sharp = (await import("sharp")).default;
      const meta  = await sharp(Buffer.concat(chunks)).metadata();
      width = meta.width ?? 0; height = meta.height ?? 0; format = meta.format ?? "jpeg";
      cacheOrientation(key, width, height);
    } catch { /* ignore */ }

    const allPhotos = await getAllPhotos();
    const photo     = allPhotos.find((p) => p.id === key);
    const year      = photo?.date?.slice(0, 4) ?? "0000";
    const hash      = createHash("md5").update(key).digest("hex").slice(0, 4).toUpperCase();

    return {
      id,
      key,
      url:         photo?.url ?? `${R2_BASE}/${key}`,
      person:      photo?.person ?? null,
      event:       photo?.role   ?? null,
      date:        photo?.date   ?? null,
      resolution:  { width, height },
      fileSize,
      orientation: width > height ? "landscape" : width < height ? "portrait" : "square",
      photoId:     `TEN-${year}-${hash}`,
      format,
    };
  } catch { return null; }
}

// ── generateMetadata ─────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const data   = await getPhotoMeta(id);
  if (!data) return { title: "Photo | Tenasia Gallery" };

  const title = [data.person, data.event].filter(Boolean).join(" — ") + " | Tenasia Gallery";
  return {
    title,
    openGraph: {
      title,
      images: [{ url: data.url, width: data.resolution.width || 1200, height: data.resolution.height || 800 }],
    },
  };
}

// ── Page ─────────────────────────────────────────────────────
export default async function PhotoPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data   = await getPhotoMeta(id);
  if (!data) notFound();

  // 같은 이벤트 사진 목록 (이전/다음 + 관련)
  const allPhotos = await getAllPhotos();
  const siblings  = data.event
    ? allPhotos.filter((p) => p.role === data.event && p.id !== data.key)
    : allPhotos.filter((p) => p.person === data.person && p.id !== data.key);

  // 현재 이벤트 내 정렬된 목록에서 인접 사진 찾기
  const eventList = data.event
    ? allPhotos.filter((p) => p.role === data.event)
    : allPhotos.filter((p) => p.person === data.person);
  const curIdx    = eventList.findIndex((p) => p.id === data.key);
  const prevPhoto = curIdx > 0                     ? eventList[curIdx - 1] : null;
  const nextPhoto = curIdx < eventList.length - 1  ? eventList[curIdx + 1] : null;

  // 관련 사진 8장 (같은 이벤트 없으면 같은 아티스트)
  let related = siblings.slice(0, 8);
  if (related.length < 2 && data.person) {
    related = allPhotos
      .filter((p) => p.person === data.person && p.id !== data.key)
      .slice(0, 8);
  }

  const relatedMeta: PhotoMeta[] = related.map((p) => {
    const y = p.date?.slice(0, 4) ?? "0000";
    const h = createHash("md5").update(p.id).digest("hex").slice(0, 4).toUpperCase();
    return {
      id:          encodePhotoKey(p.id),
      key:         p.id,
      url:         p.url,
      person:      p.person,
      event:       p.role,
      date:        p.date,
      resolution:  { width: 0, height: 0 },
      fileSize:    0,
      orientation: "landscape",
      photoId:     `TEN-${y}-${h}`,
      format:      "jpeg",
    };
  });

  return (
    <PhotoDetailClient
      data={data}
      related={relatedMeta}
      prevId={prevPhoto ? encodePhotoKey(prevPhoto.id) : null}
      nextId={nextPhoto ? encodePhotoKey(nextPhoto.id) : null}
    />
  );
}
