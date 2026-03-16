import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Photo, Person, DateEntry, GalleryEvent } from "@/types";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT ?? "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.R2_BUCKET ?? "";
const R2_BASE = process.env.R2_BASE ?? "";

// ── 인물명 정리 ───────────────────────────────────────────────
function cleanPerson(raw: string): string {
  return raw
    .replace(/_\d+/g, "")         // _8875 제거
    .replace(/\s*\(\d+\)\s*$/, "") // 끝의 (1) 제거
    .trim();
}

// ── 파일명 파싱 ───────────────────────────────────────────────
// 지원 포맷:
//   1) YYYY.MM.DD-행사-인물-기자 (N).jpg   (표준)
//   2) YYYY.MM.DD 행사-인물-기자 (N).jpg   (날짜 뒤 공백)
//   3) 인물_NNNN.jpg                        (날짜 없음, 인물+번호)
//   4) 기타 (폴더명에서 행사 추출)
function parseKey(key: string): Photo | null {
  if (!/\.(jpg|jpeg|png|webp)$/i.test(key)) return null;
  const segments = key.split("/");
  if (segments.length < 3 || segments[0] !== "photos") return null;

  const filename = segments[segments.length - 1].replace(/\.[^.]+$/, "");
  const eventFolder = segments[segments.length - 2] ?? "";
  // 폴더명에서 날짜 접두사 제거해 행사명 추출
  const folderEvent = eventFolder.replace(/^\d{4}[\.\-\d]*\s+/, "").trim();

  // 패턴 1+2: YYYY.MM.DD[-공백]rest
  const mDate = filename.match(/^(\d{4})\.(\d{2})\.(\d{2})[-\s](.+)$/);
  if (mDate) {
    const year = parseInt(mDate[1]);
    // 오타 방지: 합리적인 연도 범위만 허용
    const validDate = year >= 1990 && year <= 2030;
    const date = validDate ? `${mDate[1]}-${mDate[2]}-${mDate[3]}` : null;
    const fields = mDate[4].split("-");
    const event = fields[0]?.trim() || folderEvent;
    const rawPerson = fields[1]?.trim() ?? "";
    const person = cleanPerson(rawPerson);
    return {
      id: key,
      url: `${R2_BASE}/${key}`,
      person: person || null,
      role: event || null,
      date,
    };
  }

  // 패턴 3: 인물_NNNN (날짜 없는 인물 사진)
  const mPerson = filename.match(/^([^_\d][^_]+)_\d+(\s*\(\d+\))?$/);
  if (mPerson) {
    const person = mPerson[1].trim();
    return {
      id: key,
      url: `${R2_BASE}/${key}`,
      person,
      role: folderEvent || null,
      date: null,
    };
  }

  // 패턴 4: 그 외 — 폴더 정보로 최선을 다해 파싱
  return {
    id: key,
    url: `${R2_BASE}/${key}`,
    person: null,
    role: folderEvent || null,
    date: null,
  };
}

// ── 폴더 전체 리스트 ──────────────────────────────────────────
async function listPrefix(prefix: string): Promise<Photo[]> {
  const photos: Photo[] = [];
  let token: string | undefined;
  do {
    const r = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: token,
      })
    );
    for (const obj of r.Contents ?? []) {
      const p = parseKey(obj.Key ?? "");
      if (p) photos.push(p);
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return photos;
}

// ── 인메모리 캐시 ─────────────────────────────────────────────
let _cache: Photo[] | null = null;
let _cacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5분

export async function getAllPhotos(): Promise<Photo[]> {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL) return _cache;

  // 연도 폴더 목록 조회 (1회)
  const topR = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: "photos/", Delimiter: "/", MaxKeys: 100 })
  );
  const prefixes = (topR.CommonPrefixes ?? []).map((p) => p.Prefix ?? "");

  // 연도 폴더별 병렬 로딩
  const chunks = await Promise.all(prefixes.map(listPrefix));
  const photos = chunks.flat();

  // 최신순 정렬 (날짜 없는 항목은 뒤로)
  photos.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  _cache = photos;
  _cacheAt = Date.now();
  return photos;
}

// ── 필터 + 페이지네이션 ───────────────────────────────────────
export async function getFilteredPhotos(opts: {
  person?: string;
  role?: string;
  year?: string;
  page?: number;
  limit?: number;
}): Promise<{ photos: Photo[]; total: number }> {
  const all = await getAllPhotos();
  const { person, role, year, page = 1, limit = 60 } = opts;

  const filtered = all.filter((p) => {
    if (person && !p.person?.includes(person)) return false;
    if (role && p.role !== role) return false;
    if (year && !p.date?.startsWith(year)) return false;
    return true;
  });

  const start = (page - 1) * limit;
  return {
    photos: filtered.slice(start, start + limit),
    total: filtered.length,
  };
}

// ── 인물 목록 ─────────────────────────────────────────────────
export async function getPersons(): Promise<Person[]> {
  const all = await getAllPhotos();
  const map = new Map<string, number>();
  for (const p of all) {
    if (!p.person) continue;
    // 쉼표로 구분된 복수 인물 처리
    for (const name of p.person.split(",").map((s) => s.trim())) {
      if (name) map.set(name, (map.get(name) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, role: null, count }))
    .sort((a, b) => b.count - a.count);
}

// ── 날짜 목록 ─────────────────────────────────────────────────
export async function getDates(): Promise<DateEntry[]> {
  const all = await getAllPhotos();
  const map = new Map<string, number>();
  for (const p of all) {
    if (!p.date) continue;
    const [y, m] = p.date.split("-");
    if (y && m) {
      const k = `${y}-${m}`;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([k, count]) => {
      const [y, m] = k.split("-");
      return { year: parseInt(y), month: parseInt(m), count };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

// ── 행사 목록 ─────────────────────────────────────────────────
export async function getEvents(year?: string): Promise<GalleryEvent[]> {
  const all = await getAllPhotos();
  const map = new Map<string, { year: number | null; count: number }>();

  for (const p of all) {
    if (!p.role) continue;
    if (year && !p.date?.startsWith(year)) continue;
    const y = p.date ? parseInt(p.date.slice(0, 4)) : null;
    const existing = map.get(p.role);
    if (existing) {
      existing.count++;
    } else {
      map.set(p.role, { year: y, count: 1 });
    }
  }

  return [...map.entries()]
    .map(([name, { year: y, count }]) => ({ name, year: y, count }))
    .sort((a, b) => b.count - a.count);
}
