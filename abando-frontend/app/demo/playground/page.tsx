'use client';

import { useState } from 'react';
import { MerchantDailyPlayPanel } from '@/components/MerchantDailyPlayPanel';

const API_BASE = process.env.NEXT_PUBLIC_ABANDO_API_BASE || '';

export default function MerchantDailyPlaygroundPage() {
  const [storeId, setStoreId] = useState('cart-agent-dev.myshopify.com');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-emerald-300">
            Abando Merchant Daily Play – Live Demo
          </h1>
          <p className="max-w-3xl text-sm text-slate-300">
            This playground pulls live segments and recommendations from the Abando API
            and shows what you’d see inside the merchant dashboard.
          </p>
        </header>

        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
          <label className="text-xs font-medium text-slate-300">
            Store ID or Shopify domain
          </label>
          <input
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            placeholder="dev store or my-shop.myshopify.com"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Tip:{' '}
            <code className="rounded bg-slate-950 px-1 py-[1px]">
              cart-agent-dev.myshopify.com
            </code>{' '}
            during testing.
          </p>
        </section>

        <section className="rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-4 shadow-lg">
          <MerchantDailyPlayPanel storeId={storeId} apiBase={API_BASE} />
        </section>
      </div>
    </main>
  );
}
