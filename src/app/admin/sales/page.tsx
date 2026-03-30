import { prisma } from "@/lib/prisma";
import SalesBarChart from "./SalesBarChart";

function fmtMoney(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export default async function SalesPage() {
  const now = new Date();
  const from30  = new Date(now.getTime() - 30 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allPurchases, monthPurchases, avgData, credits] = await Promise.all([
    prisma.purchase.findMany({
      where: { status: "completed", createdAt: { gte: from30 } },
      select: { createdAt: true, amount: true },
    }),
    prisma.purchase.findMany({
      orderBy: { createdAt: "desc" }, take: 30,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.purchase.aggregate({ _avg: { amount: true }, _sum: { amount: true }, _count: true, where: { status: "completed" } }),
    Promise.all([
      prisma.purchase.aggregate({ _sum: { creditsAdded: true }, where: { status: "completed" } }),
      prisma.download.aggregate({ _sum: { creditsUsed: true } }),
      prisma.credit.aggregate({ _sum: { balance: true } }),
    ]),
  ]);

  // 일별 집계
  const byDate = new Map<string, number>();
  for (const p of allPurchases) {
    const d = p.createdAt.toISOString().slice(0, 10);
    byDate.set(d, (byDate.get(d) ?? 0) + p.amount);
  }
  const labels    = [...byDate.keys()].sort();
  const amounts   = labels.map((d) => Math.round((byDate.get(d) ?? 0) / 100));
  const shortLbls = labels.map((d) => d.slice(5));

  const monthRevTotal = monthPurchases.filter(p => p.createdAt >= monthStart).reduce((a, p) => a + p.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">매출</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["총 매출", fmtMoney(avgData._sum.amount ?? 0), "text-green-400"],
          ["이달 매출", fmtMoney(monthRevTotal), "text-blue-400"],
          ["평균 주문", fmtMoney(Math.round(avgData._avg.amount ?? 0)), "text-purple-400"],
          ["총 거래", `${avgData._count.toLocaleString()}건`, "text-orange-400"],
        ].map(([t, v, c]) => (
          <div key={String(t)} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">{t}</p>
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* 차트 (client component) */}
      <SalesBarChart labels={shortLbls} amounts={amounts} />

      {/* 크레딧 유통 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">크레딧 유통 현황</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            ["총 발행", credits[0]._sum.creditsAdded ?? 0],
            ["총 사용", credits[1]._sum.creditsUsed ?? 0],
            ["잔여 크레딧", credits[2]._sum.balance ?? 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="text-center">
              <p className="text-2xl font-bold text-white">{String(value)}</p>
              <p className="text-xs text-zinc-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 구매 목록 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 overflow-x-auto">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">최근 구매 30건</h2>
        <table className="w-full text-sm min-w-[600px]">
          <thead><tr className="text-xs text-zinc-500 border-b border-zinc-800">
            <th className="pb-2 text-left">날짜</th><th className="pb-2 text-left">사용자</th>
            <th className="pb-2 text-right">금액</th><th className="pb-2 text-right">크레딧</th>
            <th className="pb-2 text-right">상태</th>
          </tr></thead>
          <tbody>
            {monthPurchases.map((p) => (
              <tr key={p.id} className="border-b border-zinc-800/50">
                <td className="py-2 text-zinc-500 text-xs">{p.createdAt.toISOString().slice(0, 10)}</td>
                <td className="py-2 text-xs text-zinc-300">{p.user.name ?? p.user.email}</td>
                <td className="py-2 text-right tabular-nums">{fmtMoney(p.amount)}</td>
                <td className="py-2 text-right tabular-nums">{p.creditsAdded}cr</td>
                <td className="py-2 text-right">
                  <span className={`text-xs ${p.status === "completed" ? "text-green-400" : "text-red-400"}`}>
                    {p.status === "completed" ? "완료" : p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
