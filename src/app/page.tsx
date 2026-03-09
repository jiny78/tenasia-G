"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PhotoGrid from "@/components/PhotoGrid";
import FilterBar from "@/components/FilterBar";
import { Photo, Person, DateEntry, GalleryEvent } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE ?? "";

const apiHeaders: HeadersInit = API_KEY ? { "X-API-Key": API_KEY } : {};

function resolveUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${R2_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

export type Filters = {
  person: string;
  event: string;
  year: string;
};

const EMPTY: Filters = { person: "", event: "", year: "" };

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY);

  const fetchPhotos = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.person) params.set("person", f.person);
    if (f.event) params.set("role", f.event);
    if (f.year) params.set("year", f.year);
    params.set("page", String(p));
    params.set("limit", "60");

    try {
      const res = await fetch(`${API}/public/gallery?${params}`, { headers: apiHeaders });
      const data = await res.json();
      const resolved = (data.photos ?? []).map((ph: Photo) => ({
        ...ph,
        url: resolveUrl(ph.url),
      }));
      if (p === 1) setPhotos(resolved);
      else setPhotos((prev) => [...prev, ...resolved]);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 연도 변경 시 이벤트 목록 갱신
  const fetchEvents = useCallback(async (year: string) => {
    const params = year ? `?year=${year}` : "";
    try {
      const res = await fetch(`${API}/public/gallery/events${params}`, { headers: apiHeaders });
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetch(`${API}/public/gallery/persons`, { headers: apiHeaders })
      .then((r) => r.json()).then((d) => setPersons(d.persons ?? [])).catch(console.error);
    fetch(`${API}/public/gallery/dates`, { headers: apiHeaders })
      .then((r) => r.json()).then((d) => setDates(d.dates ?? [])).catch(console.error);
    fetchEvents("");
    fetchPhotos(EMPTY, 1);
  }, [fetchPhotos, fetchEvents]);

  const handleFilter = (next: Filters) => {
    // 연도가 바뀌면 이벤트 목록 새로고침
    if (next.year !== filters.year) fetchEvents(next.year);
    setFilters(next);
    fetchPhotos(next, 1);
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#111]/95 backdrop-blur border-b border-white/8">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-6">
          <div className="flex items-baseline gap-2 shrink-0">
            <span className="text-base font-bold tracking-[0.15em] uppercase">Tenasia</span>
            <span className="text-[10px] text-white/25 tracking-[0.4em] uppercase">Gallery</span>
          </div>
          <div className="flex-1 min-w-0">
            <FilterBar
              persons={persons}
              dates={dates}
              events={events}
              filters={filters}
              onChange={handleFilter}
            />
          </div>
          <span className="text-white/20 text-xs tabular-nums shrink-0">
            {total.toLocaleString()}
          </span>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <PhotoGrid
          photos={photos}
          loading={loading}
          hasMore={photos.length < total}
          onLoadMore={() => fetchPhotos(filters, page + 1)}
        />
      </main>
    </div>
  );
}
