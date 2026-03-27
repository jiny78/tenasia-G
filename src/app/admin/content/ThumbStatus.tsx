"use client";

import { useState, useEffect, useCallback } from "react";

interface Status {
  photos: number;
  thumbs: number;
  missing: number;
}

export default function ThumbStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/thumb-status");
      if (r.ok) setStatus(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const triggerCron = async () => {
    setTriggering(true);
    setLastResult(null);
    try {
      const r = await fetch("/api/cron/generate-thumbs");
      const data = await r.json();
      setLastResult(`처리: ${data.processed}장 / 남은: ${data.remaining}장 / 오류: ${data.errors}장`);
      await fetchStatus();
    } catch {
      setLastResult("요청 실패");
    } finally {
      setTriggering(false);
    }
  };

  const pct = status ? Math.round((status.thumbs / Math.max(status.photos, 1)) * 100) : 0;

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-zinc-400">썸네일 생성 현황</h2>
        <button
          onClick={triggerCron}
          disabled={triggering || loading}
          className="text-xs px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
        >
          {triggering ? "처리 중…" : "지금 실행"}
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-zinc-600">불러오는 중…</p>
      ) : status ? (
        <div className="space-y-3">
          <div className="flex gap-4 text-xs">
            <span className="text-zinc-400">원본 <span className="text-white font-medium">{status.photos.toLocaleString()}장</span></span>
            <span className="text-zinc-400">썸네일 <span className="text-green-400 font-medium">{status.thumbs.toLocaleString()}장</span></span>
            {status.missing > 0 && (
              <span className="text-zinc-400">미생성 <span className="text-yellow-400 font-medium">{status.missing.toLocaleString()}장</span></span>
            )}
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-600">{pct}% 완료</p>
        </div>
      ) : (
        <p className="text-xs text-red-400">상태 조회 실패</p>
      )}

      {lastResult && (
        <p className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800">{lastResult}</p>
      )}
    </div>
  );
}
