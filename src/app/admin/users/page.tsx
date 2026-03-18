import Link from "next/link";
import { prisma } from "@/lib/prisma";

const PRESS_STATUS: Record<string, string> = { approved:"인증됨", pending:"심사중", rejected:"거부됨" };
const PRESS_COLOR:  Record<string, string> = { approved:"text-green-400", pending:"text-yellow-400", rejected:"text-red-400" };

export default async function UsersPage({
  searchParams,
}: { searchParams: Promise<{ search?: string; filter?: string; sort?: string; page?: string }> }) {
  const sp     = await searchParams;
  const search = sp.search ?? "";
  const filter = sp.filter ?? "all";
  const sort   = sp.sort   ?? "createdAt";
  const page   = Math.max(1, parseInt(sp.page ?? "1"));
  const limit  = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name:    { contains: search, mode: "insensitive" } },
      { email:   { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }
  if (filter === "verified") where.pressVerified = true;
  if (filter === "pending")  where.mediaCredential = { status: "pending" };
  if (filter === "submitted") where.mediaCredential = { isNot: null };

  const orderBy = sort === "createdAt" ? { createdAt: "desc" as const } : { createdAt: "desc" as const };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, orderBy, skip: (page - 1) * limit, take: limit,
      include: {
        credits:         { select: { balance: true } },
        mediaCredential: { select: { status: true } },
        _count:          { select: { downloads: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const buildQuery = (patch: Record<string, string | number>) => {
    const q = new URLSearchParams({ search, filter, sort, page: String(page), ...patch });
    return `/admin/users?${q}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">사용자 관리</h1>
        <span className="text-sm text-zinc-500">총 {total.toLocaleString()}명</span>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-wrap gap-2">
        <form method="GET" action="/admin/users" className="flex gap-2 flex-1 min-w-0">
          <input name="search" defaultValue={search} placeholder="이름·이메일·회사 검색"
            className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
          <input type="hidden" name="filter" value={filter} />
          <button type="submit" className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-sm transition-colors">검색</button>
        </form>
        <div className="flex gap-1">
          {[["all","전체"],["verified","인증"],["pending","심사중"],["submitted","제출함"]].map(([v, label]) => (
            <Link key={v} href={buildQuery({ filter: v, page: 1 })}
              className={`px-2.5 py-1.5 text-xs rounded transition-colors ${filter === v ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-zinc-900">
            <tr className="text-xs text-zinc-500 border-b border-zinc-800">
              <th className="px-4 py-3 text-left">이름 / 이메일</th>
              <th className="px-4 py-3 text-left">회사</th>
              <th className="px-4 py-3 text-left">가입일</th>
              <th className="px-4 py-3 text-center">프레스</th>
              <th className="px-4 py-3 text-right">크레딧</th>
              <th className="px-4 py-3 text-right">다운로드</th>
            </tr>
          </thead>
          <tbody className="bg-zinc-950">
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="hover:text-blue-400 transition-colors">
                    <p className="font-medium">{u.name ?? "—"}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{u.company ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs tabular-nums">{u.createdAt.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-3 text-center">
                  {u.mediaCredential ? (
                    <span className={`text-xs ${PRESS_COLOR[u.mediaCredential.status] ?? "text-zinc-500"}`}>
                      {PRESS_STATUS[u.mediaCredential.status] ?? u.mediaCredential.status}
                    </span>
                  ) : <span className="text-xs text-zinc-700">—</span>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{u.credits?.balance ?? 0}</td>
                <td className="px-4 py-3 text-right tabular-nums">{u._count.downloads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={buildQuery({ page: p })}
              className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors ${p === page ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
