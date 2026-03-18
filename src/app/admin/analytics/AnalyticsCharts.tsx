"use client";

import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("@/components/admin/AdminLineChart"), { ssr: false });
const DoughnutChart = dynamic(() => import("@/components/admin/AdminDoughnutChart"), { ssr: false });

interface Props {
  shortLabels: string[];
  viewData: number[];
  uniData: number[];
  desktop: number;
  mobile: number;
  tablet: number;
}

export default function AnalyticsCharts({ shortLabels, viewData, uniData, desktop, mobile, tablet }: Props) {
  return (
    <>
      {/* 트래픽 트렌드 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">일별 트래픽</h2>
        <LineChart
          labels={shortLabels}
          datasets={[
            { label: "페이지뷰", data: viewData, color: "#60a5fa", fill: true },
            { label: "유니크 방문자", data: uniData, color: "#34d399" },
          ]}
        />
      </div>

      {/* 디바이스 분포 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">디바이스 분포</h2>
        <div className="max-w-[220px] mx-auto">
          <DoughnutChart
            labels={["데스크톱", "모바일", "태블릿"]}
            data={[desktop, mobile, tablet]}
            colors={["#3b82f6", "#10b981", "#f59e0b"]}
          />
        </div>
      </div>
    </>
  );
}
