#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🔧 Scaffolding Vertical Growth Engine page…"

mkdir -p app/verticals

cat << 'TSX' > app/verticals/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Abando Vertical Growth Engine",
};

export default function VerticalGrowthEnginePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <header className="mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] text-emerald-400 uppercase mb-3">
            Abando · Vertical Growth Engine
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">
            One engine, tuned for each checkout funnel.
          </h1>
          <p className="text-slate-300 max-w-2xl">
            Abando watches your checkout data, groups shoppers into clean
            cohorts, and runs on-brand recovery plays that fit how{" "}
            <span className="font-semibold">your</span> brand sells — not some
            generic “abandoned cart” blast.
          </p>
        </header>

        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-2">
              1 · Telemetry & cohorts
            </h3>
            <p className="text-sm text-slate-300">
              Abando quietly sits between checkout and your marketing tools,
              tracking which visitors browse, bail, or buy — without needing you
              to babysit dashboards.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-2">
              2 · Vertical playbooks
            </h3>
            <p className="text-sm text-slate-300">
              Each vertical ships with default segments and plays — so boutique,
              supplements, and future verticals all start from battle-tested
              setups, not a blank canvas.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-2">
              3 · Daily “what to run” guidance
            </h3>
            <p className="text-sm text-slate-300">
              The engine summarizes what moved the needle and surfaces a short
              list of recommended plays to run next, in plain language the team
              can act on.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Verticals we support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/verticals/women-boutique"
              className="block bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-pink-400 transition-colors"
            >
              <p className="text-xs text-pink-400 mb-2">
                Live · Women&apos;s boutique Shopify stores
              </p>
              <h3 className="font-semibold mb-2">Boutique apparel</h3>
              <p className="text-sm text-slate-300 mb-4">
                Turn &quot;just browsing&quot; into repeat dress & basics buyers
                with plays tuned to small, curated catalogs.
              </p>
              <span className="text-sm font-semibold text-pink-300">
                View boutique Vertical Growth Engine →
              </span>
            </Link>

            <Link
              href="/verticals/supplements"
              className="block bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:border-emerald-400 transition-colors"
            >
              <p className="text-xs text-emerald-400 mb-2">
                Live · DTC supplements & wellness brands
              </p>
              <h3 className="font-semibold mb-2">Supplements & wellness</h3>
              <p className="text-sm text-slate-300 mb-4">
                Recover first-time checkouts and keep refill schedules on track
                with stack-friendly plays.
              </p>
              <span className="text-sm font-semibold text-emerald-300">
                View supplements Vertical Growth Engine →
              </span>
            </Link>

            <div className="bg-slate-900/40 border border-dashed border-slate-700 rounded-xl p-6">
              <p className="text-xs text-slate-500 mb-2">
                Coming soon · Additional verticals
              </p>
              <h3 className="font-semibold mb-2">Your vertical here</h3>
              <p className="text-sm text-slate-300 mb-4">
                B2B SaaS, beauty, or something niche? Abando&apos;s engine can
                be tuned to your funnel with a dedicated playbook.
              </p>
              <p className="text-xs text-slate-500">
                Talk to us to get early access when we open the next cohort.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 flex flex-col md:flex-row gap-4 items-center">
          <Link
            href="/demo/playground"
            className="inline-flex items-center justify-center bg-emerald-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-emerald-300 transition-colors w-full md:w-auto"
          >
            View live demo
          </Link>

          <p className="text-xs text-slate-400 max-w-md">
            Today, these pages run on sample data. As we finalize your Shopify
            integration, the same engine view will be backed by live Abando cart
            telemetry.
          </p>
        </section>
      </div>
    </main>
  );
}
TSX

echo "✅ Vertical Growth Engine page created at app/verticals/page.tsx"
echo "Next: npm run dev and open http://localhost:3000/verticals"
