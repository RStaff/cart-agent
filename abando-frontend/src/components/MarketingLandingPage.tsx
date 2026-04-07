"use client";

import { useState } from "react";
import Link from "next/link";
import PublicHeader from "@/components/brand/PublicHeader";
import CenteredContainer from "@/components/layout/CenteredContainer";

type MarketingLandingPageProps = {
  shop?: string;
};

export function MarketingLandingPage({ shop = "" }: MarketingLandingPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const normalizedShop = String(shop || "").trim().toLowerCase();

  async function handlePrimaryCta() {
    if (!normalizedShop || isSubmitting) {
      window.alert("Add ?shop=your-store.myshopify.com to test recovery");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/abando/activation/trigger-test-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: normalizedShop }),
      });

      if (!response.ok) {
        throw new Error("recovery_trigger_failed");
      }

      window.location.href = `/merchant?shop=${encodeURIComponent(normalizedShop)}`;
    } catch {
      window.alert("Recovery test could not start right now.");
      setIsSubmitting(false);
    }
  }

  return (
    <CenteredContainer>
      <PublicHeader shop={shop} />

      <section className="rounded-2xl border border-cyan-400/15 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(135deg,_#0f172a_0%,_#0b1f2d_55%,_#10283a_100%)] p-6">
        <div className="inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
          Recovery loop for Shopify
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
          Trigger a recovery test and watch the loop complete.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Start with a real recovery, bring a shopper back through the live path, and land on your merchant page with visible activity.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePrimaryCta}
            disabled={!normalizedShop || isSubmitting}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Starting recovery..." : "Make your first recovery"}
          </button>
          <Link
            href="/install/shopify"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 bg-[#020617] px-5 font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            Install on Shopify
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">No audit step. No scorecard step. Go straight into the live recovery loop.</p>
      </section>

      <section className="rounded-xl bg-[#0f172a] p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-white">How Abando works</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
          <div>1. Start a recovery test for your store.</div>
          <div>2. Abando sends the recovery through the live path and tracks the return.</div>
          <div>3. Land on your merchant page and see the recovery activity.</div>
        </div>
      </section>

      <section className="rounded-xl bg-[#0f172a] p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Why merchants use it</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          The value moment is simple: recovery goes out, a shopper comes back, and the merchant page shows what changed.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Abando is strongest when the first action is the real loop, not an audit detour.
        </p>
      </section>
    </CenteredContainer>
  );
}
