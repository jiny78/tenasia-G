"use client";

import { useState, useRef, useEffect } from "react";
import { Person, DateEntry } from "@/types";
import { Filters } from "@/app/page";

interface Props {
  persons: Person[];
  dates: DateEntry[];
  filters: Filters;
  onChange: (f: Filters) => void;
}

const ROLES = ["감독", "배우", "가수", "모델", "MC", "아나운서", "작가"];

export default function FilterBar({ persons, dates, filters, onChange }: Props) {
  const [personQuery, setPersonQuery] = useState("");
  const [showPersonDrop, setShowPersonDrop] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const years = [...new Set(dates.map((d) => d.year))].sort((a, b) => b - a);
  const months = filters.year
    ? dates.filter((d) => String(d.year) === filters.year).map((d) => d.month).sort((a, b) => a - b)
    : [];

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setShowPersonDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredPersons = persons.filter((p) =>
    p.name.includes(personQuery)
  ).slice(0, 30);

  // 인물 선택 — year/month 유지 가능 (복합 필터)
  const selectPerson = (name: string) => {
    const next = name === filters.person
      ? { ...filters, person: "", month: "" }
      : { ...filters, person: name, role: "" };
    setPersonQuery(name === filters.person ? "" : name);
    setShowPersonDrop(false);
    onChange(next);
  };

  // 직책 선택 — 단독 필터 (인물·연도·월 초기화)
  const selectRole = (role: string) => {
    onChange(role === filters.role
      ? { person: "", role: "", year: "", month: "" }
      : { person: "", role, year: "", month: "" }
    );
    setPersonQuery("");
  };

  // 연도 선택 — 직책이 없으면 단독 / 인물이 있으면 복합
  const selectYear = (year: string) => {
    if (year === filters.year) {
      onChange({ ...filters, year: "", month: "" });
    } else if (filters.person) {
      // 인물+연도 복합
      onChange({ ...filters, year, month: "" });
    } else {
      // 단독 연도 필터 (인물·직책 초기화)
      onChange({ person: "", role: "", year, month: "" });
      setPersonQuery("");
    }
  };

  const selectMonth = (month: string) => {
    onChange({ ...filters, month: month === filters.month ? "" : month });
  };

  const clearAll = () => {
    onChange({ person: "", role: "", year: "", month: "" });
    setPersonQuery("");
  };

  const hasFilter = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">

      {/* 인물 검색 */}
      <div className="relative" ref={dropRef}>
        <input
          type="text"
          placeholder="인물 검색"
          value={personQuery}
          onChange={(e) => { setPersonQuery(e.target.value); setShowPersonDrop(true); }}
          onFocus={() => setShowPersonDrop(true)}
          className={`w-32 bg-white/5 border rounded-full px-3 py-1 text-xs placeholder-white/25 focus:outline-none transition ${
            filters.person ? "border-white text-white" : "border-white/15 text-white/70 focus:border-white/40"
          }`}
        />
        {showPersonDrop && filteredPersons.length > 0 && (
          <div className="absolute top-full mt-1 left-0 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
            {filteredPersons.map((p) => (
              <button
                key={p.name}
                onClick={() => selectPerson(p.name)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 flex justify-between items-center transition ${
                  filters.person === p.name ? "text-white bg-white/10" : "text-white/60"
                }`}
              >
                <span>{p.name}</span>
                <span className="text-white/25">{p.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 인물 선택된 경우 월 칩 표시 */}
      {filters.person && months.length === 0 && (
        <div className="flex gap-1 flex-wrap">
          {years.slice(0, 5).map((y) => (
            <Chip
              key={y}
              label={String(y)}
              active={filters.year === String(y)}
              onClick={() => selectYear(String(y))}
            />
          ))}
        </div>
      )}
      {filters.person && filters.year && months.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {months.map((m) => (
            <Chip
              key={m}
              label={`${m}월`}
              active={filters.month === String(m)}
              onClick={() => selectMonth(String(m))}
            />
          ))}
        </div>
      )}

      {/* 구분선 */}
      {!filters.person && <span className="text-white/15 text-xs">|</span>}

      {/* 직책 — 인물 없을 때만 표시 */}
      {!filters.person && (
        <div className="flex gap-1 flex-wrap">
          {ROLES.map((r) => (
            <Chip
              key={r}
              label={r}
              active={filters.role === r}
              onClick={() => selectRole(r)}
            />
          ))}
        </div>
      )}

      {/* 연도 — 인물 없을 때만 표시 */}
      {!filters.person && (
        <>
          <span className="text-white/15 text-xs">|</span>
          <div className="flex gap-1 flex-wrap">
            {years.map((y) => (
              <Chip
                key={y}
                label={String(y)}
                active={filters.year === String(y)}
                onClick={() => selectYear(String(y))}
              />
            ))}
          </div>
          {filters.year && months.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {months.map((m) => (
                <Chip
                  key={m}
                  label={`${m}월`}
                  active={filters.month === String(m)}
                  onClick={() => selectMonth(String(m))}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* 초기화 */}
      {hasFilter && (
        <button
          onClick={clearAll}
          className="text-white/30 hover:text-white text-xs underline underline-offset-2 transition"
        >
          초기화
        </button>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-0.5 rounded-full text-[11px] border transition ${
        active
          ? "bg-white text-black border-white font-medium"
          : "bg-transparent text-white/50 border-white/15 hover:border-white/40 hover:text-white/80"
      }`}
    >
      {label}
    </button>
  );
}
