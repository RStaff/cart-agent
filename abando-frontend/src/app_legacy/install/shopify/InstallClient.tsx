"use client";

import { useMemo, useState } from "react";

export default function InstallClient({
  initialShop,
  initialPlan,
}: {
  initialShop: string;
  initialPlan: string;
}) {
  const [shop, setShop] = useState(initialShop);
  const [isLoading, setIsLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const planLabel = useMemo(() => {
    if (initialPlan === "starter") return "Starter";
    if (initialPlan === "growth") return "Growth";
    return "";
  }, [initialPlan]);

  return (
    <div className="rounded-xl bg-[#0f172a] p-5">
      <div className="space-y-3">
        <input
          value={shop}
          onChange={(event) => setShop(event.target.value)}
          placeholder="your-store.myshopify.com"
          className="h-12 w-full rounded-lg border border-white/10 bg-[#020617] px-4 text-sm text-white outline-none placeholder:text-slate-500"
        />
        {planLabel ? (
          <p className="text-sm text-slate-400">Selected plan: {planLabel}. Billing is not collected on this page.</p>
        ) : null}
        <button
          type="button"
          disabled={isLoading || !shop.trim()}
          onClick={() => {
            setIsLoading(true);
            setWaiting(true);
            window.location.href = `/api/auth?shop=${encodeURIComponent(shop.trim())}`;
          }}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Waiting for Shopify approval…
            </span>
          ) : (
            "Install Abando on Shopify"
          )}
        </button>
        {waiting ? <p className="text-sm text-cyan-200">Waiting for Shopify approval…</p> : null}
      </div>
    </div>
  );
}
