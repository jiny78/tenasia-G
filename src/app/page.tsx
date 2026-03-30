import Image from "next/image";
import Link from "next/link";
import CreditBadge from "@/components/CreditBadge";
import HomeHeaderActions from "@/components/HomeHeaderActions";
import { getAllPhotos } from "@/lib/r2";
import { Photo } from "@/types";

export const revalidate = 3600;

type EventCard = {
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

type FeaturedPerson = {
  name: string;
  count: number;
  photoId: string;
  role: string | null;
};

type HomeData = {
  heroPhoto: Photo | null;
  eventCards: EventCard[];
  featuredArtists: FeaturedPerson[];
  recentPhotos: Photo[];
  categoryChips: string[];
};

function isFeaturedYear(photo: Photo): boolean {
  const year = photo.date?.slice(0, 4);
  return year === "2025" || year === "2026";
}

function makeSeed(): number {
  const now = new Date();
  return Number(
    `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}${String(now.getUTCHours()).padStart(2, "0")}`,
  );
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

function buildHomeData(photos: Photo[]): HomeData {
  const seed = makeSeed();
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

  const eventCards = sortedEvents.slice(0, 6).map((event) => {
    const chosenPhoto = sortBySeed(event.photos, (photo) => photo.id, seed)[0] ?? event.photos[0];
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
      seed,
    )[0] ?? sourcePhotos[0] ?? null;

  const featuredArtists = [...personMap.entries()]
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
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentPhotos = sortBySeed(
    sourcePhotos.filter((photo) => !!photo.role),
    (photo) => `${photo.role ?? ""}:${photo.id}`,
    seed,
  ).slice(0, 7);

  const categoryChips = [
    "All Access",
    ...eventCards.slice(0, 5).map((event) => event.name),
  ];

  return {
    heroPhoto,
    eventCards,
    featuredArtists,
    recentPhotos,
    categoryChips,
  };
}

function formatEventDate(value: string | null): string {
  if (!value) return "Curated";
  return value.slice(0, 7).replace("-", ".");
}

export default async function HomePage() {
  const photos = await getAllPhotos();
  const { heroPhoto, eventCards, featuredArtists, recentPhotos, categoryChips } = buildHomeData(photos);
  const heroEvent = eventCards[0];
  const featuredCollections = eventCards.slice(0, 3);
  const archiveLead = recentPhotos[0] ?? heroPhoto;
  const archiveRest = archiveLead ? recentPhotos.filter((photo) => photo.id !== archiveLead.id) : recentPhotos;

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-[#fcf9f8]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <span className="font-[var(--font-manrope)] text-[11px] font-extrabold tracking-[0.35em] text-[#1c1b1b] uppercase">
              Gallery
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <CreditBadge theme="cream" />
            <Link
              href="/archive"
              className="hidden rounded-full bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[#004b6f] uppercase shadow-[0_10px_30px_rgba(28,27,27,0.05)] transition hover:bg-white sm:inline-flex"
            >
              Archive
            </Link>
            <HomeHeaderActions className="rounded-full border border-[#bec7d1]/40 bg-white/60 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[#004b6f] uppercase transition hover:border-[#2d9cdb]/40 hover:text-[#006492]" />
          </div>
        </div>
      </header>

      <main className="pb-24 pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,156,219,0.2),_transparent_36%),radial-gradient(circle_at_85%_20%,_rgba(109,245,225,0.18),_transparent_28%)]" />
          <div className="relative mx-auto grid min-h-[680px] max-w-screen-2xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
            <div className="relative z-10 max-w-3xl">
              <p className="mb-4 font-[var(--font-manrope)] text-[11px] font-extrabold tracking-[0.35em] text-[#006492] uppercase">
                The Editorial Gallery
              </p>
              <h1 className="max-w-3xl font-[var(--font-manrope)] text-4xl font-extrabold leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl">
                Your premium gateway to Korean entertainment photography.
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                Tenasia&apos;s archive is organized like a living exhibition: recent press calls, comeback stages, red carpets,
                and actor portraits presented as curated editorial moments rather than a generic stock grid.
              </p>

              <form action="/archive" className="mt-10 flex max-w-2xl flex-col gap-3 rounded-[1.75rem] bg-[#fcf9f8]/14 p-3 shadow-[0_12px_32px_rgba(28,27,27,0.08)] backdrop-blur-xl sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.3rem] bg-white px-5 py-4">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0 text-[#6f7881]">
                    <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    name="q"
                    defaultValue={heroEvent?.name ?? ""}
                    placeholder="Search artists, dramas, or events"
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#1c1b1b] placeholder:text-[#6f7881]/80 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-[1.1rem] bg-[linear-gradient(135deg,#006492,#2d9cdb)] px-7 py-4 font-[var(--font-manrope)] text-xs font-extrabold tracking-[0.24em] text-white uppercase transition hover:opacity-92"
                >
                  Explore
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {categoryChips.map((chip, index) => {
                  const isPrimary = index === 0;
                  const href = chip === "All Access" ? "/archive" : `/archive?event=${encodeURIComponent(chip)}`;
                  return (
                    <Link
                      key={chip}
                      href={href}
                      className={`rounded-full px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase transition ${
                        isPrimary
                          ? "bg-[#006492] text-white"
                          : index === 1
                            ? "bg-[#6df5e1] text-[#006f64]"
                            : "bg-[#f6f3f2]/78 text-white/88 backdrop-blur-sm hover:bg-[#f6f3f2]/90 hover:text-[#1c1b1b]"
                      }`}
                    >
                      {chip}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="relative flex min-h-[420px] items-end lg:min-h-[560px]">
              <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(180deg,rgba(12,32,47,0.1),rgba(12,32,47,0.45))]" />
              {heroPhoto && (
                <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                  <Image
                    src={`/api/image?path=${encodeURIComponent(heroPhoto.id)}&w=1280`}
                    alt={heroPhoto.person ?? heroPhoto.role ?? "Tenasia hero photo"}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,32,47,0.18),rgba(12,32,47,0.7))]" />
                </div>
              )}

              <div className="relative z-10 m-5 max-w-sm rounded-[1.6rem] bg-[#fcf9f8]/80 p-5 shadow-[0_12px_32px_rgba(28,27,27,0.08)] backdrop-blur-xl">
                <p className="text-[10px] font-bold tracking-[0.24em] text-[#006492] uppercase">Current spotlight</p>
                <h2 className="mt-3 font-[var(--font-manrope)] text-2xl font-extrabold leading-tight text-[#1c1b1b]">
                  {heroEvent?.name ?? "Curated archive highlights"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#3f4850]">
                  {heroPhoto?.person ?? "Freshly indexed entertainment imagery"}
                  {heroEvent ? ` · ${heroEvent.count} frames in this set` : ""}
                </p>
                <div className="mt-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#004b6f]">
                  <Link href={heroEvent ? `/archive?event=${encodeURIComponent(heroEvent.name)}` : "/archive"} className="transition hover:text-[#006492]">
                    Open set
                  </Link>
                  <span className="text-[#6f7881]">{formatEventDate(heroEvent?.date ?? null)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] py-12">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="font-[var(--font-manrope)] text-[11px] font-extrabold tracking-[0.3em] text-[#006492] uppercase">
                  Curated Sets
                </p>
                <h2 className="mt-3 font-[var(--font-manrope)] text-3xl font-extrabold tracking-[-0.03em] text-[#1c1b1b] sm:text-4xl">
                  Featured collections
                </h2>
              </div>
              <Link href="/archive" className="text-sm font-semibold text-[#006492] transition hover:text-[#004b6f]">
                View archive
              </Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {featuredCollections.map((event, index) => (
                <Link
                  key={event.name}
                  href={`/archive?event=${encodeURIComponent(event.name)}`}
                  className={`group relative overflow-hidden rounded-[1.8rem] ${
                    index === 0 ? "lg:col-span-2" : ""
                  }`}
                >
                  <div className={`relative ${index === 0 ? "aspect-[16/10]" : "aspect-[4/5]"}`}>
                    <Image
                      src={`/api/image?path=${encodeURIComponent(event.photoId)}&w=960`}
                      alt={event.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      sizes={index === 0 ? "(max-width: 1024px) 100vw, 60vw" : "(max-width: 1024px) 100vw, 30vw"}
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,32,47,0.08),rgba(12,32,47,0.72))]" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.22em] uppercase ${
                          index === 0
                            ? "bg-[#6df5e1] text-[#006f64]"
                            : index === 1
                              ? "bg-[#2d9cdb] text-white"
                              : "bg-white/18 text-white backdrop-blur-sm"
                        }`}
                      >
                        {index === 0 ? "Trending" : index === 1 ? "Press" : "Events"}
                      </span>
                      <h3 className="mt-4 font-[var(--font-manrope)] text-2xl font-extrabold tracking-[-0.03em]">
                        {event.name}
                      </h3>
                      <p className="mt-2 text-sm text-white/76">
                        {event.count} photos · {formatEventDate(event.date)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] py-20">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <p className="font-[var(--font-manrope)] text-[11px] font-extrabold tracking-[0.3em] text-[#006492] uppercase">
                Fresh From The Archive
              </p>
              <h2 className="mt-3 font-[var(--font-manrope)] text-3xl font-extrabold tracking-[-0.03em] text-[#1c1b1b] sm:text-4xl">
                Daily editorial updates with breathing room.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#3f4850] sm:text-base">
                A quieter, more magazine-like front page: large hero frames, asymmetrical rhythm, and fast paths into the archive.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              {archiveLead && (
                <Link
                  href={`/archive?event=${encodeURIComponent(archiveLead.role ?? "")}`}
                  className="group relative overflow-hidden rounded-[2rem] bg-white shadow-[0_12px_32px_rgba(28,27,27,0.04)]"
                >
                  <div className="relative aspect-[4/5] min-h-[420px]">
                    <Image
                      src={`/api/image?path=${encodeURIComponent(archiveLead.id)}&w=1080`}
                      alt={archiveLead.person ?? archiveLead.role ?? "archive photo"}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.68))]" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <p className="text-[10px] font-bold tracking-[0.24em] text-white/72 uppercase">
                        {archiveLead.role ?? "Archive"}
                      </p>
                      <h3 className="mt-3 font-[var(--font-manrope)] text-3xl font-extrabold tracking-[-0.03em]">
                        {archiveLead.person ?? archiveLead.role ?? "Tenasia Archive"}
                      </h3>
                      <p className="mt-2 text-sm text-white/75">{archiveLead.date?.replaceAll("-", ".") ?? "Curated selection"}</p>
                    </div>
                  </div>
                </Link>
              )}

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2">
                {archiveRest.slice(0, 6).map((photo, index) => (
                  <Link
                    key={photo.id}
                    href={`/archive?event=${encodeURIComponent(photo.role ?? "")}`}
                    className={`group relative overflow-hidden rounded-[1.5rem] bg-white shadow-[0_12px_32px_rgba(28,27,27,0.04)] ${
                      index === 2 ? "sm:row-span-2" : ""
                    }`}
                  >
                    <div className={`relative ${index === 2 ? "aspect-[3/5]" : "aspect-[4/5]"}`}>
                      <Image
                        src={`/api/image?path=${encodeURIComponent(photo.id)}&w=720`}
                        alt={photo.person ?? photo.role ?? "archive photo"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 22vw"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.52))]" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
                          {photo.role ?? "Archive"}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm font-medium">
                          {photo.person ?? photo.role ?? "Tenasia"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/archive"
                className="inline-flex rounded-[0.9rem] bg-white px-7 py-4 font-[var(--font-manrope)] text-xs font-extrabold tracking-[0.2em] text-[#006492] uppercase shadow-[0_12px_32px_rgba(28,27,27,0.04)] transition hover:bg-[#ebe7e7]"
              >
                Load more editorial content
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] py-20">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
            <div className="mb-10">
              <p className="font-[var(--font-manrope)] text-[11px] font-extrabold tracking-[0.3em] text-[#006492] uppercase">
                In The Spotlight
              </p>
              <h2 className="mt-3 font-[var(--font-manrope)] text-3xl font-extrabold tracking-[-0.03em] text-[#1c1b1b] sm:text-4xl">
                Trending personalities
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
              {featuredArtists.map((person) => (
                <Link
                  key={person.name}
                  href={`/archive?person=${encodeURIComponent(person.name)}`}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="relative h-32 w-32 overflow-hidden rounded-full bg-white p-1 shadow-[0_12px_32px_rgba(28,27,27,0.04)] transition-transform duration-300 group-hover:-translate-y-1 md:h-40 md:w-40">
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={`/api/image?path=${encodeURIComponent(person.photoId)}&w=480`}
                        alt={person.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                        sizes="160px"
                        unoptimized
                      />
                    </div>
                  </div>
                  <h3 className="mt-4 font-[var(--font-manrope)] text-lg font-extrabold text-[#1c1b1b] transition-colors group-hover:text-[#006492]">
                    {person.name}
                  </h3>
                  <p className="mt-1 text-[11px] font-semibold tracking-[0.18em] text-[#6f7881] uppercase">
                    {person.role ?? "Archive"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
