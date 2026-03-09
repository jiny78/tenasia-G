"use client";

import { useState, useEffect, useCallback } from "react";
import FilterPanel from "@/components/FilterPanel";
import PhotoGrid from "@/components/PhotoGrid";
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

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    person: "",
    role: "",
    year: "",
    month: "",
  });

  const fetchPhotos = useCallback(async (f = filters, p = 1) => {
    setLoading(true);
    setError(null);
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
      if (p === 1) {
        const resolved = (data.photos ?? []).map((p: Photo) => ({ ...p, url: resolveUrl(p.url) }));
      setPhotos(resolved);
      } else {
        const resolved = (data.photos ?? []).map((p: Photo) => ({ ...p, url: resolveUrl(p.url) }));
        setPhotos((prev) => [...prev, ...resolved]);
      }
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) {
      setError("사진을 불러오지 못했습니다.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetch(`${API}/public/gallery/persons`, { headers: apiHeaders })
      .then((r) => r.json())
      .then((d) => setPersons(d.persons ?? []))
      .catch(console.error);

    fetch(`${API}/public/gallery/dates`, { headers: apiHeaders })
      .then((r) => r.json())
      .then((d) => setDates(d.dates ?? []))
      .catch(console.error);

    fetchPhotos();
  }, []);

  const applyFilter = (newFilters: typeof filters) => {
    setFilters(newFilters);
    fetchPhotos(newFilters, 1);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-baseline gap-3">
        <h1 className="text-2xl font-bold tracking-tight">TENASIA</h1>
        <span className="text-zinc-400 text-sm font-light">GALLERY</span>
        <span className="ml-auto text-zinc-500 text-xs">{total.toLocaleString()} photos</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Filter Panel */}
        <FilterPanel
          persons={persons}
          dates={dates}
          filters={filters}
          onChange={applyFilter}
        />

        {/* Photo Grid */}
        <main className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">{error}</div>
          ) : (
            <PhotoGrid
              photos={photos}
              loading={loading}
              hasMore={photos.length < total}
              onLoadMore={() => fetchPhotos(filters, page + 1)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
