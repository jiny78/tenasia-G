"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { Photo } from "@/types";
import Lightbox from "@/components/Lightbox";
import PurchaseModal from "@/components/PurchaseModal";
import { ThemeKey } from "@/app/page";
import { useLang, TRANSLATIONS } from "@/lib/i18n";
import { useCredits } from "@/lib/credits";

interface Props {
  photos: Photo[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  theme: ThemeKey;
  onCreditsChange?: () => void;
}

interface Section {
  key: string;
  title: string;
  date: string;
  photos: Photo[];
}

/* ─── TENASIA 워터마크 ───────────────────────────────────────── */
const WM_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="140">` +
  `<text x="160" y="70" text-anchor="middle" dominant-baseline="middle" ` +
  `transform="rotate(-28 160 70)" fill="rgba(255,255,255,0.22)" ` +
  `font-size="24" font-family="Arial Black,Arial,sans-serif" font-weight="900" ` +
  `letter-spacing="12">TENASIA</text></svg>`
);
const wmStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,${WM_SVG}")`,
  backgroundRepeat: "repeat",
};

const noCtx = (e: React.MouseEvent) => e.preventDefault();

/* ─── 섹션 빌드 ──────────────────────────────────────────────── */
function buildSections(photos: Photo[]): Section[] {
  const map = new Map<string, Photo[]>();
  for (const p of photos) {
    const k = `${p.role ?? ""}||${p.date?.slice(0, 7) ?? ""}`;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(p);
  }
  return [...map.entries()].map(([k, ps]) => {
    const [role, ym] = k.split("||");
    const [y, m] = (ym ?? "").split("-");
    const dateLabel = y && m ? `${y}.${m.padStart(2, "0")}` : y ?? "";
    return { key: k, title: role || "Gallery", date: dateLabel, photos: ps };
  });
}

export default function PhotoGrid({ photos, loading, hasMore, onLoadMore, theme, onCreditsChange }: Props) {
  const { lang } = useLang();
  const tr = TRANSLATIONS[lang];
  const sentinel = useRef<HTMLDivElement>(null);
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const isDark = theme === "black" || theme === "charcoal";
  const { balance, spendAndGetToken } = useCredits();

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && hasMore && !loading) onLoadMore(); },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, onLoadMore]);

  const sections = useMemo(() => buildSections(photos), [photos]);
  const sectionOffsets = useMemo(() => {
    const offsets: number[] = [];
    let offset = 0;
    for (const sec of sections) { offsets.push(offset); offset += sec.photos.length; }
    return offsets;
  }, [sections]);

  const handleDownload = useCallback(async (photo: Photo) => {
    if (balance <= 0) {
      setShowPurchase(true);
      return;
    }
    const photoName = photo.id.split("/").pop() ?? undefined;
    const token = await spendAndGetToken(photo.id, photo.url, photoName);
    if (!token) {
      setShowPurchase(true);
      return;
    }
    const res = await fetch(
      `/api/download?url=${encodeURIComponent(photo.url)}&token=${token}`
    );
    if (!res.ok) {
      const msg = await res.text().catch(() => String(res.status));
      alert(`다운로드 실패: ${res.status} — ${msg}`);
      return;
    }
    const { url: downloadUrl } = await res.json();
    window.location.href = downloadUrl;
    onCreditsChange?.();
  }, [balance, spendAndGetToken, onCreditsChange]);

  if (!loading && photos.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-40 gap-3 select-none ${isDark ? "text-white/15" : "text-black/15"}`}>
        <span className="text-5xl font-thin">◻</span>
        <span className="text-xs tracking-[0.4em] uppercase">{tr.noPhotos}</span>
      </div>
    );
  }

  return (
    <>
      <div>
        {sections.map((sec, si) => (
          <PhotoSection
            key={sec.key}
            section={sec}
            offset={sectionOffsets[si]}
            isDark={isDark}
            onOpen={(i) => setLbIndex(i)}
            onDownload={handleDownload}
          />
        ))}
        {lbIndex !== null && (
          <Lightbox
            photos={photos}
            index={lbIndex}
            onClose={() => setLbIndex(null)}
            onNav={setLbIndex}
            onDownload={handleDownload}
          />
        )}
        <div ref={sentinel} className="h-2" />
        {loading && (
          <div className="flex justify-center py-16">
            <div className={`w-4 h-4 border rounded-full animate-spin ${isDark ? "border-white/15 border-t-white/50" : "border-black/15 border-t-black/50"}`} />
          </div>
        )}
      </div>

      {showPurchase && <PurchaseModal onClose={() => setShowPurchase(false)} />}
    </>
  );
}

/* ─── 섹션 ───────────────────────────────────────────────────── */
function PhotoSection({
  section, offset, isDark, onOpen, onDownload,
}: {
  section: Section;
  offset: number;
  isDark: boolean;
  onOpen: (globalIndex: number) => void;
  onDownload: (photo: Photo) => void;
}) {
  const { lang } = useLang();
  const tr = TRANSLATIONS[lang];
  const { title, date, photos } = section;
  const open = (i: number) => onOpen(offset + i);
  const borderCls = isDark ? "border-white/8"  : "border-black/8";
  const titleCls  = isDark ? "text-white/85"    : "text-black/80";
  const dateCls   = isDark ? "text-white/30"    : "text-black/40";
  const countCls  = isDark ? "text-white/18"    : "text-black/25";

  return (
    <div className="mb-20">
      <div className={`flex items-end justify-between mb-5 pb-3 border-b ${borderCls}`}>
        <h2 className={`text-xl font-light tracking-wide leading-none ${titleCls}`}>{title}</h2>
        <div className="text-right">
          <p className={`text-xs tabular-nums ${dateCls}`}>{date}</p>
          <p className={`text-[10px] mt-0.5 ${countCls}`}>{tr.photosCount(photos.length)}</p>
        </div>
      </div>
      <BookLayout photos={photos} isDark={isDark} onOpen={open} onDownload={onDownload} sectionOffset={offset} />
    </div>
  );
}

/* ─── 포토북 그리드 ──────────────────────────────────────────── */
function BookLayout({ photos, isDark, onOpen, onDownload, sectionOffset }: {
  photos: Photo[];
  isDark: boolean;
  onOpen: (i: number) => void;
  onDownload: (photo: Photo) => void;
  sectionOffset: number;
}) {
  const n = photos.length;
  const card = (p: Photo, i: number, aspect?: string) => (
    <PhotoCard key={p.id} photo={p} aspect={aspect} isDark={isDark}
      onClick={() => onOpen(i)} onDownload={() => onDownload(p)}
      priority={sectionOffset + i < 8} />
  );

  if (n === 1) return <div className="max-w-2xl mx-auto">{card(photos[0], 0, "aspect-[4/3]")}</div>;

  if (n === 2) return (
    <div className="grid grid-cols-2 gap-1.5">
      {photos.map((p, i) => card(p, i, "aspect-[3/4]"))}
    </div>
  );

  if (n === 3) return (
    <div className="grid grid-cols-2 gap-1.5">
      <PhotoCard photo={photos[0]} aspect="aspect-[3/4]" className="row-span-2"
        isDark={isDark} onClick={() => onOpen(0)} onDownload={() => onDownload(photos[0])}
        priority={sectionOffset < 8} />
      {photos.slice(1).map((p, i) => card(p, i + 1, "aspect-[3/4]"))}
    </div>
  );

  if (n <= 8) {
    const rest = photos.slice(1);
    const rightCols = Math.min(2, Math.ceil(rest.length / 2));
    return (
      <div className="flex gap-1.5">
        <div className="w-[45%] shrink-0">
          <PhotoCard photo={photos[0]} aspect="aspect-[2/3]" isDark={isDark}
            onClick={() => onOpen(0)} onDownload={() => onDownload(photos[0])}
            priority={sectionOffset < 8} />
        </div>
        <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${rightCols}, 1fr)` }}>
          {rest.map((p, i) => card(p, i + 1, "aspect-[3/4]"))}
        </div>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-1.5">
      {photos.map((p, i) => (
        <div key={p.id} className="break-inside-avoid mb-1.5">
          <PhotoCard photo={p} isDark={isDark} onClick={() => onOpen(i)} onDownload={() => onDownload(p)} />
        </div>
      ))}
    </div>
  );
}

