"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Photo } from "@/types";
import Lightbox from "@/components/Lightbox";
import { ThemeKey } from "@/app/page";

interface Props {
  photos: Photo[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  theme: ThemeKey;
}

interface Section {
  key: string;
  title: string;
  date: string;
  photos: Photo[];
}

/* 같은 role_tag + 연월 기준으로 섹션 묶기 */
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
    return {
      key: k,
      title: role || "Gallery",
      date: dateLabel,
      photos: ps,
    };
  });
}

export default function PhotoGrid({ photos, loading, hasMore, onLoadMore, theme }: Props) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const isDark = theme === "black" || theme === "charcoal";

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && hasMore && !loading) onLoadMore(); },
      { rootMargin: "800px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, onLoadMore]);

  const sections = useMemo(() => buildSections(photos), [photos]);

  const sectionOffsets = useMemo(() => {
    const offsets: number[] = [];
    let offset = 0;
    for (const sec of sections) {
      offsets.push(offset);
      offset += sec.photos.length;
    }
    return offsets;
  }, [sections]);

  if (!loading && photos.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-40 gap-3 select-none ${isDark ? "text-white/15" : "text-black/15"}`}>
        <span className="text-5xl font-thin">◻</span>
        <span className="text-xs tracking-[0.4em] uppercase">No Photos</span>
      </div>
    );
  }

  return (
    <div>
      {sections.map((sec, si) => (
        <PhotoSection
          key={sec.key}
          section={sec}
          offset={sectionOffsets[si]}
          isDark={isDark}
          onOpen={(i) => setLbIndex(i)}
        />
      ))}
      {lbIndex !== null && (
        <Lightbox
          photos={photos}
          index={lbIndex}
          onClose={() => setLbIndex(null)}
          onNav={setLbIndex}
        />
      )}
      <div ref={sentinel} className="h-2" />
      {loading && (
        <div className="flex justify-center py-16">
          <div className={`w-4 h-4 border rounded-full animate-spin ${isDark ? "border-white/15 border-t-white/50" : "border-black/15 border-t-black/50"}`} />
        </div>
      )}
    </div>
  );
}

/* ─── 섹션 레이아웃 ─────────────────────────────────────────── */
function PhotoSection({
  section, offset, isDark, onOpen,
}: {
  section: Section;
  offset: number;
  isDark: boolean;
  onOpen: (globalIndex: number) => void;
}) {
  const { title, date, photos } = section;
  const open = (localIndex: number) => onOpen(offset + localIndex);

  const borderCls = isDark ? "border-white/8"    : "border-black/8";
  const titleCls  = isDark ? "text-white/85"      : "text-black/80";
  const dateCls   = isDark ? "text-white/30"      : "text-black/40";
  const countCls  = isDark ? "text-white/18"      : "text-black/25";

  return (
    <div className="mb-20">
      <div className={`flex items-end justify-between mb-5 pb-3 border-b ${borderCls}`}>
        <h2 className={`text-xl font-light tracking-wide leading-none ${titleCls}`}>{title}</h2>
        <div className="text-right">
          <p className={`text-xs tabular-nums ${dateCls}`}>{date}</p>
          <p className={`text-[10px] mt-0.5 ${countCls}`}>{photos.length} photos</p>
        </div>
      </div>
      <BookLayout photos={photos} isDark={isDark} onOpen={open} />
    </div>
  );
}

/* ─── 포토북 그리드 배치 ─────────────────────────────────────── */
function BookLayout({ photos, isDark, onOpen }: { photos: Photo[]; isDark: boolean; onOpen: (i: number) => void }) {
  const n = photos.length;

  if (n === 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <PhotoCard photo={photos[0]} aspect="aspect-[4/3]" isDark={isDark} onClick={() => onOpen(0)} />
      </div>
    );
  }

  if (n === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {photos.map((p, i) => (
          <PhotoCard key={p.id} photo={p} aspect="aspect-[3/4]" isDark={isDark} onClick={() => onOpen(i)} />
        ))}
      </div>
    );
  }

  if (n === 3) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        <PhotoCard photo={photos[0]} aspect="aspect-[3/4]" className="row-span-2" isDark={isDark} onClick={() => onOpen(0)} />
        <PhotoCard photo={photos[1]} aspect="aspect-[3/4]" isDark={isDark} onClick={() => onOpen(1)} />
        <PhotoCard photo={photos[2]} aspect="aspect-[3/4]" isDark={isDark} onClick={() => onOpen(2)} />
      </div>
    );
  }

  if (n <= 8) {
    const hero = photos[0];
    const rest = photos.slice(1);
    const rightCols = Math.min(2, Math.ceil(rest.length / 2));
    return (
      <div className="flex gap-1.5">
        <div className="w-[45%] shrink-0">
          <PhotoCard photo={hero} aspect="aspect-[2/3]" isDark={isDark} onClick={() => onOpen(0)} />
        </div>
        <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${rightCols}, 1fr)` }}>
          {rest.map((p, i) => (
            <PhotoCard key={p.id} photo={p} aspect="aspect-[3/4]" isDark={isDark} onClick={() => onOpen(i + 1)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-1.5">
      {photos.map((p, i) => (
        <div key={p.id} className="break-inside-avoid mb-1.5">
          <PhotoCard photo={p} isDark={isDark} onClick={() => onOpen(i)} />
        </div>
      ))}
    </div>
  );
}

/* ─── 카드 ──────────────────────────────────────────────────── */
function PhotoCard({
  photo,
  aspect,
  className = "",
  isDark,
  onClick,
}: {
  photo: Photo;
  aspect?: string;
  className?: string;
  isDark: boolean;
  onClick?: () => void;
}) {
  const bgCls = isDark ? "bg-white/4" : "bg-black/5";
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden cursor-pointer ${bgCls} ${aspect ?? ""} ${className}`}
    >
      <Image
        src={photo.url}
        alt={photo.person ?? "photo"}
        fill={!!aspect}
        width={aspect ? undefined : 480}
        height={aspect ? undefined : 640}
        className={`object-cover transition-transform duration-500 group-hover:scale-[1.04] ${aspect ? "" : "w-full"}`}
        unoptimized
      />
      {/* hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      flex items-end p-3 pointer-events-none">
        <div>
          {photo.person && (
            <p className="text-white text-xs font-medium leading-snug">{photo.person}</p>
          )}
          {photo.date && (
            <p className="text-white/40 text-[10px] mt-0.5">{photo.date.slice(0, 10)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
