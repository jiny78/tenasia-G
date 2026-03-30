"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { THEMES, ThemeKey } from "@/lib/themes";

type Status = "loading" | "succeeded" | "failed" | "expired" | "unknown";

interface CheckoutResult {
  status: string;
  creditsAdded: number;
  isSinglePhoto: boolean;
  photoId: string | null;
  balance: number | null;
  amount: number;
  currency: string;
}

const MAX_POLLS = 12;
const POLL_MS = 2500;

function ConfirmationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const checkoutId = params.get("checkout_id");

  const [theme] = useState<ThemeKey>(() => {
    if (typeof window === "undefined") return "black";
    const stored = localStorage.getItem("tg-theme") as ThemeKey | null;
    return stored && stored in THEMES ? stored : "black";
  });
  const [status, setStatus] = useState<Status>(() => (checkoutId ? "loading" : "unknown"));
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollCount = useRef(0);

  useEffect(() => {
    if (!checkoutId) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/polar/checkout-status?checkout_id=${checkoutId}`);
        const data = await res.json();
        if (cancelled) return;

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

        pollCount.current += 1;
        if (pollCount.current < MAX_POLLS) {
          timer = setTimeout(poll, POLL_MS);
          return;
        }

        setError("Payment confirmation timed out. Please refresh or contact support if you were charged.");
        setStatus("unknown");
      } catch {
        if (cancelled) return;
        setError("Network error");
        setStatus("failed");
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [checkoutId]);

  const themeConfig = THEMES[theme];
  const isDark = theme === "black" || theme === "charcoal";

  if (status === "loading") {
    return (
      <div className={`min-h-screen ${themeConfig.bg} flex items-center justify-center`}>
        <div className="text-center space-y-4">
          <div
            className={`w-8 h-8 border-2 rounded-full animate-spin mx-auto ${
              isDark ? "border-white/15 border-t-white/60" : "border-black/15 border-t-black/60"
            }`}
          />
          <p className={`text-sm ${themeConfig.sub}`}>Checking payment status...</p>
        </div>
      </div>
    );
  }

  if (status === "failed" || status === "expired" || status === "unknown") {
    return (
      <div className={`min-h-screen ${themeConfig.bg} flex items-center justify-center p-6`}>
        <div className={`w-full max-w-sm rounded-sm border ${themeConfig.border} ${themeConfig.card} p-8 text-center space-y-5`}>
          <div className="text-4xl">!</div>
          <div>
            <h1 className={`text-lg font-semibold ${themeConfig.text}`}>
              {status === "expired"
                ? "Payment session expired"
                : status === "unknown"
                  ? "Payment confirmation is still pending"
                  : "Payment failed"}
            </h1>
            <p className={`text-xs mt-2 ${themeConfig.sub}`}>
              {error ?? "Please try again or contact support if the issue continues."}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className={`w-full py-2.5 rounded-sm text-sm font-medium transition-all duration-150 ${
              isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/8 text-[#111] hover:bg-black/15"
            }`}
          >
            Back to gallery
          </button>
        </div>
      </div>
    );
  }

  const creditsAdded = result?.creditsAdded ?? 0;
  const isSinglePhoto = result?.isSinglePhoto ?? false;
  const photoId = result?.photoId ?? null;
  const balance = result?.balance;

  async function handleSingleDownload() {
    if (!photoId) return;
    const res = await fetch("/api/photos/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, licenseType: "editorial", resolution: "original" }),
    });
    const data = await res.json();
    if (data.downloadUrl) {
      window.location.href = data.downloadUrl;
    }
  }

  return (
    <div className={`min-h-screen ${themeConfig.bg} flex items-center justify-center p-6`}>
      <div className={`w-full max-w-sm rounded-sm border ${themeConfig.border} ${themeConfig.card} p-8 text-center space-y-6`}>
        <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${isDark ? "bg-white/8" : "bg-black/5"}`}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" className={isDark ? "text-white" : "text-[#111]"}>
            <path d="M4 11l5 5L18 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="space-y-1">
          <h1 className={`text-xl font-semibold tracking-wide ${themeConfig.text}`}>Payment completed</h1>
          <p className={`text-xs ${themeConfig.sub}`}>
            {isSinglePhoto ? "Your photo download is ready." : "Credits were added to your account."}
          </p>
        </div>

        {!isSinglePhoto && (
          <div className={`rounded-sm border ${themeConfig.border} p-4 space-y-2`}>
            {creditsAdded > 0 && (
              <div className="flex justify-between items-center">
                <span className={`text-xs ${themeConfig.sub}`}>Credits added</span>
                <span className={`text-sm font-semibold tabular-nums ${themeConfig.text}`}>+{creditsAdded} cr</span>
              </div>
            )}
            {balance !== null && (
              <div className={`flex justify-between items-center ${creditsAdded > 0 ? `pt-2 border-t ${themeConfig.border}` : ""}`}>
                <span className={`text-xs ${themeConfig.sub}`}>Current balance</span>
                <span className={`text-sm font-semibold tabular-nums ${themeConfig.text}`}>{balance} cr</span>
              </div>
            )}
          </div>
        )}

        {isSinglePhoto && (
          <div className={`rounded-sm border ${themeConfig.border} p-4 space-y-1 text-left`}>
            <p className={`text-xs font-medium ${themeConfig.text}`}>Editorial License / valid for 90 days</p>
            <p className={`text-[11px] ${themeConfig.sub}`}>
              Use the download button below to retrieve the original-resolution file.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {isSinglePhoto && photoId && (
            <button
              onClick={handleSingleDownload}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-sm text-sm font-medium transition-all duration-150 ${
                isDark ? "bg-white text-black hover:bg-white/90" : "bg-[#111] text-white hover:bg-black/80"
              }`}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 2v7M4 6l3 3 3-3M2 11h10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download photo
            </button>
          )}

          <Link
            href="/"
            className={`block w-full py-2.5 rounded-sm text-sm font-medium text-center transition-all duration-150 ${
              isSinglePhoto
                ? isDark
                  ? "bg-white/8 text-white hover:bg-white/15"
                  : "bg-black/5 text-[#111] hover:bg-black/10"
                : isDark
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-[#111] text-white hover:bg-black/80"
            }`}
          >
            Back to gallery
          </Link>

          <Link
            href="/account/downloads"
            className={`block w-full py-2.5 rounded-sm text-sm font-medium text-center transition-all duration-150 ${
              isDark ? "bg-white/8 text-white hover:bg-white/15" : "bg-black/5 text-[#111] hover:bg-black/10"
            }`}
          >
            View downloads
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
