"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreditAdjust({ userId }: { userId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    const n = parseInt(amount);
    if (isNaN(n) || n === 0 || !reason.trim()) { setMsg("금액과 사유를 입력하세요."); return; }
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "adjustCredits", amount: n, reason }),
    });
    const data = await res.json();
    setMsg(res.ok ? `조정 완료 (잔액: ${data.balance})` : "오류 발생");
    setLoading(false);
    if (res.ok) { setAmount(""); setReason(""); router.refresh(); }
  };

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div>
        <label className="text-xs text-zinc-500 block mb-1">금액 (음수 가능)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="+10 또는 -5"
          className="w-28 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-500" />
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="text-xs text-zinc-500 block mb-1">사유</label>
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="사유 입력"
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-500" />
      </div>
      <button onClick={submit} disabled={loading}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded text-sm transition-colors">
        적용
      </button>
      {msg && <p className="text-xs text-zinc-400 w-full">{msg}</p>}
    </div>
  );
}
