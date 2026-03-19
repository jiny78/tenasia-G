"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Person, DateEntry, GalleryEvent } from "@/types";
import { Filters, ThemeKey } from "@/app/page";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

type AgencyEntry = { name: string; count: number };

interface Props {
  persons:   Person[];
  dates:     DateEntry[];
  events:    GalleryEvent[];
  agencies:  AgencyEntry[];
  filters:   Filters;
  theme:     ThemeKey;
  total:     number;
  onChange:  (f: Filters) => void;
}

type ActivePill = "person" | "event" | "date" | "orientation" | "agency" | null;

/* ─── 메인 컴포넌트 ──────────────────────────────────────────── */
export default function FilterBar({
  persons, dates, events, agencies, filters, theme, total, onChange,
}: Props) {
  const { lang } = useLang();
  const tr = TRANSLATIONS[lang];
  const isDark = theme === "black" || theme === "charcoal";

  /* search */
  const [searchInput, setSearchInput]   = useState(filters.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* person dropdown filter */
  const [personQuery, setPersonQuery] = useState("");

  /* active pill */
  const [activePill, setActivePill] = useState<ActivePill>(null);
  const pillRowRef = useRef<HTMLDivElement>(null);

  /* sync search input when filters reset externally */
  useEffect(() => { setSearchInput(filters.q); }, [filters.q]);

  /* close dropdown on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pillRowRef.current && !pillRowRef.current.contains(e.target as Node))
        setActivePill(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* derived */
  const yearMonths = dates
    .map((d) => `${d.year}-${String(d.month).padStart(2, "0")}`)
    .sort()
    .reverse();
  const years = [...new Set(dates.map((d) => d.year))].sort((a, b) => b - a);
  const matchedPersons = persons
    .filter((p) => !personQuery || p.name.toLowerCase().includes(personQuery.toLowerCase()))
    .slice(0, 25);

  /* handlers */
  const handleSearch = useCallback((val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, q: val });
    }, 300);
  }, [filters, onChange]);

  const togglePill = (p: ActivePill) =>
    setActivePill((v) => (v === p ? null : p));

  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const clearAll = () => {
    setSearchInput("");
    setPersonQuery("");
    onChange({ q: "", person: "", event: "", dateFrom: "", dateTo: "", year: "", orientation: "", agency: "" });
  };

  /* active flags */
  const hasQ           = !!filters.q;
  const hasPerson      = !!filters.person;
  const hasEvent       = !!filters.event;
  const hasDate        = !!(filters.dateFrom || filters.dateTo || filters.year);
  const hasOrientation = !!filters.orientation;
  const hasAgency      = !!filters.agency;
  const hasAny         = hasQ || hasPerson || hasEvent || hasDate || hasOrientation || hasAgency;

  /* theme vars */
  const borderFaint   = isDark ? "border-white/10"              : "border-black/8";
  const inputBg       = isDark ? "bg-white/[0.05]"              : "bg-black/[0.04]";
  const subText       = isDark ? "text-white/35"                : "text-black/35";
  const mainText      = isDark ? "text-white"                   : "text-black";
  const dropBg        = isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10";
  const dropHover     = isDark ? "hover:bg-white/8"             : "hover:bg-black/5";
  const dropActiveCls = isDark ? "bg-white/12 text-white"       : "bg-black/8 text-black";
  const dropMuted     = isDark ? "text-white/60"                : "text-black/60";
  const tagBg         = isDark ? "bg-white/10 text-white/80"    : "bg-black/[0.07] text-black/70";

  const pillBase = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border transition-all whitespace-nowrap";
  const pillActive   = isDark
    ? "border-white/45 text-white bg-white/[0.08]"
    : "border-black/35 text-black bg-black/[0.06]";
  const pillInactive = isDark
    ? "border-white/12 text-white/45 hover:border-white/30 hover:text-white/75"
    : "border-black/12 text-black/45 hover:border-black/30 hover:text-black/75";

  const dateLabel = filters.year
    ? filters.year
    : (filters.dateFrom || filters.dateTo)
      ? `${filters.dateFrom || "…"} – ${filters.dateTo || "…"}`
      : tr.dateRange;

  const orientLabel = filters.orientation
    ? tr[`photo${filters.orientation.charAt(0).toUpperCase()}${filters.orientation.slice(1)}` as "photoLandscape" | "photoPortrait" | "photoSquare"]
    : tr.photoOrientation;

  return (
    <div className="flex flex-col gap-2 w-full">

      {/* ── Row 1: 검색바 ──────────────────────────────── */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${borderFaint} ${inputBg}`}>
        <svg className={subText} width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="5.5" cy="5.5" r="4" />
          <path d="M9 9l2.5 2.5" />
        </svg>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={tr.searchBarPlaceholder}
          className={`flex-1 min-w-0 bg-transparent text-xs focus:outline-none
                      ${isDark ? "text-white placeholder-white/25" : "text-black placeholder-black/25"}`}
        />
        {searchInput && (
          <button onClick={() => handleSearch("")}
            className={`${subText} hover:${mainText} leading-none shrink-0 transition-colors`}>✕</button>
        )}
      </div>

      {/* ── Row 2: 필터 필 ─────────────────────────────── */}
      <div ref={pillRowRef}
        className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-x-visible pb-0.5 sm:pb-0">

        {/* ── Person ── */}
        <div className="relative shrink-0">
          <button
            onClick={() => togglePill("person")}
            className={`${pillBase} ${(hasPerson || activePill === "person") ? pillActive : pillInactive}`}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="shrink-0">
              <circle cx="6" cy="4" r="2.5"/>
              <path d="M1.5 10c0-2.5 9-2.5 9 0" strokeWidth="0"/>
            </svg>
            {filters.person || tr.person}
            {hasPerson && <span className="ml-0.5">✕</span>}
          </button>

          {activePill === "person" && (
            <DropPanel isDark={isDark} dropBg={dropBg} className="w-52">
              <div className="p-2 border-b border-inherit">
                <input
                  autoFocus
                  type="text"
                  value={personQuery}
                  onChange={(e) => setPersonQuery(e.target.value)}
                  placeholder={tr.searchPlaceholder}
                  className={`w-full bg-transparent text-xs focus:outline-none
                    ${isDark ? "text-white placeholder-white/30" : "text-black placeholder-black/30"}`}
                />
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {filters.person && (
                  <button onClick={() => { set({ person: "" }); setPersonQuery(""); setActivePill(null); }}
                    className={`w-full text-left px-3 py-1.5 text-xs ${dropHover} ${dropMuted}`}>
                    ✕ Clear
                  </button>
                )}
                {matchedPersons.map((p) => (
                  <button key={p.name}
                    onClick={() => { set({ person: p.name }); setPersonQuery(""); setActivePill(null); }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex justify-between ${dropHover}
                                ${filters.person === p.name ? dropActiveCls : dropMuted}`}>
                    <span className="truncate pr-2">{p.name}</span>
                    <span className={isDark ? "text-white/20" : "text-black/20"}>{p.count}</span>
                  </button>
                ))}
              </div>
            </DropPanel>
          )}
        </div>

        {/* ── Event ── */}
        <div className="relative shrink-0">
          <button
            onClick={() => togglePill("event")}
            className={`${pillBase} ${(hasEvent || activePill === "event") ? pillActive : pillInactive}`}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="1" y="2" width="10" height="9" rx="1.5"/>
              <path d="M4 1v2M8 1v2M1 6h10"/>
            </svg>
            {filters.event || tr.event}
            {hasEvent && <span className="ml-0.5">✕</span>}
          </button>

          {activePill === "event" && (
            <DropPanel isDark={isDark} dropBg={dropBg} className="w-64">
              <div className="max-h-56 overflow-y-auto py-1">
                {filters.event && (
                  <button onClick={() => { set({ event: "" }); setActivePill(null); }}
                    className={`w-full text-left px-3 py-1.5 text-xs ${dropHover} ${dropMuted}`}>
                    ✕ Clear
                  </button>
                )}
                {events.slice(0, 60).map((ev) => (
                  <button key={ev.name}
                    onClick={() => { set({ event: ev.name }); setActivePill(null); }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex justify-between ${dropHover}
                                ${filters.event === ev.name ? dropActiveCls : dropMuted}`}>
                    <span className="truncate pr-2">{ev.name}</span>
                    <span className={isDark ? "text-white/20" : "text-black/20"}>{ev.count}</span>
                  </button>
                ))}
                {events.length === 0 && (
                  <p className={`px-3 py-3 text-xs ${subText}`}>No events</p>
                )}
              </div>
            </DropPanel>
          )}
        </div>

        {/* ── Date Range ── */}
        <DateRangePill
          filters={filters}
          years={years}
          yearMonths={yearMonths}
          hasDate={hasDate}
          activePill={activePill}
          pillBase={pillBase}
          pillActive={pillActive}
          pillInactive={pillInactive}
          isDark={isDark}
          dropBg={dropBg}
          subText={subText}
          mainText={mainText}
          dateLabel={dateLabel}
          onToggle={() => togglePill("date")}
          onApply={(patch) => { onChange({ ...filters, ...patch }); setActivePill(null); }}
          onClear={() => { set({ dateFrom: "", dateTo: "", year: "" }); setActivePill(null); }}
        />

        {/* ── Orientation ── */}
        <div className="relative shrink-0">
          <button
            onClick={() => togglePill("orientation")}
            className={`${pillBase} ${(hasOrientation || activePill === "orientation") ? pillActive : pillInactive}`}>
            <OrientIcon o={filters.orientation || ""} size={10} />
            {orientLabel}
            {hasOrientation && <span className="ml-0.5">✕</span>}
          </button>

          {activePill === "orientation" && (
            <DropPanel isDark={isDark} dropBg={dropBg} className="w-auto">
              <div className="p-2 flex gap-1">
                {(["", "landscape", "portrait", "square"] as const).map((o) => {
                  const label = o === ""
                    ? tr.filterAll
                    : tr[`photo${o.charAt(0).toUpperCase()}${o.slice(1)}` as "photoLandscape" | "photoPortrait" | "photoSquare"];
                  return (
                    <button key={o || "all"}
                      onClick={() => { set({ orientation: o }); setActivePill(null); }}
                      className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded text-[11px] transition-all
                                  ${filters.orientation === o ? dropActiveCls : `${dropMuted} ${dropHover}`}`}>
                      <OrientIcon o={o} size={16} />
                      <span className="whitespace-nowrap">{label}</span>
                    </button>
                  );
                })}
              </div>
            </DropPanel>
          )}
        </div>

        {/* ── Agency (only if data available) ── */}
        {agencies.length > 0 && (
          <div className="relative shrink-0">
            <button
              onClick={() => togglePill("agency")}
              className={`${pillBase} ${(hasAgency || activePill === "agency") ? pillActive : pillInactive}`}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 10V4l5-3 5 3v6"/>
                <rect x="4" y="6" width="4" height="4"/>
              </svg>
              {filters.agency || tr.agency}
              {hasAgency && <span className="ml-0.5">✕</span>}
            </button>

            {activePill === "agency" && (
              <DropPanel isDark={isDark} dropBg={dropBg} className="w-44">
                <div className="max-h-56 overflow-y-auto py-1">
                  {filters.agency && (
                    <button onClick={() => { set({ agency: "" }); setActivePill(null); }}
                      className={`w-full text-left px-3 py-1.5 text-xs ${dropHover} ${dropMuted}`}>
                      ✕ Clear
                    </button>
                  )}
                  {agencies.map((a) => (
                    <button key={a.name}
                      onClick={() => { set({ agency: a.name }); setActivePill(null); }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex justify-between ${dropHover}
                                  ${filters.agency === a.name ? dropActiveCls : dropMuted}`}>
                      <span>{a.name}</span>
                      <span className={isDark ? "text-white/20" : "text-black/20"}>{a.count}</span>
                    </button>
                  ))}
                </div>
              </DropPanel>
            )}
          </div>
        )}

        {/* ── 결과 수 ── */}
        <span className={`ml-auto shrink-0 text-[11px] tabular-nums ${subText}`}>
          {tr.photosCount(total)}
        </span>
      </div>

      {/* ── Row 3: 활성 필터 태그 ─────────────────────── */}
      {hasAny && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.q && (
            <ActiveTag label={`"${filters.q}"`} isDark={isDark} tagBg={tagBg}
              onClear={() => { setSearchInput(""); onChange({ ...filters, q: "" }); }} />
          )}
          {filters.person && (
            <ActiveTag label={filters.person} isDark={isDark} tagBg={tagBg}
              onClear={() => set({ person: "" })} />
          )}
          {filters.event && (
            <ActiveTag label={filters.event} isDark={isDark} tagBg={tagBg}
              onClear={() => set({ event: "" })} />
          )}
          {filters.year && (
            <ActiveTag label={filters.year} isDark={isDark} tagBg={tagBg}
              onClear={() => set({ year: "" })} />
          )}
          {filters.dateFrom && (
            <ActiveTag label={`${tr.from} ${filters.dateFrom}`} isDark={isDark} tagBg={tagBg}
              onClear={() => set({ dateFrom: "" })} />
          )}
          {filters.dateTo && (
            <ActiveTag label={`${tr.to} ${filters.dateTo}`} isDark={isDark} tagBg={tagBg}
              onClear={() => set({ dateTo: "" })} />
          )}
          {filters.orientation && (
            <ActiveTag
              label={tr[`photo${filters.orientation.charAt(0).toUpperCase()}${filters.orientation.slice(1)}` as "photoLandscape" | "photoPortrait" | "photoSquare"]}
              isDark={isDark} tagBg={tagBg}
              onClear={() => set({ orientation: "" })} />
          )}
          {filters.agency && (
            <ActiveTag label={filters.agency} isDark={isDark} tagBg={tagBg}
              onClear={() => set({ agency: "" })} />
          )}
          <button onClick={clearAll}
            className={`text-[10px] ml-0.5 transition-colors ${subText} hover:${isDark ? "text-white" : "text-black"}`}>
            {tr.clearAll}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── DateRangePill ─────────────────────────────────────────── */
function DateRangePill({
  filters, years, yearMonths, hasDate, activePill, pillBase, pillActive, pillInactive,
  isDark, dropBg, subText, mainText, dateLabel,
  onToggle, onApply, onClear,
}: {
  filters: Filters;
  years: number[];
  yearMonths: string[];
  hasDate: boolean;
  activePill: ActivePill;
  pillBase: string;
  pillActive: string;
  pillInactive: string;
  isDark: boolean;
  dropBg: string;
  subText: string;
  mainText: string;
  dateLabel: string;
  onToggle: () => void;
  onApply: (patch: Partial<Filters>) => void;
  onClear: () => void;
}) {
  const [localFrom, setLocalFrom] = useState(filters.dateFrom || "");
  const [localTo,   setLocalTo]   = useState(filters.dateTo   || "");

  // 외부에서 필터가 초기화될 때 로컬 상태도 리셋
  useEffect(() => { setLocalFrom(filters.dateFrom || ""); }, [filters.dateFrom]);
  useEffect(() => { setLocalTo(filters.dateTo     || ""); }, [filters.dateTo]);

  const canApply = localFrom || localTo;

  return (
    <div className="relative shrink-0">
      <button
        onClick={onToggle}
        className={`${pillBase} ${(hasDate || activePill === "date") ? pillActive : pillInactive}`}>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="1" y="2.5" width="10" height="8.5" rx="1.5"/>
          <path d="M4 1v3M8 1v3M1 6.5h10"/>
        </svg>
        {dateLabel}
        {hasDate && <span className="ml-0.5">✕</span>}
      </button>

      {activePill === "date" && (
        <DropPanel isDark={isDark} dropBg={dropBg} className="w-60">
          <div className="p-3 flex flex-col gap-3">
            {/* Year chips — 즉시 적용 */}
            <div className="flex flex-wrap gap-1">
              {years.map((y) => (
                <button key={y}
                  onClick={() => onApply({ year: String(y), dateFrom: "", dateTo: "" })}
                  className={`px-2 py-0.5 text-[11px] rounded-full border transition-all ${
                    filters.year === String(y)
                      ? (isDark ? "bg-white text-black border-white" : "bg-black text-white border-black")
                      : (isDark ? "border-white/15 text-white/50 hover:border-white/35" : "border-black/15 text-black/50 hover:border-black/35")
                  }`}>
                  {y}
                </button>
              ))}
            </div>

            {/* From / To + Apply */}
            <div className={`flex flex-col gap-2 pt-2 border-t border-inherit`}>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-widest w-8 shrink-0 ${subText}`}>From</span>
                <select
                  value={localFrom}
                  onChange={(e) => setLocalFrom(e.target.value)}
                  style={{ background: isDark ? "#1a1a1a" : "#fff" }}
                  className={`flex-1 text-xs border rounded px-2 py-1 focus:outline-none
                              ${isDark ? "border-white/15 text-white" : "border-black/15 text-black"}`}>
                  <option value="">—</option>
                  {yearMonths.map((ym) => <option key={ym} value={ym}>{ym}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-widest w-8 shrink-0 ${subText}`}>To</span>
                <select
                  value={localTo}
                  onChange={(e) => setLocalTo(e.target.value)}
                  style={{ background: isDark ? "#1a1a1a" : "#fff" }}
                  className={`flex-1 text-xs border rounded px-2 py-1 focus:outline-none
                              ${isDark ? "border-white/15 text-white" : "border-black/15 text-black"}`}>
                  <option value="">—</option>
                  {yearMonths.map((ym) => <option key={ym} value={ym}>{ym}</option>)}
                </select>
              </div>
              {canApply && (
                <button
                  onClick={() => onApply({ dateFrom: localFrom, dateTo: localTo, year: "" })}
                  className={`w-full py-1.5 text-[11px] font-medium rounded transition-all
                    ${isDark ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/80"}`}>
                  Apply
                </button>
              )}
            </div>

            {hasDate && (
              <button onClick={onClear}
                className={`text-[11px] text-left ${subText} hover:${mainText} transition-colors`}>
                ✕ Clear date
              </button>
            )}
          </div>
        </DropPanel>
      )}
    </div>
  );
}

/* ─── DropPanel ─────────────────────────────────────────────── */
function DropPanel({
  children, isDark: _, dropBg, className = "",
}: {
  children: React.ReactNode;
  isDark: boolean;
  dropBg: string;
  className?: string;
}) {
  return (
    <div className={`absolute top-full mt-1.5 left-0 z-50 border rounded-lg shadow-2xl ${dropBg} ${className}`}>
      {children}
    </div>
  );
}

/* ─── ActiveTag ─────────────────────────────────────────────── */
function ActiveTag({
  label, tagBg, onClear,
}: {
  label: string; isDark: boolean; tagBg: string; onClear: () => void;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tagBg}`}>
      <span className="max-w-[12rem] truncate">{label}</span>
      <button onClick={onClear} className="opacity-50 hover:opacity-100 transition-opacity leading-none shrink-0">✕</button>
    </span>
  );
}

/* ─── OrientIcon ────────────────────────────────────────────── */
function OrientIcon({ o, size = 10 }: { o: string; size?: number }) {
  const s = size;
  if (o === "landscape") return (
    <svg width={s} height={s * 0.7} viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="14" height="9" rx="1.5"/>
    </svg>
  );
  if (o === "portrait") return (
    <svg width={s * 0.7} height={s} viewBox="0 0 11 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="9" height="14" rx="1.5"/>
    </svg>
  );
  if (o === "square") return (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="12" height="12" rx="1.5"/>
    </svg>
  );
  // All / unset
  return (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="10" height="10" rx="1.5"/>
      <path d="M1 4.5h10M4.5 1v10"/>
    </svg>
  );
}
