"use client";

import dynamic from "next/dynamic";

const BarChart = dynamic(() => import("@/components/admin/AdminBarChart"), { ssr: false });

export default function SalesBarChart({ labels, amounts }: { labels: string[]; amounts: number[] }) {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
      <h2 className="text-sm font-medium text-zinc-400 mb-4">일별 매출 (30일, USD)</h2>
      <BarChart labels={labels} datasets={[{ label: "매출($)", data: amounts, color: "#3b82f6" }]} />
    </div>
  );
}
