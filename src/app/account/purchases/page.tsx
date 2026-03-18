import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin?callbackUrl=/account/purchases");

  const sp    = await searchParams;
  const page  = Math.max(1, parseInt(sp.page ?? "1", 10));
  const limit = 10;
  const skip  = (page - 1) * limit;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take:    limit,
    }),
    prisma.purchase.count({ where: { userId: session.user.id } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-white text-xl font-semibold mb-6">Purchase History</h1>

      {purchases.length === 0 ? (
        <p className="text-white/20 text-sm py-12 text-center">No purchases yet</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-white/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.02]">
                  <th className="text-left text-white/40 font-normal px-4 py-3">Date</th>
                  <th className="text-left text-white/40 font-normal px-4 py-3">Credits</th>
                  <th className="text-left text-white/40 font-normal px-4 py-3">Amount</th>
                  <th className="text-left text-white/40 font-normal px-4 py-3">Status</th>
                  <th className="text-left text-white/40 font-normal px-4 py-3">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, i) => (
                  <tr key={p.id}
                    className={`border-b border-white/5 last:border-0 ${
                      i % 2 === 0 ? "" : "bg-white/[0.01]"
                    }`}>
                    <td className="px-4 py-3 text-white/60 tabular-nums">
                      {new Date(p.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">+{p.creditsAdded}</td>
                    <td className="px-4 py-3 text-white/80 tabular-nums">
                      ${(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/25 text-xs truncate max-w-[120px]">
                      {p.stripeSessionId.slice(0, 16)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <a href={`/account/purchases?page=${page - 1}`}
                  className="px-3 py-1 rounded-lg border border-white/10 text-white/50
                             hover:text-white hover:border-white/30 text-sm transition-colors">
                  ← Prev
                </a>
              )}
              <span className="text-white/30 text-sm tabular-nums">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <a href={`/account/purchases?page=${page + 1}`}
                  className="px-3 py-1 rounded-lg border border-white/10 text-white/50
                             hover:text-white hover:border-white/30 text-sm transition-colors">
                  Next →
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
