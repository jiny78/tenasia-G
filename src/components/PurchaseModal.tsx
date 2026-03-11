"use client";

import { useState } from "react";

const PACKS = [
  {
    id: "starter",
    label: "Starter",
    photos: 5,
    price: "$2.99",
    priceEnv: process.env.NEXT_PUBLIC_STRIPE_PRICE_5,
    popular: false,
  },
  {
    id: "fan",
    label: "Fan Pack",
    photos: 15,
    price: "$6.99",
    priceEnv: process.env.NEXT_PUBLIC_STRIPE_PRICE_15,
    popular: true,
  },
  {
    id: "superfan",
    label: "Super Fan",
    photos: 30,
    price: "$11.99",
    priceEnv: process.env.NEXT_PUBLIC_STRIPE_PRICE_30,
    popular: false,
  },
] as const;

interface Props {
  onClose: () => void;
}

export default function PurchaseModal({ onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleBuy(pack: (typeof PACKS)[number]) {
    if (!pack.priceEnv) {
      setError("결제 시스템 준비 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setLoading(pack.id);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: pack.priceEnv, credits: pack.photos }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "결제 페이지를 열 수 없습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-white text-lg font-semibold tracking-wide">
              Download Pack
            </h2>
            <p className="text-white/40 text-xs mt-1">
              고화질 원본 이미지 · 워터마크 없음
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors text-xl leading-none mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* 팩 선택 */}
        <div className="space-y-3">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handleBuy(pack)}
              disabled={!!loading}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-150
                ${pack.popular
                  ? "border-white/30 bg-white/5 hover:bg-white/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                }
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{pack.label}</span>
                  {pack.popular && (
                    <span className="text-[10px] bg-white text-black font-bold px-1.5 py-0.5 rounded-full tracking-wide">
                      BEST
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-0.5">
                  {pack.photos}장 다운로드
                </p>
              </div>
              <div className="text-right">
                <span className="text-white font-semibold">{pack.price}</span>
                {loading === pack.id && (
                  <div className="mt-1 w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-xs text-center">{error}</p>
        )}

        <p className="mt-5 text-white/20 text-[10px] text-center leading-relaxed">
          Stripe 보안 결제 · 신용카드 / Apple Pay / Google Pay
        </p>
      </div>
    </div>
  );
}
