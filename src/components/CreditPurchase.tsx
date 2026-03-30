"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { THEMES, ThemeKey } from "@/lib/themes";

const PACKS = [
  {
    id: "f39a6822-9403-4561-b3ae-fd7479f5c847",
    credits: 10,
    price: "$9.99",
    perCredit: "$1.00/cr",
    badge: null,
  },
  {
    id: "55423584-6f68-469a-8d0d-d9052be47e50",
    credits: 50,
    price: "$39.99",
    perCredit: "$0.80/cr",
    badge: "Most Popular" as const,
  },
  {
    id: "73aaa166-f4a6-4e50-bee3-a9dd19fc832b",
    credits: 100,
    price: "$69.99",
    perCredit: "$0.70/cr",
    badge: "Best Value" as const,
  },
] as const;

interface Props {
  theme?: ThemeKey;
}

export default function CreditPurchase({ theme: themeProp }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [storedTheme] = useState<ThemeKey>(() => {
    if (typeof window === "undefined") return "black";
    const stored = localStorage.getItem("tg-theme") as ThemeKey | null;
    return stored && stored in THEMES ? stored : "black";
  });

  const theme = themeProp ?? storedTheme;
  const th = THEMES[theme];
  const isDark = theme === "black" || theme === "charcoal";

  function handleBuy(pack: (typeof PACKS)[number]) {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    setLoading(pack.id);

    const params = new URLSearchParams({
      products: pack.id,
      customerEmail: session.user.email ?? "",
      customerExternalId: session.user.id ?? "",
    });

    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className={`text-base font-semibold tracking-wide ${th.text}`}>Credits</h2>
        <p className={`text-xs mt-1 ${th.sub}`}>1 credit = 1 photo download (editorial license)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PACKS.map((pack) => {
          const isPopular = pack.badge === "Most Popular";
          const isBestValue = pack.badge === "Best Value";
          const isHighlighted = isPopular || isBestValue;
          const isLoading = loading === pack.id;

          return (
            <div
              key={pack.id}
              className={`relative flex flex-col gap-4 rounded-sm border p-5 transition-all duration-150 ${
                isHighlighted
                  ? isDark
                    ? "border-white/25 bg-white/[0.06]"
                    : "border-black/20 bg-black/[0.05]"
                  : `${th.border} ${th.card}`
              }`}
            >
              {pack.badge && (
                <span
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${
                    isPopular
                      ? isDark
                        ? "bg-white text-black"
                        : "bg-[#111] text-white"
                      : isDark
                        ? "bg-white/15 text-white border border-white/20"
                        : "bg-black/10 text-black/80 border border-black/15"
                  }`}
                >
                  {pack.badge}
                </span>
              )}

              <div>
                <p className={`text-3xl font-light tabular-nums ${th.text}`}>
                  {pack.credits}
                  <span className={`text-sm font-normal ml-1 ${th.sub}`}>cr</span>
                </p>
                <p className={`text-[11px] mt-1 ${th.sub}`}>{pack.perCredit}</p>
              </div>

              <div className="mt-auto space-y-3">
                <p className={`text-lg font-semibold tabular-nums ${th.text}`}>{pack.price}</p>

                <button
                  onClick={() => handleBuy(pack)}
                  disabled={!!loading}
                  className={`w-full py-2 rounded-sm text-xs font-medium tracking-wide transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark
                      ? isHighlighted
                        ? "bg-white text-black hover:bg-white/90"
                        : "bg-white/10 text-white hover:bg-white/20"
                      : isHighlighted
                        ? "bg-[#111] text-white hover:bg-black/80"
                        : "bg-black/8 text-[#111] hover:bg-black/15"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className={`w-3 h-3 border rounded-full animate-spin ${
                          isDark
                            ? isHighlighted
                              ? "border-black/30 border-t-black"
                              : "border-white/20 border-t-white/60"
                            : isHighlighted
                              ? "border-white/30 border-t-white"
                              : "border-black/20 border-t-black/60"
                        }`}
                      />
                      Processing...
                    </span>
                  ) : (
                    "Buy Now"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className={`mt-4 text-[10px] text-center leading-relaxed ${th.sub} opacity-60`}>
        Secure payment via Polar · Credits do not expire · No subscription
      </p>
    </div>
  );
}
