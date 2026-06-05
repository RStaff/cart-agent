"use client";

import { useState } from "react";
import Link from "next/link";
import PublicHeader from "@/components/brand/PublicHeader";
import CenteredContainer from "@/components/layout/CenteredContainer";

type MarketingLandingPageProps = {
  shop?: string;
  parentBrand?: string;
};

export function MarketingLandingPage({ shop = "", parentBrand = "StaffordMedia" }: MarketingLandingPageProps) {
  return (
    <CenteredContainer>
      <PublicHeader shop={shop} />

      <section className="rounded-2xl border border-cyan-400/15 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(135deg,_#0f172a_0%,_#0b1f2d_55%,_#10283a_100%)] p-6">
        <div className="inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
          {parentBrand} presents ShopiFixer
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
          ShopiFixer Fix Sprint · $950 flat fee
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Start with one visible Shopify conversion issue, get the before/after proof package, and move into a scoped fix sprint with the existing secure checkout path.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/shopifixer"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
          >
            Start the ShopiFixer Fix Sprint
          </Link>
          <Link
            href="/install/shopify"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 bg-[#020617] px-5 font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            Use Abando recovery later
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">ShopiFixer is the first commercial answer. Abando remains available as the secondary recovery product.</p>
      </section>

      <section className="rounded-xl bg-[#0f172a] p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-white">How ShopiFixer works</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
          <div>1. Start with the ShopiFixer offer and the single issue to fix.</div>
          <div>2. Review the audit result and before/after proof.</div>
          <div>3. Continue to pricing, checkout, and the existing payment path.</div>
        </div>
      </section>

      <section className="rounded-xl bg-[#0f172a] p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Why merchants start here</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          The value moment is simple: one visible conversion issue, a scoped fix sprint, and proof of what changed before you choose the next step.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Abando stays available for merchants who want the recovery product after the ShopiFixer path.
        </p>
      </section>
    </CenteredContainer>
  );
}
