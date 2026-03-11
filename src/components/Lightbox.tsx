"use client";

import { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { Photo } from "@/types";

interface Props {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}

export default function Lightbox({ photos, index, onClose, onNav }: Props) {
  const photo = photos[index];
  const [imgLoaded, setImgLoaded] = useState(false);

  const prev = index > 0 ? index - 1 : null;
  const next = index < photos.length - 1 ? index + 1 : null;

  const go = useCallback((i: number | null) => {
    if (i === null) return;
    setImgLoaded(false);
    onNav(i);
  }, [onNav]);

  useEffect(() => {
    setImgLoaded(false);
  }, [index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(prev);
      if (e.key === "ArrowRight") go(next);
      // 저장 단축키 차단
      if ((e.ctrlKey || e.metaKey) && ["s", "S", "u", "U"].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, go, prev, next]);

  // 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* 상단 바 */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline gap-3">
          {photo.person && (
            <span className="text-white text-sm font-medium">{photo.person}</span>
          )}
          {photo.role && (
            <span className="text-white/35 text-xs">{photo.role}</span>
          )}
          {photo.date && (
            <span className="text-white/25 text-xs tabular-nums">{photo.date.slice(0, 10)}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/25 text-xs tabular-nums">
            {index + 1} / {photos.length}
          </span>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-xl leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 메인 뷰어 */}
      <div
        className="flex-1 flex items-center justify-center min-h-0 px-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 이전 버튼 */}
        <button
          onClick={() => go(prev)}
          disabled={prev === null}
          className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center
                     text-white/50 hover:text-white disabled:opacity-0
                     transition-all duration-150 select-none"
          aria-label="이전"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* 사진 */}
        <div
          className="relative max-h-full max-w-full flex items-center justify-center photo-shield"
          style={{ height: "calc(100vh - 160px)" }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border border-white/15 border-t-white/50 rounded-full animate-spin" />
            </div>
          )}
          <Image
            key={photo.id}
            src={photo.url}
            alt={photo.person ?? "photo"}
            width={1200}
            height={900}
            className={`max-h-full max-w-full object-contain transition-opacity duration-300 select-none pointer-events-none ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ maxHeight: "calc(100vh - 160px)" }}
            onLoad={() => setImgLoaded(true)}
            unoptimized
            draggable={false}
          />
          {/* 워터마크 */}
          <div
            className="absolute inset-0 pointer-events-none select-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="110">' +
                '<text x="-5" y="70" transform="rotate(-22)" fill="rgba(255,255,255,0.05)" ' +
                'font-size="15" font-family="Arial, sans-serif" letter-spacing="4">TenAsia Gallery</text></svg>'
              )}")`,
              backgroundRepeat: "repeat",
            }}
          />
          {/* 우클릭 차단 오버레이 */}
          <div
            className="absolute inset-0 z-10"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={() => go(next)}
          disabled={next === null}
          className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center
                     text-white/50 hover:text-white disabled:opacity-0
                     transition-all duration-150 select-none"
          aria-label="다음"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* 하단 필름스트립 */}
      <div
        className="shrink-0 px-6 py-3 overflow-x-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-1.5 justify-center" style={{ minWidth: "max-content" }}>
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => go(i)}
              className={`relative w-12 h-12 shrink-0 overflow-hidden transition-all duration-150 ${
                i === index
                  ? "ring-1 ring-white opacity-100"
                  : "opacity-30 hover:opacity-60"
              }`}
            >
              <Image
                src={p.url}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
