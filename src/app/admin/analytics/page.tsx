import { prisma } from "@/lib/prisma";
import AnalyticsCharts from "./AnalyticsCharts";

const COUNTRY_NAMES: Record<string, string> = {
  KR:"대한민국", US:"미국", JP:"일본", CN:"중국", TW:"대만", HK:"홍콩",
  GB:"영국", DE:"독일", FR:"프랑스", AU:"호주", CA:"캐나다", SG:"싱가포르",
};

export default async function AnalyticsPage() {
  const days = 30;
  const now = new Date();
  const from = new Date(now.getTime() - days * 86400000);

  const views = await prisma.pageView.findMany({
    where: { createdAt: { gte: from } },
    select: { createdAt: true, sessionId: true, country: true, userAgent: true, referrer: true },
    orderBy: { createdAt: "asc" },
  });

  // 일별 집계
  const byDate = new Map<string, { views: number; sessions: Set<string> }>();
  for (const v of views) {
    const d = v.createdAt.toISOString().slice(0, 10);
    if (!byDate.has(d)) byDate.set(d, { views: 0, sessions: new Set() });
    const e = byDate.get(d)!;
    e.views++;
    if (v.sessionId) e.sessions.add(v.sessionId);
  }
  const labels   = [...byDate.keys()].sort();
  const viewData = labels.map((d) => byDate.get(d)?.views ?? 0);
  const uniData  = labels.map((d) => byDate.get(d)?.sessions.size ?? 0);
  const shortLabels = labels.map((d) => d.slice(5));

  // 국가별
  const countryMap = new Map<string, number>();
  for (const v of views) if (v.country) countryMap.set(v.country, (countryMap.get(v.country) ?? 0) + 1);
  const countries = [...countryMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);

  // 디바이스
  let mobile = 0, tablet = 0, desktop = 0;
  for (const v of views) {
    const ua = v.userAgent?.toLowerCase() ?? "";
    if (/tablet|ipad/.test(ua)) tablet++;
    else if (/mobile|android|iphone/.test(ua)) mobile++;
    else desktop++;
  }

  // 유입 경로
  const refMap = new Map<string, number>();
  for (const v of views) {
    if (!v.referrer) { refMap.set("직접 접속", (refMap.get("직접 접속") ?? 0) + 1); continue; }
    try {
      const host = new URL(v.referrer).hostname.replace(/^www\./, "");
      const label = host.includes("google") ? "Google" : host.includes("twitter") || host.includes("x.com") ? "Twitter/X" : host.includes("instagram") ? "Instagram" : host;
      refMap.set(label, (refMap.get(label) ?? 0) + 1);
    } catch { refMap.set("직접 접속", (refMap.get("직접 접속") ?? 0) + 1); }
  }
  const referrers = [...refMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxRef = referrers[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">방문 분석 (최근 30일)</h1>

      {/* 트래픽 트렌드 + 디바이스 (client charts) */}
      <AnalyticsCharts
        shortLabels={shortLabels}
        viewData={viewData}
        uniData={uniData}
        desktop={desktop}
        mobile={mobile}
        tablet={tablet}
      />

      {/* 국가별 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">국가별 방문</h2>
        <div className="space-y-2">
          {countries.map(([code, count]) => (
            <div key={code} className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-20 shrink-0">{COUNTRY_NAMES[code] ?? code}</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.round((count / countries[0][1]) * 100)}%` }} />
              </div>
              <span className="text-xs text-zinc-500 w-8 text-right tabular-nums">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 유입 경로 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">유입 경로</h2>
        <div className="space-y-2">
          {referrers.map(([source, count]) => (
            <div key={source} className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-24 shrink-0 truncate">{source}</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${Math.round((count / maxRef) * 100)}%` }} />
              </div>
              <span className="text-xs text-zinc-500 w-8 text-right tabular-nums">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
