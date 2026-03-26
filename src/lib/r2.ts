import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Photo, Person, DateEntry, GalleryEvent } from "@/types";
import agencyData from "@/data/artist-agency.json";

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

// ── 이미지 방향 메모리 캐시 ──────────────────────────────────
// photo/[id] 조회 시 sharp로 dimensions 읽어 캐시
// 방향 필터는 캐시된 항목만 정확히 필터링 (캐시 없는 항목은 통과)
const orientationCache = new Map<string, "landscape" | "portrait" | "square">();

export function cacheOrientation(key: string, w: number, h: number): void {
  if (!w || !h) return;
  const o = w > h ? "landscape" : w < h ? "portrait" : "square";
  orientationCache.set(key, o);
}

export function getCachedOrientation(key: string): "landscape" | "portrait" | "square" | null {
  return orientationCache.get(key) ?? null;
}

// ── 소속사 데이터 타입 ────────────────────────────────────────
type ArtistEntry = { group: string | null; agency: string };
const artists = agencyData.artists as Record<string, ArtistEntry>;

function getArtistAgency(person: string): string | null {
  for (const name of person.split(",").map((s) => s.trim())) {
    const entry = artists[name];
    if (entry?.agency) return entry.agency;
  }
  return null;
}

// ── 인물명 정리 ───────────────────────────────────────────────
function cleanPerson(raw: string): string {
  return raw
    .replace(/_\d+/g, "")
    .replace(/\s*\(\d+\)\s*$/, "")
    .trim();
}

// ── 파일명 파싱 ───────────────────────────────────────────────
function parseKey(key: string): Photo | null {
  if (!/\.(jpg|jpeg|png|webp)$/i.test(key)) return null;
  const segments = key.split("/");
  if (segments.length < 3 || segments[0] !== "photos") return null;

  const filename = segments[segments.length - 1].replace(/\.[^.]+$/, "");
  const eventFolder = segments[segments.length - 2] ?? "";
  const folderEvent = eventFolder.replace(/^\d{4}[\.\-\d]*\s+/, "").trim();

  const mDate = filename.match(/^(\d{4})\.(\d{2})\.(\d{2})[-\s](.+)$/);
  if (mDate) {
    const year = parseInt(mDate[1]);
    const validDate = year >= 1990 && year <= 2030;
    const date = validDate ? `${mDate[1]}-${mDate[2]}-${mDate[3]}` : null;
    const fields = mDate[4].split("-");
    const event = fields[0]?.trim() || folderEvent;
    const rawPerson = fields[1]?.trim() ?? "";
    const person = cleanPerson(rawPerson);
    return { id: key, url: `${R2_BASE}/${key}`, person: person || null, role: event || null, date };
  }

  const mPerson = filename.match(/^([^_\d][^_]+)_\d+(\s*\(\d+\))?$/);
  if (mPerson) {
    const person = mPerson[1].trim();
    return { id: key, url: `${R2_BASE}/${key}`, person, role: folderEvent || null, date: null };
  }

  return { id: key, url: `${R2_BASE}/${key}`, person: null, role: folderEvent || null, date: null };
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
let _fetching: Promise<Photo[]> | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30분

export async function getAllPhotos(): Promise<Photo[]> {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL) return _cache;
  // 동시 요청이 여러 개여도 R2 listing은 1번만
  if (_fetching) return _fetching;

  _fetching = (async () => {
    const topR = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: "photos/", Delimiter: "/", MaxKeys: 100 })
    );
    const prefixes = (topR.CommonPrefixes ?? []).map((p) => p.Prefix ?? "");
    const chunks = await Promise.all(prefixes.map(listPrefix));
    const photos = chunks.flat();

    photos.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });

    _cache = photos;
    _cacheAt = Date.now();
    _fetching = null;
    return photos;
  })();

  return _fetching;
}

// ── 필터 + 페이지네이션 ───────────────────────────────────────
export async function getFilteredPhotos(opts: {
  person?:      string;
  role?:        string;
  event?:       string;      // alias for role
  year?:        string;
  keyword?:     string;      // case-insensitive partial match on person+event
  dateFrom?:    string;      // YYYY-MM
  dateTo?:      string;      // YYYY-MM
  orientation?: string;      // landscape | portrait | square
  agency?:      string;
  page?:        number;
  limit?:       number;
}): Promise<{ photos: Photo[]; total: number }> {
  const all = await getAllPhotos();
  const {
    person, role, event, year,
    keyword, dateFrom, dateTo, orientation, agency,
    page = 1, limit = 60,
  } = opts;

  const roleFilter = event || role; // event takes priority

  const kw = keyword?.toLowerCase().trim();

  const filtered = all.filter((p) => {
    // keyword (AND-combined with other filters)
    if (kw) {
      const inPerson = p.person?.toLowerCase().includes(kw) ?? false;
      const inEvent  = p.role?.toLowerCase().includes(kw)   ?? false;
      if (!inPerson && !inEvent) return false;
    }

    // person
    if (person && !p.person?.toLowerCase().includes(person.toLowerCase())) return false;

    // event/role (exact match)
    if (roleFilter && p.role !== roleFilter) return false;

    // date range vs legacy year
    if (dateFrom || dateTo) {
      const ym = p.date?.slice(0, 7) ?? null; // YYYY-MM
      if (!ym) return false;
      if (dateFrom && ym < dateFrom) return false;
      if (dateTo   && ym > dateTo)   return false;
    } else if (year) {
      if (!p.date?.startsWith(year)) return false;
    }

    // orientation (cache-based, unknowns pass through)
    if (orientation) {
      const cached = orientationCache.get(p.id);
      if (cached && cached !== orientation) return false;
    }

    // agency
    if (agency && p.person) {
      if (getArtistAgency(p.person) !== agency) return false;
    }

    return true;
  });

  const start = (page - 1) * limit;
  return { photos: filtered.slice(start, start + limit), total: filtered.length };
}

// ── 인물 목록 ─────────────────────────────────────────────────
export async function getPersons(): Promise<Person[]> {
  const all = await getAllPhotos();
  const map = new Map<string, number>();
  for (const p of all) {
    if (!p.person) continue;
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
    if (existing) existing.count++;
    else map.set(p.role, { year: y, count: 1 });
  }
  return [...map.entries()]
    .map(([name, { year: y, count }]) => ({ name, year: y, count }))
    .sort((a, b) => b.count - a.count);
}

// ── 소속사 목록 ───────────────────────────────────────────────
export async function getAgencies(): Promise<{ name: string; count: number }[]> {
  const all = await getAllPhotos();
  const map = new Map<string, number>();
  for (const p of all) {
    if (!p.person) continue;
    const agency = getArtistAgency(p.person);
    if (agency) map.set(agency, (map.get(agency) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
