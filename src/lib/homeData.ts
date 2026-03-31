import { Photo } from "@/types";

export type EventCard = {
  name: string;
  count: number;
  photoId: string;
  date: string | null;
};

type EventBucket = {
  name: string;
  count: number;
  photos: Photo[];
  latestDate: string | null;
};

export type FeaturedPerson = {
  name: string;
  count: number;
  photoId: string;
  role: string | null;
};

export type HomeData = {
  heroPhoto: Photo | null;
  eventCards: EventCard[];
  featuredArtists: FeaturedPerson[];
  recentPhotos: Photo[];
  categoryChips: string[];
  mosaicPhotos: Photo[];
};

function isFeaturedYear(photo: Photo): boolean {
  const year = photo.date?.slice(0, 4);
  return year === "2025" || year === "2026";
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sortBySeed<T>(items: T[], seedKey: (item: T) => string, seed: number): T[] {
  return [...items].sort((a, b) => {
    const aHash = hashString(`${seed}:${seedKey(a)}`);
    const bHash = hashString(`${seed}:${seedKey(b)}`);
    return aHash - bHash;
  });
}

function pickUniquePhotos(pool: Photo[], seed: number, count: number): Photo[] {
  const unique = new Map<string, Photo>();
  for (const photo of sortBySeed(pool, (item) => item.id, seed)) {
    if (unique.has(photo.id)) continue;
    unique.set(photo.id, photo);
    if (unique.size >= count) break;
  }
  return [...unique.values()];
}

export function buildHomeData(photos: Photo[], seed: number): HomeData {
  const featuredPool = photos.filter(isFeaturedYear);
  const sourcePhotos = featuredPool.length > 0 ? featuredPool : photos;

  const eventMap = new Map<string, EventBucket>();
  const personMap = new Map<string, number>();

  for (const photo of sourcePhotos) {
    if (photo.role) {
      const existing = eventMap.get(photo.role);
      if (existing) {
        existing.count += 1;
        existing.photos.push(photo);
        if ((photo.date ?? "") > (existing.latestDate ?? "")) {
          existing.latestDate = photo.date;
        }
      } else {
        eventMap.set(photo.role, {
          name: photo.role,
          count: 1,
          photos: [photo],
          latestDate: photo.date,
        });
      }
    }

    if (!photo.person) continue;
    for (const name of photo.person.split(",").map((value) => value.trim())) {
      if (!name) continue;
      personMap.set(name, (personMap.get(name) ?? 0) + 1);
    }
  }

  const sortedEvents = sortBySeed(
    [...eventMap.values()],
    (event) => `${event.name}:${event.latestDate ?? ""}`,
    seed,
  );

  const eventCards = sortedEvents.slice(0, 8).map((event, index) => {
    const photoSeed = seed + index * 97;
    const chosenPhoto = sortBySeed(event.photos, (photo) => photo.id, photoSeed)[0] ?? event.photos[0];
    return {
      name: event.name,
      count: event.count,
      photoId: chosenPhoto.id,
      date: event.latestDate,
    };
  });

  const heroPhoto =
    sortBySeed(
      sourcePhotos.filter((photo) => !!photo.role && !!photo.person),
      (photo) => `${photo.role ?? ""}:${photo.id}`,
      seed + 11,
    )[0] ?? sourcePhotos[0] ?? null;

  const featuredArtists = sortBySeed(
    [...personMap.entries()]
      .map(([name, count]) => {
        const portrait =
          sourcePhotos.find((photo) => photo.person?.split(",").map((value) => value.trim()).includes(name))
          ?? sourcePhotos.find((photo) => photo.person?.includes(name));
        if (!portrait) return null;
        return {
          name,
          count,
          photoId: portrait.id,
          role: portrait.role ?? null,
        };
      })
      .filter((value): value is FeaturedPerson => value !== null)
      .sort((a, b) => b.count - a.count),
    (person) => `${person.name}:${person.photoId}`,
    seed + 23,
  ).slice(0, 8);

  const recentPhotos = sortBySeed(
    sourcePhotos.filter((photo) => !!photo.role),
    (photo) => `${photo.date ?? ""}:${photo.role ?? ""}:${photo.id}`,
    seed + 31,
  ).slice(0, 10);

  const categoryChips = [
    "All Access",
    ...eventCards.slice(0, 6).map((event) => event.name),
  ];

  const mosaicPhotos = pickUniquePhotos(
    sourcePhotos.filter((photo) => !!photo.role || !!photo.person),
    seed + 47,
    8,
  );

  return {
    heroPhoto,
    eventCards,
    featuredArtists,
    recentPhotos,
    categoryChips,
    mosaicPhotos,
  };
}
