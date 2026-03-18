"use client";

import { createContext, useContext } from "react";

export type Lang = "en" | "ko";
export const LANG_KEY = "tg-lang";

type TranslationSet = {
  // header
  gallery: string;
  signIn: string;
  signOut: string;
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
  // Purchase modal — coming soon
  comingSoonBadge: string;
  comingSoonDesc: string;
  refundPolicy: string;
  termsNote: string;
  // Policies & Footer
  policiesTitle: string;
  policiesPrivacy: string;
  policiesCopyright: string;
  policiesSales: string;
  policiesSecurity: string;
  policiesRefund: string;
  policiesLastUpdated: string;
  policiesTableOfContents: string;
  policiesBackToAll: string;
  footerLegal: string;
  // Auth
  authEmail: string;
  authPassword: string;
  authName: string;
  authCompany: string;
  authJobTitle: string;
  authCountry: string;
  authSignIn: string;
  authSignUp: string;
  authSignOut: string;
  authContinueWithGoogle: string;
  authNoAccount: string;
  authHasAccount: string;
  authForgotPassword: string;
  authEmailPlaceholder: string;
  authPasswordPlaceholder: string;
  authNamePlaceholder: string;
  authCompanyPlaceholder: string;
  authJobTitlePlaceholder: string;
  authCountryPlaceholder: string;
  authOptional: string;
  authSigningIn: string;
  authCreatingAccount: string;
  // Account dashboard
  accountDashboard: string;
  accountPurchases: string;
  accountDownloads: string;
  accountSettings: string;
  accountCreditBalance: string;
  accountBuyCredits: string;
  accountRecentPurchases: string;
  accountRecentDownloads: string;
  accountRedownload: string;
  accountExpired: string;
  accountNoDownloads: string;
  accountNoPurchases: string;
  accountLicenseFilter: string;
  accountAllLicenses: string;
  accountEditorial: string;
  accountCreditsEach: string;
  // Settings
  accountProfile: string;
  accountSaveChanges: string;
  accountCurrentPassword: string;
  accountNewPassword: string;
  accountChangePassword: string;
  accountPasswordChanged: string;
  accountProfileSaved: string;
  // Media credentials
  accountPressCredentials: string;
  accountPressCredentialsSub: string;
  accountCredentialType: string;
  accountCredentialFile: string;
  accountSubmitCredentials: string;
  accountCredentialStatus: string;
  accountCredentialPending: string;
  accountCredentialApproved: string;
  accountCredentialRejected: string;
  accountCredentialSubmitted: string;
  // Date labels
  accountViewAll: string;
  // Photo detail
  photoArtist: string;
  photoEvent: string;
  photoDate: string;
  photoResolution: string;
  photoFileSize: string;
  photoOrientation: string;
  photoPhotoId: string;
  photoSelectLicense: string;
  photoEditorial: string;
  photoEditorialDesc: string;
  photoCommercial: string;
  photoCommercialDesc: string;
  photoExtended: string;
  photoExtendedDesc: string;
  photoDownload: string;
  photoContactSales: string;
  photoSignInToDownload: string;
  photoBuyCredits: string;
  photoCreditRequired: string;
  photoViewDetails: string;
  photoMoreFromEvent: string;
  photoMoreOf: string;
  photoLandscape: string;
  photoPortrait: string;
  photoSquare: string;
};

