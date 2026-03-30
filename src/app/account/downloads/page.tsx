"use client";

import { useState, useEffect } from "react";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

interface DownloadRecord {
  id: string;
  photoId: string;
  photoName: string | null;
  licenseType: string;
  resolution: string;
  creditsUsed: number;
  expiresAt: string;
  createdAt: string;
  expired: boolean;
}

export default function DownloadsPage() {
  const { lang } = useLang();
  const tr = TRANSLATIONS[lang];

  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [license, setLicense] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState<string | null>(null);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (license) params.set("license", license);

    fetch(`/api/account/downloads?${params}`)
      .then((response) => response.json())
      .then((data) => {
        setDownloads(data.downloads ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, license]);

  async function handleRedownload(download: DownloadRecord) {
    if (download.expired) return;
    setReloading(download.id);

    try {
      const res = await fetch("/api/account/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: download.photoId,
          photoName: download.photoName,
          licenseType: download.licenseType,
          resolution: download.resolution,
        }),
      });
      const data = await res.json();
      if (!data.token) {
        return;
      }

      const redirect = await fetch(
        `/api/download?url=${encodeURIComponent(download.photoId)}&token=${encodeURIComponent(data.token)}`,
      );
      const redirectData = await redirect.json();
      if (redirectData.url) {
        window.location.href = redirectData.url;
      }
    } finally {
      setReloading(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-semibold">{tr.accountDownloads}</h1>
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
            {downloads.map((download) => (
              <div
                key={download.id}
                className="flex items-center gap-4 bg-white/[0.02] border border-white/6 rounded-xl px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">
                    {download.photoName ?? download.photoId.split("/").pop() ?? "Photo"}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-white/30 text-xs">
                      {new Date(download.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-white/20 text-xs">{download.licenseType}</span>
                    <span className="text-white/20 text-xs">{download.resolution}</span>
                  </div>
                </div>

                {download.expired ? (
                  <span className="text-white/20 text-xs px-2 py-0.5 rounded-full border border-white/8">
                    {tr.accountExpired}
                  </span>
                ) : (
                  <button
                    onClick={() => handleRedownload(download)}
                    disabled={reloading === download.id}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-white/15
                               text-white/60 hover:text-white hover:border-white/30
                               disabled:opacity-40 transition-colors"
                  >
                    {reloading === download.id ? "..." : tr.accountRedownload}
                  </button>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded-lg border border-white/10 text-white/50
                             hover:text-white hover:border-white/30 text-sm transition-colors"
                >
                  Prev
                </button>
              )}
              <span className="text-white/30 text-sm tabular-nums">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded-lg border border-white/10 text-white/50
                             hover:text-white hover:border-white/30 text-sm transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
