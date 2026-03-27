"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang, TRANSLATIONS } from "@/lib/i18n";
import { useCredits } from "@/lib/credits";
import { THEMES, ThemeKey } from "@/lib/themes";
import { encodePhotoKey } from "@/lib/photoKey";
import PurchaseModal from "@/components/PurchaseModal";
import type { PhotoMeta } from "@/app/photo/[id]/page";

/* ─── TENASIA 워터마크 ──────────────────────────────────────── */
const WM_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="150">` +
  `<text x="180" y="75" text-anchor="middle" dominant-baseline="middle" ` +
  `transform="rotate(-28 180 75)" fill="rgba(255,255,255,0.20)" ` +
  `font-size="26" font-family="Arial Black,Arial,sans-serif" font-weight="900" ` +
  `letter-spacing="14">TENASIA</text></svg>`
);
const wmStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,${WM_SVG}")`,
  backgroundRepeat: "repeat",
};

/* ─── 파일 크기 포맷 ──────────────────────────────────────── */
function fmtSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

interface Props {
  data:    PhotoMeta;
  related: PhotoMeta[];
  prevId:  string | null;
  nextId:  string | null;
}

type License = "editorial" | "commercial" | "extended";

export default function PhotoDetailClient({ data, related, prevId, nextId }: Props) {
  const { lang }            = useLang();
  const tr                  = TRANSLATIONS[lang];
  const router              = useRouter();
  const { data: session }   = useSession();
  const { balance, loading: credLoading, refresh, spendAndGetToken } = useCredits();

  /* ── theme ─────────────────────────────────────────────── */
  const [theme, setTheme] = useState<ThemeKey>("black");
  useEffect(() => {
    const stored = (typeof window !== "undefined" ? localStorage.getItem("tg-theme") : null) as ThemeKey | null;
    if (stored && stored in THEMES) setTheme(stored);
  }, []);
  const th = THEMES[theme];
  const isDark = theme === "black" || theme === "charcoal";

  /* ── license selection ─────────────────────────────────── */
  const [license, setLicense] = useState<License>("editorial");
  const creditsNeeded = license === "editorial" ? 1 : license === "commercial" ? 3 : 0;

  /* ── download state ────────────────────────────────────── */
  const [downloading,  setDownloading]  = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [imgLoaded,    setImgLoaded]    = useState(false);

  /* ── keyboard nav ──────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s","S","u","U"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft"  && prevId) router.push(`/photo/${prevId}`);
      if (e.key === "ArrowRight" && nextId) router.push(`/photo/${nextId}`);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevId, nextId, router]);

  /* ── download handler ──────────────────────────────────── */
  const handleDownload = useCallback(async () => {
    if (license === "extended") {
      window.location.href = "mailto:tenasia.trend@gmail.com?subject=Extended%20License%20Inquiry";
      return;
    }
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }
    if (balance < creditsNeeded) {
      setShowPurchase(true);
      return;
    }
    setDownloading(true);
    try {
      const photoName = data.key.split("/").pop() ?? undefined;
      const token = await spendAndGetToken(
        data.key, data.url, photoName, license, creditsNeeded
      );
      if (!token) { setShowPurchase(true); return; }

      const res = await fetch(
        `/api/download?url=${encodeURIComponent(data.url)}&token=${token}`
      );
      if (!res.ok) {
        console.error("Download failed:", res.status, await res.text().catch(() => ""));
        alert(`다운로드 실패 (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href     = objectUrl;
      a.download = photoName ?? "tenasia-photo.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      refresh();
    } finally {
      setDownloading(false);
    }
  }, [license, session, balance, creditsNeeded, data, spendAndGetToken, refresh, router]);

  /* ── orientation label ─────────────────────────────────── */
  const orientLabel =
    data.orientation === "landscape" ? tr.photoLandscape :
    data.orientation === "portrait"  ? tr.photoPortrait  : tr.photoSquare;

  /* ── metadata rows ─────────────────────────────────────── */
  const metaRows: [string, string | null][] = [
    [tr.photoArtist,      data.person],
    [tr.photoEvent,       data.event],
    [tr.photoDate,        data.date ? data.date.slice(0, 10) : null],
    [tr.photoResolution,  data.resolution.width && data.resolution.height
      ? `${data.resolution.width} × ${data.resolution.height}` : null],
    [tr.photoFileSize,    data.fileSize ? fmtSize(data.fileSize) : null],
    [tr.photoOrientation, orientLabel],
    [tr.photoPhotoId,     data.photoId],
  ];

  const borderFaint = isDark ? "border-white/10" : "border-black/8";
  const subText     = isDark ? "text-white/35"   : "text-black/35";
  const cardBg      = isDark ? "bg-white/[0.04]" : "bg-black/[0.03]";

  /* ── button text ────────────────────────────────────────── */
  function btnLabel() {
    if (license === "extended")  return tr.photoContactSales;
    if (!session?.user)          return tr.photoSignInToDownload;
    if (credLoading)             return "...";
    if (balance < creditsNeeded) return tr.photoBuyCredits;
    if (downloading)             return "...";
    return `${tr.photoDownload} (${creditsNeeded} cr)`;
  }

  function btnDisabled() {
    return downloading || credLoading;
  }

  return (
    <div className={`min-h-screen ${th.bg} ${th.text}`}>

      {/* ── 상단 네비 바 ──────────────────────────────────── */}
      <div className={`sticky top-0 z-30 border-b ${borderFaint} ${isDark ? "bg-black/70" : "bg-white/70"} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          {/* 뒤로 */}
          <Link href="/" className={`flex items-center gap-1.5 text-xs ${subText} hover:${th.text} transition-colors`}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11L5 7l4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Gallery
          </Link>

          {/* 이전 / 다음 */}
          <div className="flex items-center gap-4">
            {prevId ? (
              <Link href={`/photo/${prevId}`}
                className={`flex items-center gap-1 text-xs ${subText} hover:${th.text} transition-colors`}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 11L5 7l4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Prev
              </Link>
            ) : <span className="w-14" />}
            {nextId ? (
              <Link href={`/photo/${nextId}`}
                className={`flex items-center gap-1 text-xs ${subText} hover:${th.text} transition-colors`}>
                Next
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 11l4-4-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ) : <span className="w-14" />}
          </div>
        </div>
      </div>

      {/* ── 2단 메인 레이아웃 ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* ── 좌측: 이미지 (60%) ─────────────────────── */}
          <div className="w-full lg:w-[60%]">
            <div
              className="relative photo-shield overflow-hidden rounded-sm"
              onContextMenu={(e) => e.preventDefault()}
              style={{ background: isDark ? "#1a1a1a" : "#e8e8e6" }}
            >
              {/* 로딩 스피너 */}
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ minHeight: 400 }}>
                  <div className={`w-5 h-5 border rounded-full animate-spin
                    ${isDark ? "border-white/15 border-t-white/50" : "border-black/15 border-t-black/50"}`} />
                </div>
              )}

              {/* 메인 이미지 */}
              <Image
                src={`/api/image?path=${encodeURIComponent(data.key)}&w=1600`}
                alt={data.person ?? "photo"}
                width={data.resolution.width  || 1200}
                height={data.resolution.height || 800}
                className={`w-full h-auto object-contain select-none pointer-events-none
                            transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                priority
                draggable={false}
                onLoad={() => setImgLoaded(true)}
                unoptimized
              />

              {/* 워터마크 */}
              <div className="absolute inset-0 pointer-events-none select-none" style={wmStyle} />

              {/* 우클릭/드래그 차단 레이어 */}
              <div className="absolute inset-0 z-10"
                   onContextMenu={(e) => e.preventDefault()}
                   onDragStart={(e) => e.preventDefault()} />

              {/* 이전/다음 오버레이 화살표 */}
              {prevId && (
                <Link href={`/photo/${prevId}`}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20
                             w-10 h-10 flex items-center justify-center
                             rounded-full bg-black/30 hover:bg-black/50
                             text-white/70 hover:text-white
                             transition-all duration-150 backdrop-blur-sm">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11 14l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
              {nextId && (
                <Link href={`/photo/${nextId}`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20
                             w-10 h-10 flex items-center justify-center
                             rounded-full bg-black/30 hover:bg-black/50
                             text-white/70 hover:text-white
                             transition-all duration-150 backdrop-blur-sm">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M7 14l5-5-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
            </div>

            {/* 크레딧 표기 */}
            {license === "editorial" && (
              <p className={`mt-2 text-[11px] ${subText}`}>
                {tr.photoCreditRequired}
              </p>
            )}
          </div>

          {/* ── 우측: 메타 + 액션 (40%) ─────────────────── */}
          <div className="w-full lg:w-[40%] flex flex-col gap-6">

            {/* 아티스트 + 행사 */}
            <div>
              {data.person && (
                <h1 className={`text-2xl font-light tracking-wide ${th.text}`}>{data.person}</h1>
              )}
              {data.event && (
                <p className={`text-sm mt-1 ${subText}`}>{data.event}</p>
              )}
              {data.date && (
                <p className={`text-xs mt-0.5 ${subText} tabular-nums`}>{data.date.slice(0, 10)}</p>
              )}
            </div>

            {/* 메타데이터 2열 그리드 */}
            <div className={`rounded-sm border ${borderFaint} ${cardBg} p-4`}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {metaRows.filter(([, v]) => v).map(([label, value]) => (
                  <div key={label}>
                    <p className={`text-[10px] uppercase tracking-widest ${subText} mb-0.5`}>{label}</p>
                    <p className={`text-xs font-medium ${th.text} break-all`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 라이선스 선택 */}
            <div>
              <p className={`text-[11px] uppercase tracking-widest ${subText} mb-3`}>{tr.photoSelectLicense}</p>
              <div className="flex flex-col gap-2">

                {/* Editorial */}
                <label className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-all
                  ${license === "editorial"
                    ? (isDark ? "border-white/40 bg-white/[0.06]" : "border-black/30 bg-black/[0.05]")
                    : `${borderFaint} ${cardBg}`}`}>
                  <input type="radio" name="license" value="editorial"
                    checked={license === "editorial"}
                    onChange={() => setLicense("editorial")}
                    className="mt-0.5 accent-current" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${th.text}`}>{tr.photoEditorial}</span>
                      <span className={`text-xs ${subText}`}>1 cr</span>
                    </div>
                    <p className={`text-[11px] ${subText} mt-0.5`}>{tr.photoEditorialDesc}</p>
                  </div>
                </label>

                {/* Commercial */}
                <label className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-all
                  ${license === "commercial"
                    ? (isDark ? "border-white/40 bg-white/[0.06]" : "border-black/30 bg-black/[0.05]")
                    : `${borderFaint} ${cardBg}`}`}>
                  <input type="radio" name="license" value="commercial"
                    checked={license === "commercial"}
                    onChange={() => setLicense("commercial")}
                    className="mt-0.5 accent-current" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${th.text}`}>{tr.photoCommercial}</span>
                      <span className={`text-xs ${subText}`}>3 cr</span>
                    </div>
                    <p className={`text-[11px] ${subText} mt-0.5`}>{tr.photoCommercialDesc}</p>
                  </div>
                </label>

                {/* Extended */}
                <label className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-all
                  ${license === "extended"
                    ? (isDark ? "border-white/40 bg-white/[0.06]" : "border-black/30 bg-black/[0.05]")
                    : `${borderFaint} ${cardBg}`}`}>
                  <input type="radio" name="license" value="extended"
                    checked={license === "extended"}
                    onChange={() => setLicense("extended")}
                    className="mt-0.5 accent-current" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${th.text}`}>{tr.photoExtended}</span>
                      <span className={`text-xs ${subText}`}>—</span>
                    </div>
                    <p className={`text-[11px] ${subText} mt-0.5`}>{tr.photoExtendedDesc}</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 잔액 표시 (로그인 시) */}
            {session?.user && !credLoading && (
              <p className={`text-[11px] ${subText}`}>
                {balance} cr remaining
              </p>
            )}

            {/* 다운로드 버튼 */}
            <button
              onClick={handleDownload}
              disabled={btnDisabled()}
              className={`w-full py-3 rounded-sm text-sm font-medium tracking-wide
                         transition-all duration-150
                         ${btnDisabled() ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                         ${isDark
                           ? "bg-white text-black hover:bg-white/90 disabled:hover:bg-white"
                           : "bg-black text-white hover:bg-black/80 disabled:hover:bg-black"}`}
            >
              {btnLabel()}
            </button>
          </div>
        </div>

        {/* ── 관련 사진 ────────────────────────────────── */}
        {related.length > 0 && (
          <div className={`mt-16 pt-10 border-t ${borderFaint}`}>
            <h2 className={`text-sm uppercase tracking-widest ${subText} mb-6`}>
              {data.event ? tr.photoMoreFromEvent : `${tr.photoMoreOf} ${data.person ?? ""}`}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {related.map((r) => (
                <Link key={r.id} href={`/photo/${r.id}`}
                  className={`group relative overflow-hidden photo-shield
                             aspect-[3/4] ${isDark ? "bg-white/4" : "bg-black/5"} rounded-sm`}
                  onContextMenu={(e) => e.preventDefault()}>
                  <Image
                    src={`/api/image?path=${encodeURIComponent(r.key)}`}
                    alt={r.person ?? "photo"}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]
                               select-none pointer-events-none"
                    draggable={false}
                    unoptimized
                  />
                  {/* 워터마크 */}
                  <div className="absolute inset-0 pointer-events-none select-none" style={wmStyle} />
                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                  flex items-end p-2.5 pointer-events-none">
                    {r.person && <p className="text-white text-xs font-medium leading-snug select-none">{r.person}</p>}
                  </div>
                  {/* 우클릭 차단 */}
                  <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {showPurchase && <PurchaseModal onClose={() => setShowPurchase(false)} />}
    </div>
  );
}
