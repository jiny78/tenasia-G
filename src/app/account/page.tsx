import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin?callbackUrl=/account");

  const userId = session.user.id;
  const [credit, purchases, downloads] = await Promise.all([
    prisma.credit.findUnique({ where: { userId } }),
    prisma.purchase.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    3,
    }),
    prisma.download.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    5,
    }),
  ]);

  const balance = credit?.balance ?? 0;
  const now     = new Date();

  return (
    <div className="space-y-8">
      {/* 크레딧 카드 */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
        <p className="text-white/40 text-xs tracking-wide uppercase mb-1">Credit Balance</p>
        <p className="text-white text-4xl font-bold tabular-nums mb-4">{balance}</p>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black
                     text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          Buy Credits
        </a>
        {session.user.pressVerified && (
          <span className="ml-3 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            Press Verified {session.user.pressDiscount > 0 ? `· ${session.user.pressDiscount}% off` : ""}
          </span>
        )}
      </div>

      {/* 최근 구매 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white/80 text-sm font-medium">Recent Purchases</h2>
          <a href="/account/purchases" className="text-white/30 hover:text-white/60 text-xs transition-colors">
            View All →
          </a>
        </div>
        {purchases.length === 0 ? (
          <p className="text-white/20 text-sm">No purchases yet</p>
        ) : (
          <div className="space-y-2">
            {purchases.map((p) => (
              <div key={p.id}
                className="flex items-center justify-between bg-white/[0.02] border border-white/6
                           rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm">+{p.creditsAdded} credits</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-white/50 text-sm tabular-nums">
                  ${(p.amount / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 최근 다운로드 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white/80 text-sm font-medium">Recent Downloads</h2>
          <a href="/account/downloads" className="text-white/30 hover:text-white/60 text-xs transition-colors">
            View All →
          </a>
        </div>
        {downloads.length === 0 ? (
          <p className="text-white/20 text-sm">No downloads yet</p>
        ) : (
          <div className="space-y-2">
            {downloads.map((d) => {
              const expired = d.expiresAt < now;
              return (
                <div key={d.id}
                  className="flex items-center justify-between bg-white/[0.02] border border-white/6
                             rounded-xl px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm truncate">
                      {d.photoName ?? d.photoId.split("/").pop() ?? "Photo"}
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {expired ? (
                    <span className="text-white/20 text-xs ml-3">Expired</span>
                  ) : (
                    <span className="text-emerald-400/60 text-xs ml-3">
                      until {new Date(d.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
