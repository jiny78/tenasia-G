import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Photo, Person, DateEntry, GalleryEvent } from "@/types";
import agencyData from "@/data/artist-agency.json";
import { requireEnv } from "@/lib/env";

const s3 = new S3Client({
  region: "auto",
  endpoint: requireEnv("R2_ENDPOINT"),
  credentials: {
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
  },
});

const BUCKET = requireEnv("R2_BUCKET");
const R2_BASE = requireEnv("R2_BASE");

const orientationCache = new Map<string, "landscape" | "portrait" | "square">();

export function cacheOrientation(key: string, w: number, h: number): void {
  if (!w || !h) return;
  const orientation = w > h ? "landscape" : w < h ? "portrait" : "square";
  orientationCache.set(key, orientation);
}

export function getCachedOrientation(key: string): "landscape" | "portrait" | "square" | null {
  return orientationCache.get(key) ?? null;
}

type ArtistEntry = { group: string | null; agency: string };
const artists = agencyData.artists as Record<string, ArtistEntry>;

function getArtistAgency(person: string): string | null {
  for (const name of person.split(",").map((s) => s.trim())) {
    const entry = artists[name];
    if (entry?.agency) return entry.agency;
  }
  return null;
}

function cleanPerson(raw: string): string {
  return raw
    .replace(/_\d+/g, "")
    .replace(/\s*\(\d+\)\s*$/, "")
    .trim();
}

function parseKey(key: string): Photo | null {
  if (!/\.(jpg|jpeg|png|webp)$/i.test(key)) return null;
  const segments = key.split("/");
  if (segments.length < 3 || segments[0] !== "photos") return null;

  const filename = segments[segments.length - 1].replace(/\.[^.]+$/, "");
  const eventFolder = segments[segments.length - 2] ?? "";
  const folderEvent = eventFolder.replace(/^\d{4}[\.\-\d]*\s+/, "").trim();

  const datedMatch = filename.match(/^(\d{4})\.(\d{2})\.(\d{2})[-\s](.+)$/);
  if (datedMatch) {
    const year = parseInt(datedMatch[1], 10);
    const validDate = year >= 1990 && year <= 2100;
    const date = validDate ? `${datedMatch[1]}-${datedMatch[2]}-${datedMatch[3]}` : null;
    const fields = datedMatch[4].split("-");
    const event = fields[0]?.trim() || folderEvent;
    const rawPerson = fields[1]?.trim() ?? "";
    const person = cleanPerson(rawPerson);
    return { id: key, url: `${R2_BASE}/${key}`, person: person || null, role: event || null, date };
  }

  const personMatch = filename.match(/^([^_\d][^_]+)_\d+(\s*\(\d+\))?$/);
  if (personMatch) {
    const person = personMatch[1].trim();
    return { id: key, url: `${R2_BASE}/${key}`, person, role: folderEvent || null, date: null };
  }

  return { id: key, url: `${R2_BASE}/${key}`, person: null, role: folderEvent || null, date: null };
}

async function listPrefix(prefix: string): Promise<Photo[]> {
  const photos: Photo[] = [];
  let token: string | undefined;
  do {
    const result = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: 1000,
      ContinuationToken: token,
    }));
    for (const obj of result.Contents ?? []) {
      const photo = parseKey(obj.Key ?? "");
      if (photo) photos.push(photo);
    }
    token = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (token);
  return photos;
}

let cache: Photo[] | null = null;
let cacheAt = 0;
let fetching: Promise<Photo[]> | null = null;
const CACHE_TTL = 30 * 60 * 1000;

export async function getAllPhotos(): Promise<Photo[]> {
  if (cache && Date.now() - cacheAt < CACHE_TTL) return cache;
  if (fetching) return fetching;

  fetching = (async () => {
    try {
      const top = await s3.send(
        new ListObjectsV2Command({ Bucket: BUCKET, Prefix: "photos/", Delimiter: "/", MaxKeys: 100 }),
      );
      const prefixes = (top.CommonPrefixes ?? []).map((prefix) => prefix.Prefix ?? "");
      const chunks = await Promise.all(prefixes.map(listPrefix));
      const photos = chunks.flat();

      photos.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
      });

      cache = photos;
      cacheAt = Date.now();
      return photos;
    } finally {
      fetching = null;
    }
  })();

  return fetching;
}

export async function getFilteredPhotos(opts: {
  person?: string;
  role?: string;
  event?: string;
  year?: string;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
  orientation?: string;
  agency?: string;
  page?: number;
  limit?: number;
}): Promise<{ photos: Photo[]; total: number }> {
  const all = await getAllPhotos();
  const {
    person, role, event, year,
    keyword, dateFrom, dateTo, orientation, agency,
    page = 1, limit = 60,
  } = opts;

  const roleFilter = event || role;
  const kw = keyword?.toLowerCase().trim();

  const filtered = all.filter((photo) => {
    if (kw) {
      const inPerson = photo.person?.toLowerCase().includes(kw) ?? false;
      const inEvent = photo.role?.toLowerCase().includes(kw) ?? false;
      if (!inPerson && !inEvent) return false;
    }

    if (person && !photo.person?.toLowerCase().includes(person.toLowerCase())) return false;
    if (roleFilter && photo.role !== roleFilter) return false;

    if (dateFrom || dateTo) {
      const ym = photo.date?.slice(0, 7) ?? null;
      if (!ym) return false;
      if (dateFrom && ym < dateFrom) return false;
      if (dateTo && ym > dateTo) return false;
    } else if (year) {
      if (!photo.date?.startsWith(year)) return false;
    }

    if (orientation) {
      const cached = orientationCache.get(photo.id);
      if (cached && cached !== orientation) return false;
    }

    if (agency) {
      if (!photo.person) return false;
      if (getArtistAgency(photo.person) !== agency) return false;
    }

    return true;
  });

  const start = (page - 1) * limit;
  return { photos: filtered.slice(start, start + limit), total: filtered.length };
}

export async function getPersons(): Promise<Person[]> {
  const all = await getAllPhotos();
  const map = new Map<string, number>();
  for (const photo of all) {
    if (!photo.person) continue;
    for (const name of photo.person.split(",").map((s) => s.trim())) {
      if (name) map.set(name, (map.get(name) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, role: null, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getDates(): Promise<DateEntry[]> {
  const all = await getAllPhotos();
  const map = new Map<string, number>();
  for (const photo of all) {
    if (!photo.date) continue;
    const [year, month] = photo.date.split("-");
    if (year && month) {
      const key = `${year}-${month}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([key, count]) => {
      const [year, month] = key.split("-");
      return { year: parseInt(year, 10), month: parseInt(month, 10), count };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

export async function getEvents(year?: string): Promise<GalleryEvent[]> {
  const all = await getAllPhotos();
  const map = new Map<string, { year: number | null; count: number }>();
  for (const photo of all) {
    if (!photo.role) continue;
    if (year && !photo.date?.startsWith(year)) continue;
    const photoYear = photo.date ? parseInt(photo.date.slice(0, 4), 10) : null;
    const existing = map.get(photo.role);
    if (existing) existing.count++;
    else map.set(photo.role, { year: photoYear, count: 1 });
  }
  return [...map.entries()]
    .map(([name, { year: photoYear, count }]) => ({ name, year: photoYear, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getAgencies(): Promise<{ name: string; count: number }[]> {
  const all = await getAllPhotos();
  const map = new Map<string, number>();
  for (const photo of all) {
    if (!photo.person) continue;
    const agency = getArtistAgency(photo.person);
    if (agency) map.set(agency, (map.get(agency) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
