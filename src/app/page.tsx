import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import CreditBadge from "@/components/CreditBadge";
import { authOptions } from "@/lib/auth";
import { getAllPhotos, getEvents, getPersons } from "@/lib/r2";

type EventCard = {
  name: string;
  count: number;
  photoId: string;
  date: string | null;
};

function buildEventCards(): Promise<EventCard[]> {
  return Promise.all([getAllPhotos(), getEvents()]).then(([photos, events]) => {
    const byEvent = new Map<string, { photoId: string; date: string | null }>();
    for (const photo of photos) {
      if (!photo.role || byEvent.has(photo.role)) continue;
      byEvent.set(photo.role, { photoId: photo.id, date: photo.date });
    }

    return events
      .filter((event) => byEvent.has(event.name))
      .sort((a, b) => {
        const aDate = byEvent.get(a.name)?.date ?? "";
        const bDate = byEvent.get(b.name)?.date ?? "";
        return bDate.localeCompare(aDate) || b.count - a.count;
      })
      .slice(0, 6)
      .map((event) => ({
        name: event.name,
        count: event.count,
        photoId: byEvent.get(event.name)!.photoId,
        date: byEvent.get(event.name)!.date,
      }));
  });
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const [eventCards, persons, photos] = await Promise.all([
    buildEventCards(),
    getPersons(),
    getAllPhotos(),
  ]);

  const featuredArtists = persons.slice(0, 8);
  const recentPhotos = photos.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#111]/95 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-baseline gap-2 hover:opacity-80 transition-opacity">
            <span className="text-base font-bold tracking-[0.15em] uppercase">Tenasia</span>
            <span className="text-[10px] tracking-[0.4em] uppercase text-white/30">Gallery</span>
          </Link>

          <div className="flex items-center gap-3">
            <CreditBadge theme="black" />
            <Link
              href="/archive"
              className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-medium text-white/75 hover:border-white/30 hover:text-white"
            >
              Browse Archive
            </Link>
            <Link
              href={session?.user ? "/account" : "/auth/signin"}
              className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-medium text-white/75 hover:border-white/30 hover:text-white"
            >
              {session?.user ? "Account" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-6 py-10">
        <section className="grid gap-8 border-b border-white/8 pb-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">Editorial Archive</p>
            <h1 className="max-w-3xl text-4xl font-light tracking-tight text-white sm:text-5xl">
              Event-led photo discovery for fast editorial browsing.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-white/55">
              Instead of loading the full archive up front, the home page highlights recent events,
              featured artists, and recent uploads. Full search and filter access stays in the archive.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/archive"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
              >
                Open Full Archive
              </Link>
              {eventCards[0] && (
                <Link
                  href={`/archive?event=${encodeURIComponent(eventCards[0].name)}`}
                  className="rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/75 hover:border-white/30 hover:text-white"
                >
                  View Latest Event
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {eventCards.slice(0, 2).map((event) => (
              <Link
                key={event.name}
                href={`/archive?event=${encodeURIComponent(event.name)}`}
                className="group overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={`/api/image?path=${encodeURIComponent(event.photoId)}&w=720`}
                    alt={event.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">
                      {event.date?.slice(0, 7).replace("-", ".") ?? "Recent"}
                    </p>
                    <h2 className="mt-2 text-lg font-medium text-white">{event.name}</h2>
                    <p className="mt-1 text-xs text-white/55">{event.count} photos</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/8 pb-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/30">Latest Events</p>
              <h2 className="mt-2 text-2xl font-light text-white">Recent event collections</h2>
            </div>
            <Link href="/archive" className="text-sm text-white/45 hover:text-white">
              View all
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {eventCards.map((event) => (
              <Link
                key={event.name}
                href={`/archive?event=${encodeURIComponent(event.name)}`}
                className="group overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={`/api/image?path=${encodeURIComponent(event.photoId)}&w=640`}
                    alt={event.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 1280px) 50vw, 33vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                </div>
                <div className="space-y-1 p-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">
                    {event.date?.slice(0, 7).replace("-", ".") ?? "Archive"}
                  </p>
                  <h3 className="text-base text-white">{event.name}</h3>
                  <p className="text-xs text-white/50">{event.count} photos</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-10 border-t border-white/8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/30">Featured Artists</p>
            <h2 className="mt-2 text-2xl font-light text-white">Most active names in the archive</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {featuredArtists.map((person) => (
                <Link
                  key={person.name}
                  href={`/archive?person=${encodeURIComponent(person.name)}`}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70 hover:border-white/30 hover:text-white"
                >
                  {person.name} <span className="text-white/35">{person.count}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/30">Recent Uploads</p>
                <h2 className="mt-2 text-2xl font-light text-white">Fresh additions</h2>
              </div>
              <Link href="/archive" className="text-sm text-white/45 hover:text-white">
                Open archive
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {recentPhotos.map((photo) => (
                <Link
                  key={photo.id}
                  href={`/archive?event=${encodeURIComponent(photo.role ?? "")}`}
                  className="group overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]"
                >
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={`/api/image?path=${encodeURIComponent(photo.id)}&w=480`}
                      alt={photo.person ?? photo.role ?? "photo"}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 50vw, 20vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p className="line-clamp-2 text-xs text-white">{photo.person ?? photo.role ?? "Tenasia"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
