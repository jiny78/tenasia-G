"use client";

import { useState, useEffect, useCallback } from "react";
import PhotoGrid from "@/components/PhotoGrid";
import FilterBar from "@/components/FilterBar";
import { Photo, Person, DateEntry, GalleryEvent } from "@/types";
import { getCredits } from "@/lib/credits";

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

// ── 테마 정의 ────────────────────────────────────────────────
export type ThemeKey = "black" | "charcoal" | "cream" | "white";

export const THEMES: Record<ThemeKey, {
  label: string;
  swatch: string;
  bg: string;
  header: string;
  border: string;
  text: string;
  sub: string;
}> = {
  black:    { label: "흑",  swatch: "#111111", bg: "bg-[#111]",    header: "bg-[#111]/95",   border: "border-white/8",  text: "text-white",      sub: "text-white/30" },
  charcoal: { label: "회",  swatch: "#2a2a2a", bg: "bg-[#2a2a2a]", header: "bg-[#2a2a2a]/95",border: "border-white/10", text: "text-white",      sub: "text-white/30" },
  cream:    { label: "크림", swatch: "#ede8df", bg: "bg-[#ede8df]", header: "bg-[#ede8df]/95",border: "border-black/8",  text: "text-[#1a1a1a]", sub: "text-[#1a1a1a]/40" },
  white:    { label: "백",  swatch: "#f5f5f3", bg: "bg-[#f5f5f3]", header: "bg-[#f5f5f3]/95",border: "border-black/8",  text: "text-[#111]",    sub: "text-[#111]/35" },
};

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [theme, setTheme] = useState<ThemeKey>("black");
  const [credits, setCredits] = useState(0);

  // localStorage에서 테마 + 크레딧 복원
  useEffect(() => {
    const saved = localStorage.getItem("tg-theme") as ThemeKey | null;
    if (saved && THEMES[saved]) setTheme(saved);
    setCredits(getCredits());
  }, []);

  // 전역 저장 단축키 차단 (Ctrl+S, Ctrl+U)
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "S", "u", "U"].includes(e.key)) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", block);
    return () => document.removeEventListener("keydown", block);
  }, []);

  const changeTheme = (k: ThemeKey) => {
    setTheme(k);
    localStorage.setItem("tg-theme", k);
  };

  const t = THEMES[theme];

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
        ...ph, url: resolveUrl(ph.url),
      }));
      if (p === 1) setPhotos(resolved);
      else setPhotos((prev) => [...prev, ...resolved]);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

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
    if (next.year !== filters.year) fetchEvents(next.year);
    setFilters(next);
    fetchPhotos(next, 1);
  };

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 ${t.header} backdrop-blur border-b ${t.border} transition-colors duration-300`}>
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-6">
          {/* 로고 */}
          <div className="flex items-baseline gap-2 shrink-0">
            <span className="text-base font-bold tracking-[0.15em] uppercase">Tenasia</span>
            <span className={`text-[10px] tracking-[0.4em] uppercase ${t.sub}`}>Gallery</span>
          </div>

          {/* 필터 */}
          <div className="flex-1 min-w-0">
            <FilterBar
              persons={persons}
              dates={dates}
              events={events}
              filters={filters}
              theme={theme}
              onChange={handleFilter}
            />
          </div>

          {/* 우측: 다운로드 크레딧 + 카운트 + 테마 */}
          <div className="flex items-center gap-3 shrink-0">
            {credits > 0 ? (
              <span className="text-xs tabular-nums text-white bg-white/15 px-2 py-0.5 rounded-full">
                ↓ {credits}
              </span>
            ) : (
              <span className={`text-xs tabular-nums ${t.sub}`}>{total.toLocaleString()}</span>
            )}

            {/* 테마 선택 */}
            <div className="flex gap-1.5">
              {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => changeTheme(k)}
                  title={THEMES[k].label}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    theme === k ? "ring-2 ring-offset-1 ring-current scale-110" : "opacity-50 hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor: THEMES[k].swatch,
                    borderColor: theme === "white" || theme === "cream" ? "#00000030" : "#ffffff30",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <PhotoGrid
          photos={photos}
          loading={loading}
          hasMore={photos.length < total}
          onLoadMore={() => fetchPhotos(filters, page + 1)}
          theme={theme}
          onCreditsChange={setCredits}
        />
      </main>
    </div>
  );
}
