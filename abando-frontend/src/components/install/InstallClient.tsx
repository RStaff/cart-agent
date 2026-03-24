"use client";

import { useMemo, useState } from "react";

export default function InstallClient({
  initialShop,
  initialPlan,
  isDemoScorecardShop,
  source,
  initialConnected = false,
}: {
  initialShop: string;
  initialPlan: string;
  isDemoScorecardShop?: boolean;
  source?: string;
  initialConnected?: boolean;
}) {
  const [shop, setShop] = useState(isDemoScorecardShop ? "" : initialShop);
  const [isLoading, setIsLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(Boolean(isDemoScorecardShop));

  const planLabel = useMemo(() => {
    if (initialPlan === "starter") return "Starter";
    if (initialPlan === "growth") return "Growth";
    return "";
  }, [initialPlan]);

  const normalizedShop = shop.trim().toLowerCase();
  const isMyShopifyDomain = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalizedShop);
  const canContinue = isMyShopifyDomain && !isLoading;
  const hasShopContext = Boolean(normalizedShop);
  const primaryLabel = initialConnected ? "Open merchant dashboard" : "Connect Shopify Store";

  return (
    <div className="rounded-xl bg-[#0f172a] p-5">
      <div className="space-y-3">
        {initialConnected ? (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-50">
            <p className="font-medium text-white">Store connected</p>
            <p className="mt-2">Abando is now listening for checkout activity</p>
          </div>
        ) : null}
        {showDemoNotice ? (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-50">
            <p className="font-medium text-white">This scorecard is using a sample store path.</p>
            <p className="mt-2">
              To connect your real store, enter your Shopify domain below. We keep the demo truthful here so you do not land on a broken unavailable-shop page.
            </p>
          </div>
        ) : null}
        {hasShopContext ? (
          <div className="rounded-xl border border-white/10 bg-[#020617] p-4 text-sm leading-7 text-slate-300">
            <p className="font-medium text-white">Store context received</p>
            <p className="mt-2 break-all">{normalizedShop}</p>
          </div>
        ) : showDemoNotice ? (
          <input
            value={shop}
            onChange={(event) => {
              setShop(event.target.value);
              if (showDemoNotice) {
                setShowDemoNotice(false);
              }
            }}
            placeholder="your-store.myshopify.com"
            className="h-12 w-full rounded-lg border border-white/10 bg-[#020617] px-4 text-sm text-white outline-none placeholder:text-slate-500"
          />
        ) : null}
        {planLabel ? (
          <p className="text-sm text-slate-400">Selected plan: {planLabel}. Billing is not collected on this page.</p>
        ) : null}
        {source === "shopify_callback" ? (
          <p className="text-sm text-slate-400">
            Shopify approval needs to complete before Abando can open the connected-store dashboard.
          </p>
        ) : null}
        {!hasShopContext && !showDemoNotice ? (
          <p className="text-sm text-slate-400">Open Abando from Shopify to continue the install flow.</p>
        ) : !normalizedShop ? (
          <p className="text-sm text-slate-400">Enter your real Shopify domain to continue to the approval step.</p>
        ) : !isMyShopifyDomain ? (
          <p className="text-sm text-amber-200">Use your real `store-name.myshopify.com` domain so Shopify can open the correct approval flow.</p>
        ) : null}
        <button
          type="button"
          disabled={initialConnected ? !hasShopContext : !canContinue}
          onClick={() => {
            if (initialConnected) {
              window.location.href = `/dashboard?shop=${encodeURIComponent(normalizedShop)}`;
              return;
            }
            setIsLoading(true);
            setWaiting(true);
            window.location.href = `/api/auth?shop=${encodeURIComponent(normalizedShop)}`;
          }}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Waiting for Shopify approval…
            </span>
          ) : (
            primaryLabel
          )}
        </button>
        {waiting ? <p className="text-sm text-cyan-200">Waiting for Shopify approval…</p> : null}
        <p className="text-sm text-slate-400">Abando monitors checkout activity and creates recovery actions when customers drop off.</p>
        <div className="rounded-xl border border-white/10 bg-[#020617] p-4 text-sm leading-7 text-slate-300">
          <p className="font-medium text-white">Need help?</p>
          <p className="mt-2">
            If the connection does not finish, reopen Abando from Shopify Admin Apps for this store and try again.
          </p>
          <p className="mt-2">
            Abando does not change checkout settings during install. It starts by listening for checkout activity and showing recovery status in the merchant dashboard.
          </p>
          <p className="mt-2 text-slate-400">
            Data shown after install is limited to store connection status, checkout event timestamps, recovery action status, and customer return events.
          </p>
        </div>
      </div>
    </div>
  );
}
