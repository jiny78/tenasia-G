"use client";

import Link from "next/link";

export default function LegacyPurchaseSuccessPage() {
  return (
    <div className="min-h-screen bg-[#111] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center space-y-4">
        <h1 className="text-lg font-semibold">Legacy Stripe flow has been retired</h1>
        <p className="text-sm text-white/50">
          Credit purchases now run through Polar. If you completed a recent checkout, return to the
          gallery and retry from the current purchase flow.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Return to Gallery
        </Link>
      </div>
    </div>
  );
}
