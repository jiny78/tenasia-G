"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import PhotoGrid from "@/components/PhotoGrid";
import FilterBar from "@/components/FilterBar";
import CreditBadge from "@/components/CreditBadge";
import { Photo, Person, DateEntry, GalleryEvent } from "@/types";
import { useCredits } from "@/lib/credits";
import { useLang, TRANSLATIONS } from "@/lib/i18n";
import { THEMES, ThemeKey } from "@/lib/themes";
import LoadingBar from "@/components/LoadingBar";

export type { ThemeKey };
export { THEMES };

export type Filters = {
  q:           string;
  person:      string;
  event:       string;
  dateFrom:    string;  // YYYY-MM
  dateTo:      string;  // YYYY-MM
  year:        string;  // legacy compat
  orientation: "" | "landscape" | "portrait" | "square";
  agency:      string;
};

const EMPTY: Filters = {
  q: "", person: "", event: "", dateFrom: "", dateTo: "", year: "", orientation: "", agency: "",
};

type AgencyEntry = { name: string; count: number };

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
      <Link href="/auth/signin"
        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
          isDark
            ? "border-white/15 text-white/60 hover:text-white hover:border-white/30"
            : "border-black/15 text-black/60 hover:text-black hover:border-black/30"
        }`}>
        {tr.signIn}
      </Link>
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
          <Link href="/account"
            className={`flex items-center px-3 py-2 text-sm transition-colors
                        ${isDark ? "text-white/70 hover:bg-white/8 hover:text-white" : "text-black/70 hover:bg-black/5 hover:text-black"}`}>
            Dashboard
          </Link>
          {session.user?.isAdmin && (
            <Link href="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors
                          ${isDark ? "text-amber-400 hover:bg-white/8 hover:text-amber-300" : "text-amber-600 hover:bg-black/5 hover:text-amber-700"}`}>
              <span className="text-xs">⚙</span> 관리자
            </Link>
          )}
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
  const router        = useRouter();
  const { lang, setLang } = useLang();
  const tr = TRANSLATIONS[lang];
  const [photos,    setPhotos]    = useState<Photo[]>([]);
  const [persons,   setPersons]   = useState<Person[]>([]);
  const [dates,     setDates]     = useState<DateEntry[]>([]);
  const [events,    setEvents]    = useState<GalleryEvent[]>([]);
  const [agencies,  setAgencies]  = useState<AgencyEntry[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [filters,   setFilters]   = useState<Filters>(EMPTY);
  const [theme,     setTheme]     = useState<ThemeKey>(() => {
    if (typeof window === "undefined") return "black";
    const saved = localStorage.getItem("tg-theme") as ThemeKey | null;
    return saved && THEMES[saved] ? saved : "black";
  });

  const { refresh: refreshCredits } = useCredits();

  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "S", "u", "U"].includes(e.key)) e.preventDefault();
    };
    document.addEventListener("keydown", block);
    return () => document.removeEventListener("keydown", block);
  }, []);

  const changeTheme = (k: ThemeKey) => {
    setTheme(k);
    localStorage.setItem("tg-theme", k);
  };

  const t = THEMES[theme];

  /* ── API 호출 ──────────────────────────────────────────────── */
  const fetchPhotos = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.q)           params.set("q",           f.q);
    if (f.person)      params.set("person",      f.person);
    if (f.event)       params.set("event",       f.event);
    if (f.dateFrom)    params.set("dateFrom",    f.dateFrom);
    if (f.dateTo)      params.set("dateTo",      f.dateTo);
    if (f.year)        params.set("year",        f.year);
    if (f.orientation) params.set("orientation", f.orientation);
    if (f.agency)      params.set("agency",      f.agency);
    params.set("page",  String(p));
    params.set("limit", "12");
    try {
      const res  = await fetch(`/api/gallery?${params}`);
      const data = await res.json();
      if (p === 1) setPhotos(data.photos ?? []);
      else         setPhotos((prev) => [...prev, ...(data.photos ?? [])]);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchEvents = useCallback(async (year: string) => {
    const qs = year ? `?year=${year}` : "";
    try {
      const res  = await fetch(`/api/gallery/events${qs}`);
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (e) { console.error(e); }
  }, []);


  /* ── 초기 로드: URL → Filters 복원 ────────────────────────── */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const initial: Filters = {
      q:           sp.get("q")           ?? "",
      person:      sp.get("person")      ?? "",
      event:       sp.get("event")       ?? "",
      dateFrom:    sp.get("dateFrom")    ?? "",
      dateTo:      sp.get("dateTo")      ?? "",
      year:        sp.get("year")        ?? "",
      orientation: (sp.get("orientation") ?? "") as Filters["orientation"],
      agency:      sp.get("agency")      ?? "",
    };
    setFilters(initial);

    const metaQs = initial.year ? `?year=${initial.year}` : "";
    fetch(`/api/gallery/meta${metaQs}`)
      .then((r) => r.json())
      .then((d) => {
        setPersons(d.persons   ?? []);
        setDates(d.dates       ?? []);
        setEvents(d.events     ?? []);
        setAgencies(d.agencies ?? []);
      })
      .catch(console.error);
    fetchPhotos(initial, 1);
  }, [fetchPhotos, fetchEvents]); // stable callbacks — runs once

  /* ── 필터 변경 핸들러 ──────────────────────────────────────── */
  const handleFilter = (next: Filters) => {
    // URL 업데이트
    const params = new URLSearchParams();
    if (next.q)           params.set("q",           next.q);
    if (next.person)      params.set("person",      next.person);
    if (next.event)       params.set("event",       next.event);
    if (next.dateFrom)    params.set("dateFrom",    next.dateFrom);
    if (next.dateTo)      params.set("dateTo",      next.dateTo);
    if (next.year)        params.set("year",        next.year);
    if (next.orientation) params.set("orientation", next.orientation);
    if (next.agency)      params.set("agency",      next.agency);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });

    if (next.year !== filters.year) fetchEvents(next.year);
    setFilters(next);
    fetchPhotos(next, 1);
  };

  const isDark = theme === "black" || theme === "charcoal";

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-300`}>
      {/* 로딩 바 */}
      <LoadingBar loading={loading} isDark={isDark} />
      {/* Header */}
      <header className={`sticky top-0 z-30 ${t.header} backdrop-blur border-b ${t.border} transition-colors duration-300`}>
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-start gap-6">
          {/* 로고 */}
          <Link href="/" className="flex items-baseline gap-2 shrink-0 hover:opacity-80 transition-opacity mt-1">
            <span className="text-base font-bold tracking-[0.15em] uppercase">Tenasia</span>
            <span className={`text-[10px] tracking-[0.4em] uppercase ${t.sub}`}>{tr.gallery}</span>
          </Link>

          {/* 필터 */}
          <div className="flex-1 min-w-0">
            <FilterBar
              persons={persons}
              dates={dates}
              events={events}
              agencies={agencies}
              filters={filters}
              theme={theme}
              total={total}
              onChange={handleFilter}
            />
          </div>

          {/* 우측: 크레딧 + 테마 + 언어 + 유저 */}
          <div className="flex items-center gap-3 shrink-0 mt-1">
            <CreditBadge theme={theme} />

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
