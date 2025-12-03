"use client";

import React, { useState } from "react";
import { MerchantDailyPlayPanel } from "@/components/MerchantDailyPlayPanel";

const API_BASE =
  process.env.NEXT_PUBLIC_ABANDO_API_BASE ?? "https://pay.abando.ai";

export default function PlaygroundPage() {
  const [storeId, setStoreId] = useState("cart-agent-dev.myshopify.com");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:px-8">
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Live demo
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Abando Merchant Daily Play
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            This playground pulls live segments and recommendations from the
            Abando API and shows you what the merchant dashboard surfaces as
            today&apos;s #1 play.
          </p>
        </header>

        <section className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:p-5">
          <label className="text-xs font-medium text-slate-300">
            Store ID or Shopify domain
          </label>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            placeholder="dev-store or my-shop.myshopify.com"
          />
          <p className="text-[11px] text-slate-500">
            Tip: use{" "}
            <code className="rounded bg-slate-900 px-1 py-[1px]">
              cart-agent-dev.myshopify.com
            </code>{" "}
            during testing.
          </p>
        </section>

        <MerchantDailyPlayPanel storeId={storeId} apiBase={API_BASE} />
      </div>
    </main>
  );
}
