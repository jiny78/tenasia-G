"use client";

import { useState, useRef, useEffect } from "react";
import { Person, DateEntry, GalleryEvent } from "@/types";
import { Filters, ThemeKey, THEMES } from "@/app/page";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

interface Props {
  persons: Person[];
  dates: DateEntry[];
  events: GalleryEvent[];
  filters: Filters;
  theme: ThemeKey;
  onChange: (f: Filters) => void;
}

export default function FilterBar({ persons, dates, events, filters, theme, onChange }: Props) {
  const { lang } = useLang();
  const tr = TRANSLATIONS[lang];
  const [query, setQuery] = useState(filters.person);
  const [showDrop, setShowDrop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "black" || theme === "charcoal";
  const years = [...new Set(dates.map((d) => d.year))].sort((a, b) => b - a);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setShowDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [filters.year]);

  const matched = persons
    .filter((p) => !query || p.name.includes(query))
    .slice(0, 25);

  const pickPerson = (name: string) => {
    const next = name === filters.person
      ? { ...filters, person: "" }
      : { person: name, event: "", year: "" };
    setQuery(name === filters.person ? "" : name);
    setShowDrop(false);
    onChange(next);
  };

  const pickYear = (y: string) => {
    const next = y === filters.year
      ? { person: "", event: "", year: "" }
      : { person: "", event: "", year: y };
    setQuery("");
    onChange(next);
  };

  const pickEvent = (name: string) => {
    const next = name === filters.event
      ? { ...filters, event: "" }
      : { ...filters, event: name };
    onChange(next);
  };

  const clear = () => { onChange({ person: "", event: "", year: "" }); setQuery(""); };
  const hasFilter = filters.person || filters.event || filters.year;

  const labelCls    = isDark ? "text-white/25"  : "text-black/35";
  const dividerCls  = isDark ? "text-white/10"  : "text-black/10";
  const inputActive = isDark ? "border-white text-white" : "border-black text-black";
  const inputIdle   = isDark
    ? "border-white/15 text-white/60 focus:border-white/40 placeholder-white/20"
    : "border-black/15 text-black/60 focus:border-black/40 placeholder-black/20";
  const dropBg    = isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10";
  const dropHover = isDark ? "hover:bg-white/8" : "hover:bg-black/5";
  const dropActive  = isDark ? "text-white"    : "text-black";
  const dropMuted   = isDark ? "text-white/55" : "text-black/55";
  const dropCount   = isDark ? "text-white/20" : "text-black/20";
  const clearCls  = isDark ? "text-white/25 hover:text-white/70" : "text-black/25 hover:text-black/70";
  const toggleCls = isDark
    ? "text-white/40 hover:text-white/70 border-white/12 hover:border-white/30"
    : "text-black/40 hover:text-black/70 border-black/12 hover:border-black/30";

  const filterBody = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {/* 인물 검색 */}
      <div className="relative" ref={dropRef}>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] uppercase tracking-widest shrink-0 ${labelCls}`}>{tr.person}</span>
          <input
            type="text"
            placeholder={tr.searchPlaceholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
            className={`w-28 bg-transparent border-b pb-0.5 text-xs focus:outline-none transition-colors ${
              filters.person ? inputActive : inputIdle
            }`}
          />
        </div>
        {showDrop && matched.length > 0 && (
          <div className={`absolute top-full mt-2 left-0 w-52 border rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto ${dropBg}`}>
            {matched.map((p) => (
              <button
                key={p.name}
                onClick={() => pickPerson(p.name)}
                className={`w-full text-left px-3 py-2 text-xs flex justify-between transition-colors ${dropHover} ${
                  filters.person === p.name ? dropActive : dropMuted
                }`}
              >
                <span>{p.name}</span>
                <span className={dropCount}>{p.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <span className={`text-xs ${dividerCls}`}>│</span>

      {/* 연도 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[10px] uppercase tracking-widest shrink-0 ${labelCls}`}>{tr.year}</span>
        {years.map((y) => (
          <Chip key={y} label={String(y)} active={filters.year === String(y)} isDark={isDark}
            onClick={() => pickYear(String(y))} />
        ))}
      </div>

      {/* 이벤트 칩 */}
      {filters.year && events.length > 0 && (
        <>
          <span className={`text-xs ${dividerCls}`}>│</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] uppercase tracking-widest shrink-0 ${labelCls}`}>{tr.event}</span>
            {events.slice(0, 30).map((ev) => (
              <Chip key={ev.name} label={ev.name} count={ev.count}
                active={filters.event === ev.name} isDark={isDark}
                onClick={() => pickEvent(ev.name)} />
            ))}
          </div>
        </>
      )}

      {hasFilter && (
        <button onClick={clear} className={`text-[10px] ml-1 transition-colors ${clearCls}`}>✕</button>
      )}
    </div>
  );

  return (
    <>
      {/* ── 모바일 (md 미만) ── */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border transition-all ${toggleCls} ${
              mobileOpen ? (isDark ? "border-white/30" : "border-black/30") : ""
            }`}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="2" width="10" height="1.2" rx="0.6"/>
              <rect x="3" y="5.4" width="6" height="1.2" rx="0.6"/>
              <rect x="5" y="8.8" width="2" height="1.2" rx="0.6"/>
            </svg>
            {tr.filter}
            {hasFilter && (
              <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-medium ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}>
                {[filters.year, filters.event, filters.person].filter(Boolean).length}
              </span>
            )}
          </button>

          {filters.year && (
            <ActiveTag label={filters.year} isDark={isDark}
              onClear={() => pickYear(filters.year)} />
          )}
          {filters.event && (
            <ActiveTag label={filters.event} isDark={isDark}
              onClear={() => pickEvent(filters.event)} />
          )}
          {filters.person && (
            <ActiveTag label={filters.person} isDark={isDark}
              onClear={() => { setQuery(""); onChange({ person: "", event: filters.event, year: filters.year }); }} />
          )}
        </div>

        {mobileOpen && (
          <div className={`mt-3 pt-3 border-t ${isDark ? "border-white/8" : "border-black/8"}`}>
            {filterBody}
          </div>
        )}
      </div>

      {/* ── 데스크톱 (md 이상) ── */}
      <div className="hidden md:block">
        {filterBody}
      </div>
    </>
  );
}

function ActiveTag({ label, isDark, onClear }: { label: string; isDark: boolean; onClear: () => void }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
      isDark ? "bg-white/10 text-white/80" : "bg-black/8 text-black/70"
    }`}>
      {label}
      <button onClick={onClear} className="opacity-50 hover:opacity-100 transition-opacity leading-none">✕</button>
    </span>
  );
}

function Chip({
  label, active, onClick, count, isDark,
}: {
  label: string; active: boolean; onClick: () => void; count?: number; isDark: boolean;
}) {
  const activeCls = isDark
    ? "bg-white text-black border-white font-medium"
    : "bg-[#1a1a1a] text-white border-[#1a1a1a] font-medium";
  const inactiveCls = isDark
    ? "bg-transparent text-white/45 border-white/12 hover:border-white/35 hover:text-white/75"
    : "bg-transparent text-black/45 border-black/12 hover:border-black/35 hover:text-black/75";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border transition-all ${
        active ? activeCls : inactiveCls
      }`}
    >
      {label}
      {count !== undefined && !active && (
        <span className={`text-[9px] ${isDark ? "text-white/25" : "text-black/25"}`}>{count}</span>
      )}
    </button>
  );
}
