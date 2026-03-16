"use client";

import { useState } from "react";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

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
  const { lang } = useLang();
  const tr = TRANSLATIONS[lang];
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleBuy(pack: (typeof PACKS)[number]) {
    if (!pack.priceEnv) {
      setError(tr.paymentPending);
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
        setError(data.error ?? tr.paymentError);
      }
    } catch {
      setError(tr.networkError);
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
        {/* 준비 중 배너 */}
        <div className="mb-5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
          <span className="text-amber-400 text-sm mt-0.5">◐</span>
          <div>
            <p className="text-amber-400 text-xs font-semibold tracking-wide">
              {tr.comingSoonBadge}
            </p>
            <p className="text-amber-400/70 text-[11px] mt-0.5 leading-relaxed">
              {tr.comingSoonDesc}
            </p>
          </div>
        </div>

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-white text-lg font-semibold tracking-wide">
              {tr.downloadPack}
            </h2>
            <p className="text-white/40 text-xs mt-1">
              {tr.downloadPackSub}
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
                  {tr.photosPackCount(pack.photos)}
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
          <p className="mt-4 text-amber-400 text-xs text-center">{error}</p>
        )}

        {/* 환불/결제 정책 */}
        <div className="mt-5 pt-4 border-t border-white/8 space-y-1.5">
          <p className="text-white/20 text-[10px] text-center leading-relaxed">
            {tr.refundPolicy}
          </p>
          <p className="text-white/15 text-[10px] text-center leading-relaxed">
            {tr.termsNote}
          </p>
        </div>
      </div>
    </div>
  );
}
