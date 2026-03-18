"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import PhotoGrid from "@/components/PhotoGrid";
import FilterBar from "@/components/FilterBar";
import { Photo, Person, DateEntry, GalleryEvent } from "@/types";
import { useCredits } from "@/lib/credits";
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

// ── 사용자 아바타 드롭다운 ────────────────────────────────────
function UserMenu({ theme }: { theme: ThemeKey }) {
  const { data: session } = useSession();
  const { lang }          = useLang();
  const tr                = TRANSLATIONS[lang];
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);
  const isDark            = theme === "black" || theme === "charcoal";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!session) {
    return (
      <a href="/auth/signin"
        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
          isDark
            ? "border-white/15 text-white/60 hover:text-white hover:border-white/30"
            : "border-black/15 text-black/60 hover:text-black hover:border-black/30"
        }`}>
        {tr.signIn}
      </a>
    );
  }

  const name    = session.user?.name ?? session.user?.email ?? "User";
  const initial = name.charAt(0).toUpperCase();
  const image   = session.user?.image;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-full overflow-hidden border border-white/20 hover:border-white/50
                   transition-colors focus:outline-none">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-xs font-bold
                           ${isDark ? "bg-white/15 text-white" : "bg-black/10 text-black"}`}>
            {initial}
          </div>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 top-9 w-48 rounded-xl border shadow-2xl z-50 overflow-hidden
                         ${isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/8"}`}>
          <div className={`px-3 py-2.5 border-b ${isDark ? "border-white/8" : "border-black/8"}`}>
            <p className={`text-xs font-medium truncate ${isDark ? "text-white" : "text-black"}`}>{name}</p>
            <p className={`text-[11px] truncate ${isDark ? "text-white/40" : "text-black/40"}`}>
              {session.user?.email}
            </p>
          </div>
          <a href="/account"
            className={`flex items-center px-3 py-2 text-sm transition-colors
                        ${isDark ? "text-white/70 hover:bg-white/8 hover:text-white" : "text-black/70 hover:bg-black/5 hover:text-black"}`}>
            Dashboard
          </a>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={`w-full text-left flex items-center px-3 py-2 text-sm transition-colors
                        ${isDark ? "text-white/40 hover:bg-white/8 hover:text-white" : "text-black/40 hover:bg-black/5 hover:text-black"}`}>
            {tr.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

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

  // useCredits hook (로그인→DB, 비로그인→localStorage)
  const { balance: credits, refresh: refreshCredits } = useCredits();

  // localStorage에서 테마 복원
  useEffect(() => {
    const saved = localStorage.getItem("tg-theme") as ThemeKey | null;
    if (saved && THEMES[saved]) setTheme(saved);
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
    params.set("limit", "12");
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

          {/* 우측: 크레딧 + 테마 + 언어 + 유저 */}
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

            {/* 유저 메뉴 */}
            <UserMenu theme={theme} />
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
          onCreditsChange={refreshCredits}
        />
      </main>
    </div>
  );
}
