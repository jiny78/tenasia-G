import { prisma } from "@/lib/prisma";

export default async function DownloadsPage({
  searchParams,
}: { searchParams: Promise<{ license?: string; page?: string }> }) {
  const sp      = await searchParams;
  const license = sp.license ?? "all";
  const page    = Math.max(1, parseInt(sp.page ?? "1"));
  const limit   = 20;
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const from30  = new Date(Date.now() - 30 * 86400000);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const where: Record<string, unknown> = { createdAt: { gte: from30 } };
  if (license !== "all") where.licenseType = license;

  const [downloads, total, todayCount, monthCount, edCount, comCount, topPhotos] = await Promise.all([
    prisma.download.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.download.count({ where }),
    prisma.download.count({ where: { createdAt: { gte: today } } }),
    prisma.download.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.download.count({ where: { createdAt: { gte: monthStart }, licenseType: "editorial" } }),
    prisma.download.count({ where: { createdAt: { gte: monthStart }, licenseType: "commercial" } }),
    prisma.download.groupBy({
      by: ["photoId", "photoName"], _count: { id: true },
      where: { createdAt: { gte: from30 } },
      orderBy: { _count: { id: "desc" } }, take: 10,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const buildQ = (patch: Record<string, string | number>) => {
    const q = new URLSearchParams({ license, page: String(page), ...patch });
    return `/admin/downloads?${q}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">다운로드 관리</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["오늘 다운로드", todayCount, "text-blue-400"],
          ["이달 다운로드", monthCount, "text-green-400"],
          [`편집 (이달)`, edCount, "text-zinc-300"],
          [`상업 (이달)`, comCount, "text-purple-400"],
        ].map(([t, v, c]) => (
          <div key={String(t)} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">{t}</p>
            <p className={`text-2xl font-bold ${c}`}>{Number(v).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 인기 순위 */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">인기 다운로드 TOP 10 (30일)</h2>
          <div className="space-y-2">
            {topPhotos.map((p, i) => (
              <div key={p.photoId} className="flex items-center gap-2 text-xs">
                <span className="text-zinc-600 w-4">{i + 1}</span>
                <span className="flex-1 text-zinc-400 truncate">{p.photoName ?? p.photoId.slice(0, 20)}</span>
                <span className="text-zinc-300 tabular-nums">{p._count.id}회</span>
              </div>
            ))}
          </div>
        </div>

        {/* 라이선스 필터 */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">라이선스 필터</h2>
          <div className="flex gap-2 mb-4">
            {[["all","전체"],["editorial","편집용"],["commercial","상업용"]].map(([v, label]) => (
              <a key={v} href={buildQ({ license: v, page: 1 })}
                className={`px-2.5 py-1.5 text-xs rounded transition-colors ${license === v ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                {label}
              </a>
            ))}
          </div>
          <p className="text-sm text-zinc-400">표시: {total.toLocaleString()}건</p>
        </div>
      </div>

      {/* 다운로드 로그 테이블 */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 overflow-x-auto">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">다운로드 로그 (30일)</h2>
        <table className="w-full text-sm min-w-[600px]">
          <thead><tr className="text-xs text-zinc-500 border-b border-zinc-800">
            <th className="pb-2 text-left">날짜</th><th className="pb-2 text-left">사용자</th>
            <th className="pb-2 text-left">파일</th><th className="pb-2 text-center">라이선스</th>
            <th className="pb-2 text-right">크레딧</th>
          </tr></thead>
          <tbody>
            {downloads.map((d) => (
              <tr key={d.id} className="border-b border-zinc-800/50">
                <td className="py-2 text-zinc-500 text-xs">{d.createdAt.toISOString().slice(0, 10)}</td>
                <td className="py-2 text-xs text-zinc-300">{d.user.name ?? d.user.email}</td>
                <td className="py-2 text-xs text-zinc-400 truncate max-w-[160px]">{d.photoName ?? "—"}</td>
                <td className="py-2 text-center">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${d.licenseType === "commercial" ? "bg-purple-900 text-purple-300" : "bg-zinc-800 text-zinc-400"}`}>
                    {d.licenseType === "editorial" ? "편집" : d.licenseType === "commercial" ? "상업" : d.licenseType}
                  </span>
                </td>
                <td className="py-2 text-right tabular-nums text-xs">{d.creditsUsed}cr</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-4">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <a key={p} href={buildQ({ page: p })}
                className={`w-7 h-7 flex items-center justify-center text-xs rounded ${p === page ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                {p}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
