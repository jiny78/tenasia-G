"use client";

import { useState, useEffect } from "react";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

interface DownloadRecord {
  id:          string;
  photoId:     string;
  photoName:   string | null;
  licenseType: string;
  creditsUsed: number;
  expiresAt:   string;
  createdAt:   string;
  expired:     boolean;
}

export default function DownloadsPage() {
  const { lang } = useLang();
  const tr       = TRANSLATIONS[lang];

  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [license,   setLicense]   = useState("");
  const [loading,   setLoading]   = useState(true);
  const [reloading, setReloading] = useState<string | null>(null);

  const limit      = 20;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (license) params.set("license", license);
    fetch(`/api/account/downloads?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setDownloads(d.downloads ?? []);
        setTotal(d.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, license]);

  async function handleRedownload(dl: DownloadRecord) {
    if (dl.expired) return;
    setReloading(dl.id);
    try {
      // 90일 이내 재다운로드는 크레딧 차감 없음
      const res  = await fetch("/api/account/downloads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ photoId: dl.photoId, photoUrl: `${process.env.NEXT_PUBLIC_URL ?? ""}` }),
      });
      const data = await res.json();
      if (data.token) {
        // 재다운로드: 원래 R2 URL 복원은 photoId가 full key이므로 직접 구성
        const r2Base  = ""; // 클라이언트에서는 서버 환경변수 불가 — /api/download로 프록시
        const photoUrl = `${r2Base}/${dl.photoId}`;
        const a       = document.createElement("a");
        a.href     = `/api/download?url=${encodeURIComponent(photoUrl)}&token=${data.token}`;
        a.download = dl.photoName ?? dl.photoId.split("/").pop() ?? "photo.jpg";
        a.click();
      }
    } finally {
      setReloading(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-semibold">{tr.accountDownloads}</h1>
        {/* 라이선스 필터 */}
        <select
          value={license}
          onChange={(e) => { setLicense(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/60
                     text-xs focus:outline-none focus:border-white/30"
        >
          <option value="">{tr.accountAllLicenses}</option>
          <option value="editorial">{tr.accountEditorial}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border border-white/15 border-t-white/50 rounded-full animate-spin" />
        </div>
      ) : downloads.length === 0 ? (
        <p className="text-white/20 text-sm py-12 text-center">{tr.accountNoDownloads}</p>
      ) : (
        <>
          <div className="space-y-2">
            {downloads.map((d) => (
              <div key={d.id}
                className="flex items-center gap-4 bg-white/[0.02] border border-white/6
                           rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">
                    {d.photoName ?? d.photoId.split("/").pop() ?? "Photo"}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-white/30 text-xs">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-white/20 text-xs">{d.licenseType}</span>
                  </div>
                </div>

                {d.expired ? (
                  <span className="text-white/20 text-xs px-2 py-0.5 rounded-full border border-white/8">
                    {tr.accountExpired}
                  </span>
                ) : (
                  <button
                    onClick={() => handleRedownload(d)}
                    disabled={reloading === d.id}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-white/15
                               text-white/60 hover:text-white hover:border-white/30
                               disabled:opacity-40 transition-colors"
                  >
                    {reloading === d.id ? "…" : tr.accountRedownload}
                  </button>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <button onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded-lg border border-white/10 text-white/50
                             hover:text-white hover:border-white/30 text-sm transition-colors">
                  ← Prev
                </button>
              )}
              <span className="text-white/30 text-sm tabular-nums">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <button onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded-lg border border-white/10 text-white/50
                             hover:text-white hover:border-white/30 text-sm transition-colors">
                  Next →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
