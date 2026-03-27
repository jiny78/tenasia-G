"use client";

import { useSession } from "next-auth/react";
import { ThemeKey, THEMES } from "@/lib/themes";

const SINGLE_PHOTO_PRODUCT_ID = "89730975-6c13-4bcf-93ec-849cfd474d80";
const SINGLE_PHOTO_PRICE      = "$2.99";

interface Props {
  photoId:          string;   // R2 key (photos/2025/...)
  licenseType?:     string;   // default: "editorial"
  creditsRequired:  number;
  currentBalance:   number;
  theme:            ThemeKey;
  onClose:          () => void;
}

export default function InsufficientCreditsModal({
  photoId,
  licenseType = "editorial",
  creditsRequired,
  currentBalance,
  theme,
  onClose,
}: Props) {
  const { data: session } = useSession();
  const isDark            = theme === "black" || theme === "charcoal";
  const th                = THEMES[theme];

  function handleChargeCredits() {
    // 크레딧 구매 페이지로 이동 (현재 URL을 return으로 기억)
    window.location.href = "/account";
  }

  function handleSingleBuy() {
    if (!session?.user) {
      window.location.href = "/auth/signin";
      return;
    }

    const metadata = JSON.stringify({ photoId, licenseType });

    const params = new URLSearchParams({
      products:           SINGLE_PHOTO_PRODUCT_ID,
      customerEmail:      session.user.email ?? "",
      customerExternalId: session.user.id    ?? "",
      metadata,
    });

    window.location.href = `/checkout?${params.toString()}`;
  }

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-sm border shadow-2xl p-6 space-y-5
          ${isDark ? "bg-[#161616] border-white/10" : "bg-white border-black/8"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`text-base font-semibold ${th.text}`}>크레딧이 부족합니다</h2>
            <p className={`text-xs mt-1 ${th.sub}`}>
              필요: {creditsRequired} cr &nbsp;·&nbsp; 보유: {currentBalance} cr
            </p>
          </div>
          <button
            onClick={onClose}
            className={`text-lg leading-none mt-0.5 transition-colors
              ${isDark ? "text-white/25 hover:text-white/60" : "text-black/25 hover:text-black/60"}`}
          >
            ✕
          </button>
        </div>

        {/* 구분선 */}
        <div className={`border-t ${th.border}`} />

        {/* 선택지 */}
        <div className="space-y-2.5">

          {/* 옵션 1: 크레딧 충전 */}
          <button
            onClick={handleChargeCredits}
            className={`w-full flex items-center justify-between p-4 rounded-sm border
              text-left transition-all duration-150
              ${isDark
                ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
                : "border-black/8 bg-black/[0.02] hover:bg-black/[0.05]"}`}
          >
            <div>
              <p className={`text-sm font-medium ${th.text}`}>크레딧 충전하기</p>
              <p className={`text-xs mt-0.5 ${th.sub}`}>10 · 50 · 100 크레딧 팩 선택</p>
            </div>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={th.sub}>
              <path d="M5 3l5 4-5 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* 옵션 2: 단건 즉시 구매 */}
          <button
            onClick={handleSingleBuy}
            className={`w-full flex items-center justify-between p-4 rounded-sm border
              text-left transition-all duration-150
              ${isDark
                ? "border-white/25 bg-white/[0.06] hover:bg-white/[0.12]"
                : "border-black/20 bg-black/[0.04] hover:bg-black/[0.08]"}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${th.text}`}>이 사진만 바로 구매</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  ${isDark ? "bg-white text-black" : "bg-[#111] text-white"}`}>
                  즉시
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${th.sub}`}>
                {SINGLE_PHOTO_PRICE} · editorial 라이선스 · 90일 유효
              </p>
            </div>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={th.sub}>
              <path d="M5 3l5 4-5 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 안내 */}
        <p className={`text-[10px] text-center leading-relaxed ${th.sub} opacity-50`}>
          결제는 Polar를 통해 안전하게 처리됩니다
        </p>
      </div>
    </div>
  );
}
