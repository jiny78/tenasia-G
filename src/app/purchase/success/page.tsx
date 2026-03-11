"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { addCredits, markSession } from "@/lib/credits";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) { setStatus("error"); return; }

    fetch(`/api/verify-session?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setStatus("error"); return; }
        const isNew = markSession(data.sessionId);
        if (isNew) {
          const total = addCredits(data.credits);
          setCredits(total);
        } else {
          setCredits(data.credits);
        }
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
  }, [params]);

  useEffect(() => {
    if (status !== "ok") return;
    const t = setTimeout(() => router.push("/"), 4000);
    return () => clearTimeout(t);
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        {status === "loading" && (
          <>
            <div className="w-8 h-8 border border-white/15 border-t-white/60 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-white/50 text-sm">결제 확인 중...</p>
          </>
        )}

        {status === "ok" && (
          <>
            <div className="text-5xl mb-6">✓</div>
            <h1 className="text-white text-xl font-semibold mb-2">결제 완료!</h1>
            <p className="text-white/50 text-sm mb-1">다운로드 크레딧이 충전되었습니다.</p>
            <p className="text-white text-2xl font-bold mt-4 mb-1">{credits}</p>
            <p className="text-white/30 text-xs mb-8">장 남음</p>
            <p className="text-white/20 text-xs">잠시 후 자동으로 이동합니다...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-4xl mb-6 text-red-400">✕</div>
            <h1 className="text-white text-lg font-medium mb-2">확인 실패</h1>
            <p className="text-white/40 text-sm mb-6">결제는 완료되었습니다. 고객센터로 문의해주세요.</p>
            <button onClick={() => router.push("/")}
              className="text-white/60 hover:text-white text-sm underline">
              홈으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-8 h-8 border border-white/15 border-t-white/60 rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
