'use client';

import { useState } from 'react';
import MerchantDailyPlayPanel from '@/components/MerchantDailyPlayPanel';

const API_BASE =
  process.env.NEXT_PUBLIC_ABANDO_API_BASE ??
  process.env.NEXT_PUBLIC_API_BASE ??
  'https://pay.abando.ai';

export default function DemoPlaygroundPage() {
  const [storeId, setStoreId] = useState('cart-agent-dev.myshopify.com');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-2 border-b border-slate-800 pb-4">
          <h1 className="text-xl font-semibold tracking-tight">
            Merchant Daily Play – Live Segments
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            This playground pulls live segments and recommendations from the
            Abando API and shows what you’d see inside the merchant dashboard.
          </p>
        </header>

        <section className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <label className="text-xs font-medium text-slate-300">
            Store ID or Shopify domain
          </label>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            placeholder="dev-store or my-shop.myshopify.com"
          />
          <div className="text-[11px] text-slate-500">
            Tip:{' '}
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
