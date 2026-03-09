"use client";

import { Person, DateEntry } from "@/types";

interface Filters {
  person: string;
  role: string;
  year: string;
  month: string;
}

interface Props {
  persons: Person[];
  dates: DateEntry[];
  filters: Filters;
  onChange: (f: Filters) => void;
}

const ROLES = ["감독", "배우", "가수", "모델", "MC", "아나운서"];
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

export default function FilterPanel({ persons, dates, filters, onChange }: Props) {
  const years = [...new Set(dates.map((d) => d.year))].sort((a, b) => b - a);

  const set = (key: keyof Filters, val: string) =>
    onChange({ ...filters, [key]: val });

  const clear = () => onChange({ person: "", role: "", year: "", month: "" });

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-800 overflow-y-auto p-4 space-y-6">
      {/* Clear */}
      {Object.values(filters).some(Boolean) && (
        <button
          onClick={clear}
          className="w-full text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded px-3 py-1.5 transition"
        >
          필터 초기화
        </button>
      )}

      {/* 인물 */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">인물</p>
        <input
          type="text"
          placeholder="이름 검색..."
          value={filters.person}
          onChange={(e) => set("person", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onChange(filters)}
          className="w-full bg-zinc-900 text-sm text-white border border-zinc-700 rounded px-2 py-1.5 mb-2 focus:outline-none focus:border-zinc-400"
        />
        <ul className="space-y-0.5 max-h-48 overflow-y-auto">
          {persons.slice(0, 50).map((p) => (
            <li key={p.name}>
              <button
                onClick={() => set("person", filters.person === p.name ? "" : p.name)}
                className={`w-full text-left text-xs px-2 py-1 rounded transition ${
                  filters.person === p.name
                    ? "bg-white text-black"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span>{p.name}</span>
                <span className="float-right text-zinc-500">{p.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 직책 */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">직책</p>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => set("role", filters.role === r ? "" : r)}
              className={`text-xs px-2 py-1 rounded transition ${
                filters.role === r
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-zinc-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 연도 */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">연도</p>
        <div className="flex flex-wrap gap-1.5">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => set("year", filters.year === String(y) ? "" : String(y))}
              className={`text-xs px-2 py-1 rounded transition ${
                filters.year === String(y)
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-zinc-500"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* 월 */}
      {filters.year && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">월</p>
          <div className="flex flex-wrap gap-1.5">
            {MONTHS.map((m, i) => {
              const monthNum = String(i + 1);
              return (
                <button
                  key={m}
                  onClick={() => set("month", filters.month === monthNum ? "" : monthNum)}
                  className={`text-xs px-2 py-1 rounded transition ${
                    filters.month === monthNum
                      ? "bg-white text-black"
                      : "bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
