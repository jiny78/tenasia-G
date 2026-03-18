"use client";

import { useState, useEffect, useCallback } from "react";
import PhotoGrid from "@/components/PhotoGrid";
import FilterBar from "@/components/FilterBar";
import { Photo, Person, DateEntry, GalleryEvent } from "@/types";
import { getCredits } from "@/lib/credits";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

// 모든 API 호출은 /api/gallery/* 서버 프록시를 통해 처리
// → API 키, R2 URL이 클라이언트에 노출되지 않음

export type Filters = {
  person: string;
  event: string;
  year: string;
};

const EMPTY: Filters = { person: "", event: "", year: "" };

// ── 테마 정의 ────────────────────────────────────────────────
export type ThemeKey = "black" | "charcoal" | "cream" | "white";

export const THEMES: Record<ThemeKey, {
  labelKey: "themeBlack" | "themeCharcoal" | "themeCream" | "themeWhite";
  swatch: string;
  bg: string;
  header: string;
  border: string;
  text: string;
  sub: string;
}> = {
  black:    { labelKey: "themeBlack",    swatch: "#111111", bg: "bg-[#111]",    header: "bg-[#111]/95",   border: "border-white/8",  text: "text-white",      sub: "text-white/30" },
  charcoal: { labelKey: "themeCharcoal", swatch: "#2a2a2a", bg: "bg-[#2a2a2a]", header: "bg-[#2a2a2a]/95",border: "border-white/10", text: "text-white",      sub: "text-white/30" },
  cream:    { labelKey: "themeCream",    swatch: "#ede8df", bg: "bg-[#ede8df]", header: "bg-[#ede8df]/95",border: "border-black/8",  text: "text-[#1a1a1a]", sub: "text-[#1a1a1a]/40" },
  white:    { labelKey: "themeWhite",    swatch: "#f5f5f3", bg: "bg-[#f5f5f3]", header: "bg-[#f5f5f3]/95",border: "border-black/8",  text: "text-[#111]",    sub: "text-[#111]/35" },
};

export default function Home() {
  const { lang, setLang } = useLang();
  const tr = TRANSLATIONS[lang];
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
    params.set("limit", "24");
    try {
      const res = await fetch(`/api/gallery?${params}`);
      const data = await res.json();
      if (p === 1) setPhotos(data.photos ?? []);
      else setPhotos((prev) => [...prev, ...(data.photos ?? [])]);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchEvents = useCallback(async (year: string) => {
    const params = year ? `?year=${year}` : "";
    try {
      const res = await fetch(`/api/gallery/events${params}`);
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetch("/api/gallery/persons")
      .then((r) => r.json()).then((d) => setPersons(d.persons ?? [])).catch(console.error);
    fetch("/api/gallery/dates")
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
          <a href="/" className="flex items-baseline gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <span className="text-base font-bold tracking-[0.15em] uppercase">Tenasia</span>
            <span className={`text-[10px] tracking-[0.4em] uppercase ${t.sub}`}>{tr.gallery}</span>
          </a>

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

          {/* 우측: 다운로드 크레딧 + 카운트 + 테마 + 언어 */}
          <div className="flex items-center gap-3 shrink-0">
            {credits > 0 ? (
              <span className="text-xs tabular-nums text-white bg-white/15 px-2 py-0.5 rounded-full">
                ↓ {credits}
              </span>
            ) : (
              <span className={`text-xs tabular-nums ${t.sub}`}>{total.toLocaleString()}</span>
            )}

            {/* 언어 토글 */}
            <div className={`flex items-center text-[11px] font-medium border rounded-full overflow-hidden ${t.border}`}>
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 transition-colors ${
                  lang === "en"
                    ? (theme === "black" || theme === "charcoal" ? "bg-white text-black" : "bg-black text-white")
                    : `${t.sub} hover:opacity-80`
                }`}
              >EN</button>
              <button
                onClick={() => setLang("ko")}
                className={`px-2 py-0.5 transition-colors ${
                  lang === "ko"
                    ? (theme === "black" || theme === "charcoal" ? "bg-white text-black" : "bg-black text-white")
                    : `${t.sub} hover:opacity-80`
                }`}
              >한</button>
            </div>

            {/* 테마 선택 */}
            <div className="flex gap-1.5">
              {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => changeTheme(k)}
                  title={tr[THEMES[k].labelKey]}
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
