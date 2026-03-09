"use client";

import { useState, useRef, useEffect } from "react";
import { Person, DateEntry, GalleryEvent } from "@/types";
import { Filters } from "@/app/page";

interface Props {
  persons: Person[];
  dates: DateEntry[];
  events: GalleryEvent[];
  filters: Filters;
  onChange: (f: Filters) => void;
}

export default function FilterBar({ persons, dates, events, filters, onChange }: Props) {
  const [query, setQuery] = useState(filters.person);
  const [showDrop, setShowDrop] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

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
    // 연도 → 이벤트 모드: 인물 초기화
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

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">

      {/* 인물 검색 */}
      <div className="relative" ref={dropRef}>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/25 uppercase tracking-widest shrink-0">인물</span>
          <input
            type="text"
            placeholder="검색..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
            className={`w-28 bg-transparent border-b pb-0.5 text-xs placeholder-white/20 focus:outline-none transition-colors ${
              filters.person ? "border-white text-white" : "border-white/15 text-white/60 focus:border-white/40"
            }`}
          />
        </div>

        {showDrop && matched.length > 0 && (
          <div className="absolute top-full mt-2 left-0 w-52 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto">
            {matched.map((p) => (
              <button
                key={p.name}
                onClick={() => pickPerson(p.name)}
                className={`w-full text-left px-3 py-2 text-xs flex justify-between transition-colors hover:bg-white/8 ${
                  filters.person === p.name ? "text-white" : "text-white/55"
                }`}
              >
                <span>{p.name}</span>
                <span className="text-white/20">{p.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="text-white/10 text-xs">│</span>

      {/* 연도 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-white/25 uppercase tracking-widest shrink-0">연도</span>
        {years.map((y) => (
          <Chip
            key={y}
            label={String(y)}
            active={filters.year === String(y)}
            onClick={() => pickYear(String(y))}
          />
        ))}
      </div>

      {/* 연도 선택 시 → 이벤트 칩 */}
      {filters.year && events.length > 0 && (
        <>
          <span className="text-white/10 text-xs">│</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-white/25 uppercase tracking-widest shrink-0">행사</span>
            {events.slice(0, 30).map((ev) => (
              <Chip
                key={ev.name}
                label={ev.name}
                count={ev.count}
                active={filters.event === ev.name}
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
          className="text-white/25 hover:text-white/70 text-[10px] ml-1 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function Chip({
  label, active, onClick, count,
}: {
  label: string; active: boolean; onClick: () => void; count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border transition-all ${
        active
          ? "bg-white text-black border-white font-medium"
          : "bg-transparent text-white/45 border-white/12 hover:border-white/35 hover:text-white/75"
      }`}
    >
      {label}
      {count !== undefined && !active && (
        <span className="text-white/25 text-[9px]">{count}</span>
      )}
    </button>
  );
}