/* ─── 썸네일 URL 생성 ────────────────────────────────────────── */
function thumbUrl(photo: Photo, w: number): string {
  return `/api/image?path=${encodeURIComponent(photo.id)}&w=${w}`;
}

/* ─── 카드 ───────────────────────────────────────────────────── */
function PhotoCard({
  photo, aspect, className = "", isDark, onClick, onDownload, priority = false,
}: {
  photo: Photo;
  aspect?: string;
  className?: string;
  isDark: boolean;
  onClick?: () => void;
  onDownload: () => void;
  priority?: boolean;
}) {
  const { lang } = useLang();
  const tr = TRANSLATIONS[lang];
  const bgCls = isDark ? "bg-white/4" : "bg-black/5";
  return (
    <div
      className={`photo-shield group relative overflow-hidden ${bgCls} ${aspect ?? ""} ${className}`}
      onContextMenu={noCtx}
    >
      {/* 이미지 — 그리드 썸네일 480px */}
      <Image
        src={thumbUrl(photo, 480)}
        alt={photo.person ?? "photo"}
        fill={!!aspect}
        width={aspect ? undefined : 480}
        height={aspect ? undefined : 640}
        sizes={aspect
          ? "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          : "(max-width: 640px) 50vw, 25vw"
        }
        className={`object-cover transition-transform duration-500 group-hover:scale-[1.04]
                    select-none pointer-events-none ${aspect ? "" : "w-full"}`}
        draggable={false}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        unoptimized
      />

      {/* TENASIA 워터마크 */}
      <div className="absolute inset-0 pointer-events-none select-none" style={wmStyle} />

      {/* hover: 정보 + 다운로드 버튼 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      flex items-end justify-between p-3 pointer-events-none">
        <div className="select-none">
          {photo.person && <p className="text-white text-xs font-medium leading-snug">{photo.person}</p>}
          {photo.date && <p className="text-white/40 text-[10px] mt-0.5">{photo.date.slice(0, 10)}</p>}
        </div>
        {/* 다운로드 버튼 — pointer-events-auto로 클릭 활성화 */}
        <button
          className="pointer-events-auto w-8 h-8 rounded-full bg-white/15 hover:bg-white/30
                     backdrop-blur-sm flex items-center justify-center transition-all duration-150
                     border border-white/20"
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          onContextMenu={noCtx}
          title={tr.downloadCreditNote}
          aria-label={tr.download}
        >
          <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2">
            <path d="M7 2v7M4 6l3 3 3-3M2 11h10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* 클릭 인터셉터 (이미지 열기 + 우클릭 차단) */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={onClick}
        onContextMenu={noCtx}
      />
    </div>
  );
}
