"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CredentialActions({ credentialId }: { credentialId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const act = async (action: "approve" | "reject") => {
    setLoading(true);
    await fetch(`/api/admin/credentials/${credentialId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex gap-1.5 shrink-0">
      <button onClick={() => act("approve")} disabled={loading}
        className="px-2 py-0.5 text-xs rounded bg-green-600 hover:bg-green-500 disabled:opacity-40 transition-colors">
        승인
      </button>
      <button onClick={() => act("reject")} disabled={loading}
        className="px-2 py-0.5 text-xs rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 transition-colors">
        거부
      </button>
    </div>
  );
}
