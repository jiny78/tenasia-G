"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CreditBadge from "@/components/CreditBadge";
import HomeHeaderActions from "@/components/HomeHeaderActions";
import { HomeData } from "@/lib/homeData";

type Props = {
  initialData: HomeData;
  initialSeed: number;
};

const VISIT_SEED_KEY = "tenasia-home-seed";
const mosaicPattern = [
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
  "col-span-1 row-span-2",
];

function formatEventDate(value: string | null): string {
  if (!value) return "Curated";
  return value.slice(0, 7).replace("-", ".");
}

function readOrCreateVisitSeed(fallbackSeed: number): number {
  if (typeof window === "undefined") return fallbackSeed;

  const existing = window.sessionStorage.getItem(VISIT_SEED_KEY);
  if (existing) {
    const parsed = Number(existing);
    if (Number.isFinite(parsed)) return parsed;
  }

  const nextSeed = fallbackSeed + Math.floor(Math.random() * 100000);
  window.sessionStorage.setItem(VISIT_SEED_KEY, String(nextSeed));
  return nextSeed;
}

export default function HomeLanding({ initialData, initialSeed }: Props) {
  const [homeData, setHomeData] = useState(initialData);

  useEffect(() => {
    const visitSeed = readOrCreateVisitSeed(initialSeed);

    if (visitSeed === initialSeed) return;

    let cancelled = false;

    fetch(`/api/home?seed=${visitSeed}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Failed to load home data: ${response.status}`);
        const nextData = (await response.json()) as HomeData;
        if (!cancelled) setHomeData(nextData);
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [initialSeed]);

  const { heroPhoto, eventCards, featuredArtists, recentPhotos, categoryChips, mosaicPhotos } = useMemo(
    () => homeData,
    [homeData],
  );

  const heroEvent = eventCards[0];
  const featuredCollections = eventCards.slice(0, 5);
  const archiveLead = recentPhotos[0] ?? heroPhoto;
  const archiveRest = archiveLead ? recentPhotos.filter((photo) => photo.id !== archiveLead.id) : recentPhotos;
  const rotatingEvents = eventCards.slice(4, 8);

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
        <section className="relative overflow-hidden bg-[#102737]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,156,219,0.28),_transparent_34%),radial-gradient(circle_at_85%_20%,_rgba(109,245,225,0.16),_transparent_24%),linear-gradient(135deg,rgba(7,22,33,0.92),rgba(13,43,62,0.76)_52%,rgba(6,20,30,0.9))]" />
          <div className="relative mx-auto grid min-h-[720px] max-w-screen-2xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
            <div className="relative z-10 max-w-3xl">
              <p className="mb-4 font-[var(--font-manrope)] text-[11px] font-extrabold tracking-[0.35em] text-[#8ccdff] uppercase [text-shadow:0_1px_10px_rgba(0,0,0,0.35)]">
                The Editorial Gallery
              </p>
              <h1 className="max-w-3xl font-[var(--font-manrope)] text-4xl font-extrabold leading-[0.95] tracking-[-0.04em] text-white [text-shadow:0_10px_30px_rgba(0,0,0,0.45)] sm:text-5xl lg:text-7xl">
                Every visit should feel like a different front page.
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/90 [text-shadow:0_8px_24px_rgba(0,0,0,0.38)] sm:text-base">
                Press calls, filmings, showcases, and portrait sessions are remixed into a living editorial layout so the
                archive does not feel frozen in place.
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
                            : "bg-[#f6f3f2]/88 text-[#102737] shadow-[0_6px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm hover:bg-white hover:text-[#0c2030]"
                      }`}
                    >
                      {chip}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {rotatingEvents.map((event) => (
                  <Link
                    key={event.name}
                    href={`/archive?event=${encodeURIComponent(event.name)}`}
                    className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4 text-white/88 backdrop-blur-sm transition hover:bg-white/12"
                  >
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#8ccdff] uppercase">{formatEventDate(event.date)}</p>
                    <h2 className="mt-2 line-clamp-2 text-base font-bold">{event.name}</h2>
                    <p className="mt-2 text-xs text-white/60">{event.count} photos</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid min-h-[460px] gap-4 lg:min-h-[600px] lg:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.72fr)]">
              <div className="relative overflow-hidden rounded-[2rem]">
                <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(180deg,rgba(3,14,24,0.22),rgba(6,23,35,0.64))]" />
                {heroPhoto && (
                  <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                    <Image
                      src={`/api/image?path=${encodeURIComponent(heroPhoto.id)}&w=1280`}
                      alt={heroPhoto.person ?? heroPhoto.role ?? "Tenasia hero photo"}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 38vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,14,24,0.12),rgba(6,23,35,0.84))]" />
                  </div>
                )}

                <div className="relative z-10 flex h-full items-end p-5">
                  <div className="max-w-sm rounded-[1.6rem] bg-[#fcf9f8]/80 p-5 shadow-[0_12px_32px_rgba(28,27,27,0.08)] backdrop-blur-xl">
                    <p className="text-[10px] font-bold tracking-[0.24em] text-[#006492] uppercase">Current spotlight</p>
                    <h2 className="mt-3 font-[var(--font-manrope)] text-2xl font-extrabold leading-tight text-[#1c1b1b]">
                      {heroEvent?.name ?? "Curated archive highlights"}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[#3f4850]">
                      {heroPhoto?.person ?? "Freshly indexed entertainment imagery"}
                      {heroEvent ? ` · ${heroEvent.count} photos` : ""}
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

              <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {mosaicPhotos.slice(0, 2).map((photo, index) => (
                  <Link
                    key={photo.id}
                    href={`/archive?event=${encodeURIComponent(photo.role ?? "")}`}
                    className="group relative min-h-[180px] overflow-hidden rounded-[1.7rem] bg-white/10"
                  >
                    <Image
                      src={`/api/image?path=${encodeURIComponent(photo.id)}&w=720`}
                      alt={photo.person ?? photo.role ?? "feature photo"}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      sizes="(max-width: 1024px) 50vw, 24vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,27,40,0.08),rgba(7,22,33,0.72))]" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <p className="text-[10px] font-bold tracking-[0.22em] text-[#8ccdff] uppercase">{photo.role ?? "Archive"}</p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold">{photo.person ?? photo.role ?? "Tenasia"}</p>
                    </div>
                    {index === 0 && (
                      <div className="absolute right-4 top-4 rounded-full bg-[#6df5e1] px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#006f64] uppercase">
                        Randomized
                      </div>
                    )}
                  </Link>
                ))}
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

            <div className="grid grid-flow-dense gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featuredCollections.map((event, index) => (
                <Link
                  key={event.name}
                  href={`/archive?event=${encodeURIComponent(event.name)}`}
                  className={`group relative overflow-hidden rounded-[1.8rem] ${
                    index === 0 ? "md:col-span-2 xl:col-span-2 xl:row-span-2" : ""
                  }`}
                >
                  <div className={`relative ${index === 0 ? "aspect-[16/10] xl:aspect-[10/11]" : "aspect-[4/5]"}`}>
                    <Image
                      src={`/api/image?path=${encodeURIComponent(event.photoId)}&w=960`}
                      alt={event.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      sizes={index === 0 ? "(max-width: 1280px) 100vw, 46vw" : "(max-width: 1280px) 50vw, 23vw"}
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
                        {index === 0 ? "Lead Story" : index === 1 ? "Press" : index === 2 ? "Live" : "Editors' Pick"}
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
            <div className="mb-12 max-w-3xl">
              <p className="font-[var(--font-manrope)] text-[11px] font-extrabold tracking-[0.3em] text-[#006492] uppercase">
                Fresh From The Archive
              </p>
              <h2 className="mt-3 font-[var(--font-manrope)] text-3xl font-extrabold tracking-[-0.03em] text-[#1c1b1b] sm:text-4xl">
                A denser layout with fewer dead zones.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#3f4850] sm:text-base">
                Instead of leaving large blank pockets, the front page now packs mixed crops and event cards into a tighter
                editorial rhythm.
              </p>
            </div>

            <div className="grid grid-flow-dense auto-rows-[120px] grid-cols-2 gap-4 sm:auto-rows-[150px] lg:auto-rows-[170px] lg:grid-cols-4">
              {archiveLead && (
                <Link
                  href={`/archive?event=${encodeURIComponent(archiveLead.role ?? "")}`}
                  className="group relative col-span-2 row-span-3 min-h-[360px] overflow-hidden rounded-[2rem] bg-white shadow-[0_12px_32px_rgba(28,27,27,0.04)] sm:min-h-[450px] lg:min-h-[510px]"
                >
                  <Image
                    src={`/api/image?path=${encodeURIComponent(archiveLead.id)}&w=1080`}
                    alt={archiveLead.person ?? archiveLead.role ?? "archive photo"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 1024px) 100vw, 48vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.7))]" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <p className="text-[10px] font-bold tracking-[0.24em] text-white/72 uppercase">
                      {archiveLead.role ?? "Archive"}
                    </p>
                    <h3 className="mt-3 font-[var(--font-manrope)] text-3xl font-extrabold tracking-[-0.03em]">
                      {archiveLead.person ?? archiveLead.role ?? "Tenasia Archive"}
                    </h3>
                    <p className="mt-2 text-sm text-white/75">{archiveLead.date?.replaceAll("-", ".") ?? "Curated selection"}</p>
                  </div>
                </Link>
              )}

              {archiveRest.slice(0, 5).map((photo, index) => (
                <Link
                  key={photo.id}
                  href={`/archive?event=${encodeURIComponent(photo.role ?? "")}`}
                  className={`group relative min-h-[120px] overflow-hidden rounded-[1.5rem] bg-white shadow-[0_12px_32px_rgba(28,27,27,0.04)] sm:min-h-[150px] lg:min-h-[170px] ${mosaicPattern[index + 1] ?? "col-span-1 row-span-1"}`}
                >
                  <Image
                    src={`/api/image?path=${encodeURIComponent(photo.id)}&w=720`}
                    alt={photo.person ?? photo.role ?? "archive photo"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 22vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.56))]" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
                      {photo.role ?? "Archive"}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm font-medium">
                      {photo.person ?? photo.role ?? "Tenasia"}
                    </p>
                  </div>
                </Link>
              ))}

              {eventCards.slice(0, 2).map((event, index) => (
                <Link
                  key={`event-stat-${event.name}`}
                  href={`/archive?event=${encodeURIComponent(event.name)}`}
                  className={`rounded-[1.6rem] border border-[#d8e0e7] bg-white p-5 shadow-[0_12px_32px_rgba(28,27,27,0.04)] ${index === 0 ? "col-span-2 row-span-1" : "col-span-2 row-span-1 lg:col-span-1"}`}
                >
                  <p className="text-[10px] font-bold tracking-[0.22em] text-[#006492] uppercase">Event pulse</p>
                  <h3 className="mt-3 font-[var(--font-manrope)] text-xl font-extrabold tracking-[-0.03em] text-[#1c1b1b]">
                    {event.name}
                  </h3>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <p className="text-sm leading-6 text-[#52606b]">{formatEventDate(event.date)}</p>
                    <p className="text-2xl font-extrabold text-[#0c2030]">{event.count}</p>
                  </div>
                </Link>
              ))}
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

            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-6 md:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
              {featuredArtists.map((person) => (
                <Link
                  key={person.name}
                  href={`/archive?person=${encodeURIComponent(person.name)}`}
                  className="group flex flex-col items-center rounded-[1.8rem] bg-white px-4 py-6 text-center shadow-[0_12px_32px_rgba(28,27,27,0.04)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-32 w-32 overflow-hidden rounded-full bg-[#f3f0ef] p-1 md:h-36 md:w-36">
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
                  <p className="mt-3 text-xs text-[#52606b]">{person.count} indexed cuts</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
