"use client";

import { useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { Photo } from "@/types";

interface Props {
  photos: Photo[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

interface Section {
  key: string;
  label: string;
  sublabel?: string;
  photos: Photo[];
}

function groupPhotos(photos: Photo[]): Section[] {
  const groups = new Map<string, Photo[]>();
  for (const p of photos) {
    // role_tag(이벤트명) + date 기준 그룹
    const key = `${p.role ?? ""}__${p.date?.slice(0, 7) ?? ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  return [...groups.entries()].map(([key, ps]) => {
    const [role, yearMonth] = key.split("__");
    const label = role || (yearMonth ? formatYearMonth(yearMonth) : "기타");
    const sublabel = role && yearMonth ? formatYearMonth(yearMonth) : undefined;
    return { key, label, sublabel, photos: ps };
  });
}

function formatYearMonth(ym: string) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  if (!y || !m) return ym;
  return `${y}년 ${parseInt(m)}월`;
}

export default function PhotoGrid({ photos, loading, hasMore, onLoadMore }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) onLoadMore(); },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  const sections = useMemo(() => groupPhotos(photos), [photos]);

  if (!loading && photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-white/20">
        <span className="text-4xl">◻</span>
        <span className="text-sm tracking-widest uppercase">No photos</span>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <section key={section.key}>
          {/* 섹션 헤더 */}
          <div className="flex items-baseline gap-3 mb-4 pb-2 border-b border-white/8">
            <h2 className="text-sm font-medium tracking-wide text-white/80">{section.label}</h2>
            {section.sublabel && (
              <span className="text-xs text-white/30">{section.sublabel}</span>
            )}
            <span className="ml-auto text-xs text-white/20 tabular-nums">{section.photos.length}</span>
          </div>

          {/* 포토 마사리 그리드 */}
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2">
            {section.photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        </section>
      ))}

      {/* 무한 스크롤 센티넬 */}
      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <div className="break-inside-avoid mb-2 group relative overflow-hidden rounded-sm bg-white/5">
      <Image
        src={photo.url}
        alt={photo.person ?? "gallery photo"}
        width={480}
        height={720}
        className="w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        unoptimized
      />
      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      flex items-end p-3 pointer-events-none">
        <div className="space-y-0.5">
          {photo.person && (
            <p className="text-white text-xs font-medium leading-snug">{photo.person}</p>
          )}
          {photo.date && (
            <p className="text-white/40 text-[10px]">{photo.date.slice(0, 10)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
