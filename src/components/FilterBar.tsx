"use client";

import { useState, useRef, useEffect } from "react";
import { Person, DateEntry, GalleryEvent } from "@/types";
import { Filters, ThemeKey, THEMES } from "@/app/page";

interface Props {
  persons: Person[];
  dates: DateEntry[];
  events: GalleryEvent[];
  filters: Filters;
  theme: ThemeKey;
  onChange: (f: Filters) => void;
}

export default function FilterBar({ persons, dates, events, filters, theme, onChange }: Props) {
  const [query, setQuery] = useState(filters.person);
  const [showDrop, setShowDrop] = useState(false);
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
  const dropBg      = isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10";
  const dropHover   = isDark ? "hover:bg-white/8" : "hover:bg-black/5";
  const dropActive  = isDark ? "text-white"      : "text-black";
  const dropMuted   = isDark ? "text-white/55"   : "text-black/55";
  const dropCount   = isDark ? "text-white/20"   : "text-black/20";
  const clearCls    = isDark ? "text-white/25 hover:text-white/70" : "text-black/25 hover:text-black/70";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">

      {/* 인물 검색 */}
      <div className="relative" ref={dropRef}>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] uppercase tracking-widest shrink-0 ${labelCls}`}>인물</span>
          <input
            type="text"
            placeholder="검색..."
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
        <span className={`text-[10px] uppercase tracking-widest shrink-0 ${labelCls}`}>연도</span>
        {years.map((y) => (
          <Chip
            key={y}
            label={String(y)}
            active={filters.year === String(y)}
            isDark={isDark}
            onClick={() => pickYear(String(y))}
          />
        ))}
      </div>

      {/* 연도 선택 시 → 이벤트 칩 */}
      {filters.year && events.length > 0 && (
        <>
          <span className={`text-xs ${dividerCls}`}>│</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] uppercase tracking-widest shrink-0 ${labelCls}`}>행사</span>
            {events.slice(0, 30).map((ev) => (
              <Chip
                key={ev.name}
                label={ev.name}
                count={ev.count}
                active={filters.event === ev.name}
                isDark={isDark}
                onClick={() => pickEvent(ev.name)}
              />
            ))}
          </div>
        </>
      )}

      {/* 초기화 */}
      {hasFilter && (
        <button
          onClick={clear}
          className={`text-[10px] ml-1 transition-colors ${clearCls}`}
        >
          ✕
        </button>
      )}
    </div>
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
  const countCls = isDark ? "text-white/25 text-[9px]" : "text-black/25 text-[9px]";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border transition-all ${
        active ? activeCls : inactiveCls
      }`}
    >
      {label}
      {count !== undefined && !active && (
        <span className={countCls}>{count}</span>
      )}
    </button>
  );
}
