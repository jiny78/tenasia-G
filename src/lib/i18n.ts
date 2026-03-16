"use client";

import { createContext, useContext } from "react";

export type Lang = "en" | "ko";
export const LANG_KEY = "tg-lang";

type TranslationSet = {
  // header
  gallery: string;
  // FilterBar
  person: string;
  searchPlaceholder: string;
  year: string;
  event: string;
  filter: string;
  // PhotoGrid
  noPhotos: string;
  photosCount: (n: number) => string;
  // Lightbox
  download: string;
  downloadTitle: string;
  closeLabel: string;
  downloadCreditNote: string;
  // PurchaseModal
  downloadPack: string;
  downloadPackSub: string;
  paymentPending: string;
  paymentError: string;
  networkError: string;
  stripeNote: string;
  photosPackCount: (n: number) => string;
  // Success page
  verifying: string;
  paymentComplete: string;
  creditsAdded: string;
  creditsRemaining: string;
  redirecting: string;
  verifyFailed: string;
  verifyFailedSub: string;
  goHome: string;
  // Themes
  themeBlack: string;
  themeCharcoal: string;
  themeCream: string;
  themeWhite: string;
};

export const TRANSLATIONS: Record<Lang, TranslationSet> = {
  en: {
    gallery: "Gallery",
    person: "Person",
    searchPlaceholder: "Search...",
    year: "Year",
    event: "Event",
    filter: "Filter",
    noPhotos: "No Photos",
    photosCount: (n) => `${n} photos`,
    download: "Download",
    downloadTitle: "Download original high-res",
    closeLabel: "Close",
    downloadCreditNote: "Download (credit required)",
    downloadPack: "Download Pack",
    downloadPackSub: "High-res original · No watermark",
    paymentPending: "Payment system coming soon. Please try again later.",
    paymentError: "Could not open payment page.",
    networkError: "A network error occurred.",
    stripeNote: "Secure payment by Stripe · Credit card / Apple Pay / Google Pay",
    photosPackCount: (n) => `${n} photos`,
    verifying: "Verifying payment...",
    paymentComplete: "Payment Complete!",
    creditsAdded: "Download credits have been added.",
    creditsRemaining: "remaining",
    redirecting: "Redirecting shortly...",
    verifyFailed: "Verification Failed",
    verifyFailedSub: "Payment was completed. Please contact support.",
    goHome: "Go to Home",
    themeBlack: "Black",
    themeCharcoal: "Charcoal",
    themeCream: "Cream",
    themeWhite: "White",
  },
  ko: {
    gallery: "갤러리",
    person: "인물",
    searchPlaceholder: "검색...",
    year: "연도",
    event: "행사",
    filter: "필터",
    noPhotos: "No Photos",
    photosCount: (n) => `${n} photos`,
    download: "Download",
    downloadTitle: "원본 고화질 다운로드",
    closeLabel: "닫기",
    downloadCreditNote: "다운로드 (크레딧 필요)",
    downloadPack: "Download Pack",
    downloadPackSub: "고화질 원본 이미지 · 워터마크 없음",
    paymentPending: "결제 시스템 준비 중입니다. 잠시 후 다시 시도해주세요.",
    paymentError: "결제 페이지를 열 수 없습니다.",
    networkError: "네트워크 오류가 발생했습니다.",
    stripeNote: "Stripe 보안 결제 · 신용카드 / Apple Pay / Google Pay",
    photosPackCount: (n) => `${n}장 다운로드`,
    verifying: "결제 확인 중...",
    paymentComplete: "결제 완료!",
    creditsAdded: "다운로드 크레딧이 충전되었습니다.",
    creditsRemaining: "장 남음",
    redirecting: "잠시 후 자동으로 이동합니다...",
    verifyFailed: "확인 실패",
    verifyFailedSub: "결제는 완료되었습니다. 고객센터로 문의해주세요.",
    goHome: "홈으로 돌아가기",
    themeBlack: "흑",
    themeCharcoal: "회",
    themeCream: "크림",
    themeWhite: "백",
  },
};

export const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
}>({ lang: "ko", setLang: () => {} });

export function useLang() {
  return useContext(LangContext);
}