export const TRANSLATIONS: Record<Lang, TranslationSet> = {
  en: {
    gallery: "Gallery",
    signIn: "Sign In",
    signOut: "Sign Out",
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
    comingSoonBadge: "Coming Soon",
    comingSoonDesc: "Payment system is being prepared. Download packs will be available soon.",
    refundPolicy: "No refunds after credits are used. Unused credits are non-transferable.",
    termsNote: "Secure payment by Stripe · Credit card / Apple Pay / Google Pay",
    policiesTitle: "Legal & Policies",
    policiesPrivacy: "Privacy Policy",
    policiesCopyright: "Copyright & Licensing",
    policiesSales: "Sales Terms",
    policiesSecurity: "Security Policy",
    policiesRefund: "Refund Policy",
    policiesLastUpdated: "Last updated",
    policiesTableOfContents: "Table of Contents",
    policiesBackToAll: "View All Policies",
    footerLegal: "Legal",
    // Auth
    authEmail: "Email",
    authPassword: "Password",
    authName: "Full Name",
    authCompany: "Company / Media",
    authJobTitle: "Job Title",
    authCountry: "Country",
    authSignIn: "Sign In",
    authSignUp: "Create Account",
    authSignOut: "Sign Out",
    authContinueWithGoogle: "Continue with Google",
    authNoAccount: "Don't have an account?",
    authHasAccount: "Already have an account?",
    authForgotPassword: "Forgot password?",
    authEmailPlaceholder: "you@example.com",
    authPasswordPlaceholder: "Min. 8 characters",
    authNamePlaceholder: "Your full name",
    authCompanyPlaceholder: "Reuters, AP, Freelance...",
    authJobTitlePlaceholder: "Photographer, Editor...",
    authCountryPlaceholder: "United States",
    authOptional: "Optional",
    authSigningIn: "Signing in...",
    authCreatingAccount: "Creating account...",
    // Account
    accountDashboard: "Dashboard",
    accountPurchases: "Purchases",
    accountDownloads: "Downloads",
    accountSettings: "Settings",
    accountCreditBalance: "Credit Balance",
    accountBuyCredits: "Buy Credits",
    accountRecentPurchases: "Recent Purchases",
    accountRecentDownloads: "Recent Downloads",
    accountRedownload: "Re-download",
    accountExpired: "Expired",
    accountNoDownloads: "No downloads yet",
    accountNoPurchases: "No purchases yet",
    accountLicenseFilter: "License",
    accountAllLicenses: "All",
    accountEditorial: "Editorial",
    accountCreditsEach: "credit each",
    accountProfile: "Profile",
    accountSaveChanges: "Save Changes",
    accountCurrentPassword: "Current Password",
    accountNewPassword: "New Password",
    accountChangePassword: "Change Password",
    accountPasswordChanged: "Password changed successfully",
    accountProfileSaved: "Profile saved",
    accountPressCredentials: "Press Credentials",
    accountPressCredentialsSub: "Submit your press ID or media credential for verified status and discounts.",
    accountCredentialType: "Credential Type",
    accountCredentialFile: "Upload File",
    accountSubmitCredentials: "Submit for Review",
    accountCredentialStatus: "Status",
    accountCredentialPending: "Under Review",
    accountCredentialApproved: "Approved",
    accountCredentialRejected: "Rejected",
    accountCredentialSubmitted: "Submitted successfully",
    accountViewAll: "View All",
    // Photo detail
    photoArtist:          "Artist",
    photoEvent:           "Event",
    photoDate:            "Date",
    photoResolution:      "Resolution",
    photoFileSize:        "File Size",
    photoOrientation:     "Orientation",
    photoPhotoId:         "Photo ID",
    photoSelectLicense:   "Select License",
    photoEditorial:       "Editorial",
    photoEditorialDesc:   "News, commentary, education",
    photoCommercial:      "Commercial",
    photoCommercialDesc:  "Ads, marketing, merchandise",
    photoExtended:        "Extended",
    photoExtendedDesc:    "Resale products, custom terms",
    photoDownload:        "Download",
    photoContactSales:    "Contact Sales",
    photoSignInToDownload:"Sign in to Download",
    photoBuyCredits:      "Buy Credits",
    photoCreditRequired:  'Credit: "Photo: TenAsia" required for editorial use',
    photoViewDetails:     "View Details",
    photoMoreFromEvent:   "More from this event",
    photoMoreOf:          "More of",
    photoLandscape:       "Landscape",
    photoPortrait:        "Portrait",
    photoSquare:          "Square",
  },
  ko: {
    gallery: "갤러리",
    signIn: "로그인",
    signOut: "로그아웃",
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
    comingSoonBadge: "준비 중",
    comingSoonDesc: "결제 시스템을 준비하고 있습니다. 곧 다운로드 팩 구매가 가능합니다.",
    refundPolicy: "사용된 크레딧은 환불되지 않습니다. 미사용 크레딧은 양도 불가합니다.",
    termsNote: "Stripe 보안 결제 · 신용카드 / Apple Pay / Google Pay",
    policiesTitle: "법적 고지 및 정책",
    policiesPrivacy: "개인정보 처리방침",
    policiesCopyright: "저작권 및 라이선스",
    policiesSales: "판매 약관",
    policiesSecurity: "보안 정책",
    policiesRefund: "환불 정책",
    policiesLastUpdated: "최종 수정일",
    policiesTableOfContents: "목차",
    policiesBackToAll: "전체 정책 보기",
    footerLegal: "법적 고지",
    // Auth
    authEmail: "이메일",
    authPassword: "비밀번호",
    authName: "이름",
    authCompany: "소속 / 언론사",
    authJobTitle: "직함",
    authCountry: "국가",
    authSignIn: "로그인",
    authSignUp: "계정 만들기",
    authSignOut: "로그아웃",
    authContinueWithGoogle: "Google로 계속하기",
    authNoAccount: "계정이 없으신가요?",
    authHasAccount: "이미 계정이 있으신가요?",
    authForgotPassword: "비밀번호 찾기",
    authEmailPlaceholder: "you@example.com",
    authPasswordPlaceholder: "최소 8자 이상",
    authNamePlaceholder: "이름을 입력하세요",
    authCompanyPlaceholder: "연합뉴스, AP, 프리랜서...",
    authJobTitlePlaceholder: "사진기자, 에디터...",
    authCountryPlaceholder: "대한민국",
    authOptional: "선택",
    authSigningIn: "로그인 중...",
    authCreatingAccount: "계정 생성 중...",
    // Account
    accountDashboard: "대시보드",
    accountPurchases: "구매 이력",
    accountDownloads: "다운로드 이력",
    accountSettings: "설정",
    accountCreditBalance: "크레딧 잔액",
    accountBuyCredits: "크레딧 구매",
    accountRecentPurchases: "최근 구매",
    accountRecentDownloads: "최근 다운로드",
    accountRedownload: "재다운로드",
    accountExpired: "만료됨",
    accountNoDownloads: "다운로드 이력이 없습니다",
    accountNoPurchases: "구매 이력이 없습니다",
    accountLicenseFilter: "라이선스",
    accountAllLicenses: "전체",
    accountEditorial: "편집용",
    accountCreditsEach: "크레딧/장",
    accountProfile: "프로필",
    accountSaveChanges: "저장",
    accountCurrentPassword: "현재 비밀번호",
    accountNewPassword: "새 비밀번호",
    accountChangePassword: "비밀번호 변경",
    accountPasswordChanged: "비밀번호가 변경되었습니다",
    accountProfileSaved: "프로필이 저장되었습니다",
    accountPressCredentials: "언론 크리덴셜",
    accountPressCredentialsSub: "보도증 또는 언론사 크리덴셜을 제출하면 인증 후 할인 혜택이 적용됩니다.",
    accountCredentialType: "크리덴셜 유형",
    accountCredentialFile: "파일 업로드",
    accountSubmitCredentials: "검토 요청",
    accountCredentialStatus: "상태",
    accountCredentialPending: "검토 중",
    accountCredentialApproved: "승인됨",
    accountCredentialRejected: "거절됨",
    accountCredentialSubmitted: "제출되었습니다",
    accountViewAll: "전체 보기",
    // Photo detail
    photoArtist:          "아티스트",
    photoEvent:           "행사",
    photoDate:            "날짜",
    photoResolution:      "해상도",
    photoFileSize:        "파일 크기",
    photoOrientation:     "방향",
    photoPhotoId:         "사진 ID",
    photoSelectLicense:   "라이선스 선택",
    photoEditorial:       "편집용",
    photoEditorialDesc:   "뉴스, 논평, 교육 목적",
    photoCommercial:      "상업용",
    photoCommercialDesc:  "광고, 마케팅, 상품",
    photoExtended:        "확장",
    photoExtendedDesc:    "재판매 제품, 맞춤 조건",
    photoDownload:        "다운로드",
    photoContactSales:    "문의하기",
    photoSignInToDownload:"로그인 후 다운로드",
    photoBuyCredits:      "크레딧 구매",
    photoCreditRequired:  '편집 사용 시 "Photo: TenAsia" 크레딧 표기 필수',
    photoViewDetails:     "상세 보기",
    photoMoreFromEvent:   "같은 행사 사진",
    photoMoreOf:          "더보기",
    photoLandscape:       "가로",
    photoPortrait:        "세로",
    photoSquare:          "정방형",
  },
};

export const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
}>({ lang: "en", setLang: () => {} });

export function useLang() {
  return useContext(LangContext);
}
