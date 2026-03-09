"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { Photo } from "@/types";

interface Props {
  photos: Photo[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function PhotoGrid({ photos, loading, hasMore, onLoadMore }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!loading && photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
        사진이 없습니다
      </div>
    );
  }

  return (
    <div>
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="break-inside-avoid overflow-hidden rounded group relative"
          >
            <Image
              src={photo.url}
              alt={photo.person ?? "gallery"}
              width={400}
              height={600}
              className="w-full object-cover transition duration-300 group-hover:scale-105"
              unoptimized
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
              <div>
                {photo.person && (
                  <p className="text-white text-xs font-medium leading-tight">{photo.person}</p>
                )}
                {photo.role && (
                  <p className="text-zinc-300 text-[10px]">{photo.role}</p>
                )}
                {photo.date && (
                  <p className="text-zinc-400 text-[10px]">{photo.date.slice(0, 7)}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-10" />

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
