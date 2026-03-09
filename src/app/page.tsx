"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PhotoGrid from "@/components/PhotoGrid";
import FilterBar from "@/components/FilterBar";
import { Photo, Person, DateEntry } from "@/types";

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
  role: string;
  year: string;
  month: string;
};

const EMPTY: Filters = { person: "", role: "", year: "", month: "" };

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const pageRef = useRef(1);

  const fetchPhotos = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.person) params.set("person", f.person);
    if (f.role) params.set("role", f.role);
    if (f.year) params.set("year", f.year);
    if (f.month) params.set("month", f.month);
    params.set("page", String(p));
    params.set("limit", "60");

    try {
      const res = await fetch(`${API}/public/gallery?${params}`, { headers: apiHeaders });
      const data = await res.json();
      const resolved = (data.photos ?? []).map((ph: Photo) => ({ ...ph, url: resolveUrl(ph.url) }));
      if (p === 1) setPhotos(resolved);
      else setPhotos((prev) => [...prev, ...resolved]);
      setTotal(data.total ?? 0);
      pageRef.current = p;
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(`${API}/public/gallery/persons`, { headers: apiHeaders })
      .then((r) => r.json()).then((d) => setPersons(d.persons ?? [])).catch(console.error);
    fetch(`${API}/public/gallery/dates`, { headers: apiHeaders })
      .then((r) => r.json()).then((d) => setDates(d.dates ?? [])).catch(console.error);
    fetchPhotos(EMPTY, 1);
  }, [fetchPhotos]);

  // 필터 변경 — 독립 모드 / 복합 모드 구분
  const handleFilter = (next: Filters) => {
    setFilters(next);
    fetchPhotos(next, 1);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0e0e]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-widest uppercase">Tenasia</span>
            <span className="text-xs text-white/30 tracking-[0.3em] uppercase">Gallery</span>
          </div>
          <div className="flex-1">
            <FilterBar
              persons={persons}
              dates={dates}
              filters={filters}
              onChange={handleFilter}
            />
          </div>
          <span className="text-white/30 text-xs tabular-nums shrink-0">
            {total.toLocaleString()} photos
          </span>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6">
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
