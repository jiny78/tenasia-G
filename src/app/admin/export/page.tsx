"use client";

import { useState } from "react";

const TYPES = [
  { value: "users",     label: "사용자" },
  { value: "purchases", label: "구매 이력" },
  { value: "downloads", label: "다운로드 이력" },
  { value: "pageviews", label: "페이지뷰" },
  { value: "activity",  label: "활동 로그" },
];

const PERIODS = [
  { value: "all",   label: "전체" },
  { value: "month", label: "이달" },
  { value: "prev",  label: "지난달" },
  { value: "custom",label: "직접 입력" },
];

export default function ExportPage() {
  const [type,   setType]   = useState("users");
  const [period, setPeriod] = useState("month");
  const [format, setFormat] = useState("csv");
  const [from,   setFrom]   = useState("");
  const [to,     setTo]     = useState("");

  const download = () => {
    const now   = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const mEnd   = now.toISOString().slice(0, 10);
    const pStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const pEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

    const params = new URLSearchParams({ type, format });
    if (period === "month")  { params.set("from", mStart); params.set("to", mEnd); }
    if (period === "prev")   { params.set("from", pStart); params.set("to", pEnd); }
    if (period === "custom") { if (from) params.set("from", from); if (to) params.set("to", to); }

    window.location.href = `/api/admin/export?${params}`;
  };

  const label = (arr: { value: string; label: string }[], v: string) =>
    arr.find((x) => x.value === v)?.label ?? v;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">데이터 내보내기</h1>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
        {/* 유형 */}
        <div>
          <label className="text-xs text-zinc-500 block mb-2">데이터 유형</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${type === t.value ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 기간 */}
        <div>
          <label className="text-xs text-zinc-500 block mb-2">기간</label>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${period === p.value ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                {p.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex gap-2 mt-2">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none" />
              <span className="text-zinc-500 self-center">—</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none" />
            </div>
          )}
        </div>

        {/* 형식 */}
        <div>
          <label className="text-xs text-zinc-500 block mb-2">파일 형식</label>
          <div className="flex gap-2">
            {[["csv","CSV"],["json","JSON"]].map(([v, l]) => (
              <button key={v} onClick={() => setFormat(v)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${format === v ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* 다운로드 버튼 */}
        <button onClick={download}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors">
          {label(TYPES, type)} 내보내기 ({label(PERIODS, period)}, {format.toUpperCase()})
        </button>
      </div>
    </div>
  );
}
