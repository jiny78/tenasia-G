import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CredentialActions from "./CredentialActions";

const COUNTRY_NAMES: Record<string, string> = {
  KR:"대한민국", US:"미국", JP:"일본", CN:"중국", TW:"대만", HK:"홍콩",
  GB:"영국", DE:"독일", FR:"프랑스", AU:"호주", CA:"캐나다", SG:"싱가포르",
};

function fmt(n: number) { return n.toLocaleString(); }
function fmtMoney(cents: number) { return `$${(cents/100).toFixed(0)}`; }
function pct(a: number, total: number) { return total > 0 ? Math.round((a/total)*100) : 0; }

export default async function AdminOverview() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const now           = new Date();
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart= new Date(now.getFullYear(), now.getMonth()-1, 1);
  const startOfDay    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last30        = new Date(now.getTime() - 30*86400000);

  const [
    totalUsers, newUsersMonth,
    revMTD, revPrev,
    dlMTD, dlEd, dlCom,
    pvToday, pvSessions,
    countries,
    pendingCreds,
    topDownloads,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.purchase.aggregate({ _sum: { amount: true }, where: { status:"completed", createdAt:{ gte: startOfMonth } } }),
    prisma.purchase.aggregate({ _sum: { amount: true }, where: { status:"completed", createdAt:{ gte: prevMonthStart, lt: startOfMonth } } }),
    prisma.download.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.download.count({ where: { createdAt: { gte: startOfMonth }, licenseType:"editorial" } }),
    prisma.download.count({ where: { createdAt: { gte: startOfMonth }, licenseType:"commercial" } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.pageView.findMany({ where: { createdAt: { gte: startOfDay } }, select:{ sessionId:true }, distinct:["sessionId"] }),
    prisma.pageView.groupBy({ by:["country"], _count:{ id:true }, where:{ country:{ not:null }, createdAt:{ gte: last30 } }, orderBy:{ _count:{ id:"desc" } }, take:10 }),
    prisma.mediaCredential.findMany({ where:{ status:"pending" }, include:{ user:{ select:{ name:true, email:true, company:true } } }, orderBy:{ createdAt:"asc" }, take:5 }),
    prisma.download.groupBy({ by:["photoId","photoName"], _count:{ id:true }, _sum:{ creditsUsed:true }, where:{ createdAt:{ gte: last30 } }, orderBy:{ _count:{ id:"desc" } }, take:10 }),
  ]);

  const revMTDVal  = revMTD._sum.amount  ?? 0;
  const revPrevVal = revPrev._sum.amount ?? 0;
  const revChange  = revPrevVal > 0 ? Math.round(((revMTDVal - revPrevVal) / revPrevVal) * 100) : null;
  const maxCountry = countries[0]?._count.id ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">개요</h1>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="총 사용자" value={fmt(totalUsers)} sub={`+${fmt(newUsersMonth)} 이달`} color="blue" />
        <KpiCard title="이달 매출" value={fmtMoney(revMTDVal)}
          sub={revChange != null ? `${revChange >= 0 ? "+" : ""}${revChange}% 전월 대비` : "전월 없음"}
          color={revChange == null || revChange >= 0 ? "green" : "red"} />
        <KpiCard title="이달 다운로드" value={fmt(dlMTD)}
          sub={`편집 ${pct(dlEd, dlMTD)}% / 상업 ${pct(dlCom, dlMTD)}%`} color="purple" />
        <KpiCard title="오늘 페이지뷰" value={fmt(pvToday)}
          sub={`유니크 ${fmt(pvSessions.length)}명`} color="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 국가별 트래픽 */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">국가별 트래픽 (30일)</h2>
          <div className="space-y-2.5">
            {countries.map((c) => {
              const name  = COUNTRY_NAMES[c.country!] ?? c.country;
              const widthPct = Math.round((c._count.id / maxCountry) * 100);
              return (
                <div key={c.country} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-16 shrink-0">{name}</span>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${widthPct}%` }} />
                  </div>
                  <span className="text-xs text-zinc-500 tabular-nums w-10 text-right">{fmt(c._count.id)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 프레스 크리덴셜 대기 */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">프레스 크리덴셜 심사 대기</h2>
          {pendingCreds.length === 0 ? (
            <p className="text-sm text-zinc-600">대기 중인 심사 없음</p>
          ) : (
            <div className="space-y-3">
              {pendingCreds.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-800 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.user.name ?? c.user.email}</p>
                    <p className="text-xs text-zinc-500 truncate">{c.user.company} · {c.type}</p>
                  </div>
                  <CredentialActions credentialId={c.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 인기 다운로드 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 overflow-x-auto">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">인기 다운로드 TOP 10 (30일)</h2>
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-xs text-zinc-500 border-b border-zinc-800">
              <th className="pb-2 text-left w-8">#</th>
              <th className="pb-2 text-left">Photo ID</th>
              <th className="pb-2 text-left">파일명</th>
              <th className="pb-2 text-right">다운로드</th>
              <th className="pb-2 text-right">매출</th>
            </tr>
          </thead>
          <tbody>
            {topDownloads.map((d, i) => (
              <tr key={d.photoId} className="border-b border-zinc-800/50 last:border-0">
                <td className="py-2 text-zinc-600">{i + 1}</td>
                <td className="py-2 font-mono text-xs text-zinc-400">{d.photoId.slice(0, 16)}…</td>
                <td className="py-2 text-zinc-300 truncate max-w-[200px]">{d.photoName ?? "—"}</td>
                <td className="py-2 text-right tabular-nums">{d._count.id}</td>
                <td className="py-2 text-right tabular-nums text-green-400">{fmtMoney((d._sum.creditsUsed ?? 0) * 400)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, color }: { title: string; value: string; sub: string; color: string }) {
  const accent = color === "blue" ? "text-blue-400" : color === "green" ? "text-green-400"
    : color === "purple" ? "text-purple-400" : color === "red" ? "text-red-400" : "text-orange-400";
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
      <p className="text-xs text-zinc-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-zinc-600 mt-1">{sub}</p>
    </div>
  );
}
