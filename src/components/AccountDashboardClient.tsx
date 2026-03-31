"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import CreditPurchase from "@/components/CreditPurchase";

type PurchaseRecord = {
  id: string;
  creditsAdded: number;
  amount: number;
  createdAt: string;
};

type DownloadRecord = {
  id: string;
  photoId: string;
  photoName: string | null;
  expiresAt: string;
  createdAt: string;
  expired: boolean;
};

type DashboardState = {
  balance: number;
  purchases: PurchaseRecord[];
  downloads: DownloadRecord[];
};

const initialState: DashboardState = {
  balance: 0,
  purchases: [],
  downloads: [],
};

export default function AccountDashboardClient() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partial, setPartial] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    fetch("/api/account/dashboard", { cache: "no-store" })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error ?? `Dashboard request failed: ${res.status}`);
        }
        return payload;
      })
      .then((payload) => {
        if (cancelled) return;
        setData({
          balance: payload.balance ?? 0,
          purchases: payload.purchases ?? [],
          downloads: payload.downloads ?? [],
        });
        setPartial(Boolean(payload.partial));
      })
      .catch(() => {
        if (cancelled) return;
        setError("Account data could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const now = useMemo(() => new Date(), []);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border border-white/15 border-t-white/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {partial && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
          Some account sections are temporarily unavailable, but the dashboard is still usable.
        </div>
      )}

      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
        <p className="mb-1 text-xs uppercase tracking-wide text-white/40">Credit Balance</p>
        <div className="mb-4 flex items-center gap-3">
          <p className="text-4xl font-bold tabular-nums text-white">{data.balance}</p>
          {session?.user?.pressVerified && (
            <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-400">
              Press Verified {session.user.pressDiscount > 0 ? `· ${session.user.pressDiscount}% off` : ""}
            </span>
          )}
        </div>
      </div>

      <CreditPurchase theme="charcoal" />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white/80">Recent Purchases</h2>
          <a href="/account/purchases" className="text-xs text-white/30 transition-colors hover:text-white/60">
            View All
          </a>
        </div>
        {data.purchases.length === 0 ? (
          <p className="text-sm text-white/20">No purchases yet</p>
        ) : (
          <div className="space-y-2">
            {data.purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">+{purchase.creditsAdded} credits</p>
                  <p className="mt-0.5 text-xs text-white/30">
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-white/50">
                  ${(purchase.amount / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white/80">Recent Downloads</h2>
          <a href="/account/downloads" className="text-xs text-white/30 transition-colors hover:text-white/60">
            View All
          </a>
        </div>
        {data.downloads.length === 0 ? (
          <p className="text-sm text-white/20">No downloads yet</p>
        ) : (
          <div className="space-y-2">
            {data.downloads.map((download) => {
              const expired = download.expired || new Date(download.expiresAt) < now;
              return (
                <div
                  key={download.id}
                  className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">
                      {download.photoName ?? download.photoId.split("/").pop() ?? "Photo"}
                    </p>
                    <p className="mt-0.5 text-xs text-white/30">
                      {new Date(download.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {expired ? (
                    <span className="ml-3 text-xs text-white/20">Expired</span>
                  ) : (
                    <span className="ml-3 text-xs text-emerald-400/60">
                      until {new Date(download.expiresAt).toLocaleDateString()}
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
