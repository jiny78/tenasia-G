"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { THEMES, ThemeKey } from "@/lib/themes";

type Status = "loading" | "succeeded" | "failed" | "expired" | "unknown";

interface CheckoutResult {
  status:        string;
  creditsAdded:  number;
  isSinglePhoto: boolean;
  photoId:       string | null;
  balance:       number | null;
  amount:        number;
  currency:      string;
}

const MAX_POLLS  = 12;   // 최대 12회
const POLL_MS    = 2500; // 2.5초 간격 → 최대 30초 대기

function ConfirmationContent() {
  const params     = useSearchParams();
  const router     = useRouter();
  const checkoutId = params.get("checkout_id");

  const [theme, setTheme] = useState<ThemeKey>("black");
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  const pollCount = useRef(0);

  useEffect(() => {
    const stored = localStorage.getItem("tg-theme") as ThemeKey | null;
    if (stored && stored in THEMES) setTheme(stored);
  }, []);

  useEffect(() => {
    if (!checkoutId) {
      setStatus("unknown");
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res  = await fetch(`/api/polar/checkout-status?checkout_id=${checkoutId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Status check failed");
          setStatus("failed");
          return;
        }

        if (data.status === "succeeded") {
          setResult(data);
          setStatus("succeeded");
          return;
        }

        if (data.status === "failed") {
          setStatus("failed");
          return;
        }

        if (data.status === "expired") {
          setStatus("expired");
          return;
        }

        // open / confirmed → 아직 처리 중
        pollCount.current += 1;
        if (pollCount.current < MAX_POLLS) {
          timer = setTimeout(poll, POLL_MS);
        } else {
          // 타임아웃 — 성공으로 간주 (webhook 지연 가능성)
          setResult(data);
          setStatus("succeeded");
        }
      } catch {
        setError("Network error");
        setStatus("failed");
      }
    }

    poll();
    return () => clearTimeout(timer);
  }, [checkoutId]);

  const th     = THEMES[theme];
  const isDark = theme === "black" || theme === "charcoal";

  // ── 로딩 ─────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className={`min-h-screen ${th.bg} flex items-center justify-center`}>
        <div className="text-center space-y-4">
          <div className={`w-8 h-8 border-2 rounded-full animate-spin mx-auto
            ${isDark ? "border-white/15 border-t-white/60" : "border-black/15 border-t-black/60"}`} />
          <p className={`text-sm ${th.sub}`}>결제 확인 중…</p>
        </div>
      </div>
    );
  }

  // ── 실패 / 만료 / 알 수 없음 ─────────────────────────────────────
  if (status === "failed" || status === "expired" || status === "unknown") {
    return (
      <div className={`min-h-screen ${th.bg} flex items-center justify-center p-6`}>
        <div className={`w-full max-w-sm rounded-sm border ${th.border} ${th.card} p-8 text-center space-y-5`}>
          <div className="text-4xl">✕</div>
          <div>
            <h1 className={`text-lg font-semibold ${th.text}`}>
              {status === "expired"  ? "결제 세션이 만료되었습니다" :
               status === "unknown"  ? "잘못된 접근입니다" :
                                       "결제에 실패했습니다"}
            </h1>
            <p className={`text-xs mt-2 ${th.sub}`}>
              {error ?? "다시 시도하거나 문제가 지속되면 문의해 주세요."}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className={`w-full py-2.5 rounded-sm text-sm font-medium transition-all duration-150
              ${isDark
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-black/8 text-[#111] hover:bg-black/15"}`}
          >
            갤러리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ── 성공 ─────────────────────────────────────────────────────────
  const creditsAdded  = result?.creditsAdded  ?? 0;
  const isSinglePhoto = result?.isSinglePhoto ?? false;
  const photoId       = result?.photoId       ?? null;
  const balance       = result?.balance;

  async function handleSingleDownload() {
    if (!photoId) return;
    const res  = await fetch("/api/photos/download", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ photoId, licenseType: "editorial", resolution: "original" }),
    });
    const data = await res.json();
    if (data.downloadUrl) {
      window.location.href = data.downloadUrl;
    }
  }

  return (
    <div className={`min-h-screen ${th.bg} flex items-center justify-center p-6`}>
      <div className={`w-full max-w-sm rounded-sm border ${th.border} ${th.card} p-8 text-center space-y-6`}>

        {/* 체크 아이콘 */}
        <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center
          ${isDark ? "bg-white/8" : "bg-black/5"}`}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"
            className={isDark ? "text-white" : "text-[#111]"}>
            <path d="M4 11l5 5L18 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* 메시지 */}
        <div className="space-y-1">
          <h1 className={`text-xl font-semibold tracking-wide ${th.text}`}>
            결제가 완료되었습니다
          </h1>
          <p className={`text-xs ${th.sub}`}>
            {isSinglePhoto
              ? "사진 다운로드가 준비되었습니다"
              : "크레딧이 계정에 충전되었습니다"}
          </p>
        </div>

        {/* 크레딧 팩: 충전 정보 */}
        {!isSinglePhoto && (
          <div className={`rounded-sm border ${th.border} p-4 space-y-2`}>
            {creditsAdded > 0 && (
              <div className="flex justify-between items-center">
                <span className={`text-xs ${th.sub}`}>충전된 크레딧</span>
                <span className={`text-sm font-semibold tabular-nums ${th.text}`}>
                  +{creditsAdded} cr
                </span>
              </div>
            )}
            {balance !== null && (
              <div className={`flex justify-between items-center ${creditsAdded > 0 ? `pt-2 border-t ${th.border}` : ""}`}>
                <span className={`text-xs ${th.sub}`}>현재 잔액</span>
                <span className={`text-sm font-semibold tabular-nums ${th.text}`}>
                  {balance} cr
                </span>
              </div>
            )}
          </div>
        )}

        {/* 단건 구매: 다운로드 안내 */}
        {isSinglePhoto && (
          <div className={`rounded-sm border ${th.border} p-4 space-y-1 text-left`}>
            <p className={`text-xs font-medium ${th.text}`}>Editorial License · 90일 유효</p>
            <p className={`text-[11px] ${th.sub}`}>
              다운로드 버튼을 클릭하면 원본 고해상도 사진이 저장됩니다.
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="space-y-2">
          {/* 단건 구매: 즉시 다운로드 버튼 */}
          {isSinglePhoto && photoId && (
            <button
              onClick={handleSingleDownload}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-sm
                text-sm font-medium transition-all duration-150
                ${isDark
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-[#111] text-white hover:bg-black/80"}`}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 2v7M4 6l3 3 3-3M2 11h10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              사진 다운로드
            </button>
          )}

          <Link href="/"
            className={`block w-full py-2.5 rounded-sm text-sm font-medium text-center
              transition-all duration-150
              ${isSinglePhoto
                ? isDark
                  ? "bg-white/8 text-white hover:bg-white/15"
                  : "bg-black/5 text-[#111] hover:bg-black/10"
                : isDark
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-[#111] text-white hover:bg-black/80"}`}
          >
            갤러리로 돌아가기
          </Link>

          <Link href="/account/downloads"
            className={`block w-full py-2.5 rounded-sm text-sm font-medium text-center
              transition-all duration-150
              ${isDark
                ? "bg-white/8 text-white hover:bg-white/15"
                : "bg-black/5 text-[#111] hover:bg-black/10"}`}
          >
            내 다운로드 보기
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
