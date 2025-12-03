'use client';

import React, { useState } from 'react';
import { MerchantDailyPlayPanel } from '@/components/MerchantDailyPlayPanel';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'https://pay.abando.ai';

export default function PlaygroundPage() {
  const [storeId, setStoreId] = useState('cart-agent-dev.myshopify.com');

  return (
    <main className="min-h-screen bg-black text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
        <header className="border-b border-slate-800 pb-3">
          <h1 className="text-lg font-semibold tracking-tight">
            Abando.ai · Merchant Daily Play (Live API Demo)
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            This page pulls directly from your{' '}
            <code className="rounded bg-slate-900 px-1 py-[1px] text-[11px]">
              /api/ai-segments/:storeId
            </code>{' '}
            endpoint on <code>{API_BASE}</code>.
          </p>
        </header>

        <section className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Store ID
            </label>
            <input
              className="w-full rounded-md border border-slate-700 bg-black px-2 py-1 font-mono text-[11px] text-slate-100 outline-none focus:border-amber-400"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              placeholder="dev-store or my-shop.myshopify.com"
            />
          </div>
          <div className="text-[11px] text-slate-500">
            Tip: use{' '}
            <code className="rounded bg-slate-900 px-1 py-[1px]">
              cart-agent-dev.myshopify.com
            </code>{' '}
            during testing.
          </div>
        </section>

        <MerchantDailyPlayPanel storeId={storeId} apiBase={API_BASE} />
      </div>
    </main>
  );
}
