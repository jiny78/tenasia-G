"use client";

import { useState } from "react";

const TYPES = [
  { value: "users", label: "사용자" },
  { value: "purchases", label: "구매 이력" },
  { value: "downloads", label: "다운로드 이력" },
  { value: "pageviews", label: "페이지뷰" },
  { value: "activity", label: "활동 로그" },
];

const PERIODS = [
  { value: "all", label: "전체" },
  { value: "month", label: "이번 달" },
  { value: "prev", label: "지난 달" },
  { value: "custom", label: "직접 입력" },
];

export default function ExportPage() {
  const [type, setType] = useState("users");
  const [period, setPeriod] = useState("month");
  const [format, setFormat] = useState("csv");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setDownloading(true);
    setError(null);

    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const monthEnd = now.toISOString().slice(0, 10);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

      const payload: Record<string, string> = { type, format };
      if (period === "month") {
        payload.from = monthStart;
        payload.to = monthEnd;
      }
      if (period === "prev") {
        payload.from = prevStart;
        payload.to = prevEnd;
      }
      if (period === "custom") {
        if (from) payload.from = from;
        if (to) payload.to = to;
      }

      const res = await fetch("/api/admin/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Export failed");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `export.${format}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed");
    } finally {
      setDownloading(false);
    }
  }

  const label = (arr: { value: string; label: string }[], value: string) =>
    arr.find((item) => item.value === value)?.label ?? value;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">데이터 내보내기</h1>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
        <div>
          <label className="text-xs text-zinc-500 block mb-2">데이터 유형</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((entry) => (
              <button
                key={entry.value}
                onClick={() => setType(entry.value)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  type === entry.value ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-2">기간</label>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((entry) => (
              <button
                key={entry.value}
                onClick={() => setPeriod(entry.value)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  period === entry.value ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex gap-2 mt-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none"
              />
              <span className="text-zinc-500 self-center">~</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none"
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-2">파일 형식</label>
          <div className="flex gap-2">
            {[["csv", "CSV"], ["json", "JSON"]].map(([value, text]) => (
              <button
                key={value}
                onClick={() => setFormat(value)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  format === value ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={download}
          disabled={downloading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm font-medium transition-colors"
        >
          {downloading
            ? "내보내는 중..."
            : `${label(TYPES, type)} 내보내기 (${label(PERIODS, period)}, ${format.toUpperCase()})`}
        </button>
      </div>
    </div>
  );
}
