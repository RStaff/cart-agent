#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🔧 Scaffolding Abando marketing vertical pages..."

# Ensure folders exist
mkdir -p app/marketing/women-boutique
mkdir -p app/marketing/supplements

#############################################
# 1) /marketing/women-boutique
#############################################
cat << 'TSX' > app/marketing/women-boutique/page.tsx
import Link from "next/link";

export default function BoutiqueMarketingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-24 pt-20 lg:flex-row lg:items-center">
        {/* Left: pitch */}
        <div className="max-w-xl">
          <p className="mb-3 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-300/80">
            For women&apos;s boutique Shopify stores
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Recover more lost checkouts for{" "}
            <span className="text-pink-300">
              your boutique apparel shop
            </span>{" "}
            without hiring an agency.
          </h1>
          <p className="mt-5 text-slate-300">
            Abando watches your checkout flow, finds the moments shoppers
            drop off, and automatically runs AI-powered recovery
            campaigns that sound like your brand – not generic spam.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-slate-300">
            <li>• Designed specifically for women&apos;s fashion & lifestyle brands.</li>
            <li>• No-code setup: connect Shopify, pick your tone, and go live.</li>
            <li>• See exactly which campaigns bring shoppers back to checkout.</li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo/playground"
              className="rounded-full bg-pink-500 px-6 py-3 text-sm font-medium text-slate-950 hover:bg-pink-400 transition"
            >
              Try the Abando demo
            </Link>
            <Link
              href="/verticals/women-boutique"
              className="rounded-full border border-slate-600 px-6 py-3 text-sm font-medium text-slate-50 hover:border-slate-300 transition"
            >
              View the boutique growth playbook →
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Perfect for 1–3 person teams running product drops, seasonal
            launches, and repeat customer campaigns.
          </p>
        </div>

        {/* Right: recovery card */}
        <div className="w-full max-w-md rounded-3xl bg-slate-900/70 p-6 shadow-xl ring-1 ring-slate-800">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
            <span>Today&apos;s boutique recovery</span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
              +18% checkout lift
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Abandoned: Cart over $120
                </p>
                <p className="text-[11px] text-slate-400">
                  7 shoppers dropped at shipping step
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="text-slate-400">Recovered</p>
                <p className="font-semibold text-emerald-300">3 orders</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-xs text-slate-300">
              <p className="mb-1 font-medium text-slate-100">
                Example message
              </p>
              <p>
                “Hey Maya, we saved your size in the Rosewood Wrap Dress.
                Checkout today and we&apos;ll include free 2-day shipping
                for this drop.”
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="rounded-full bg-slate-800 px-2 py-1">
                  Channel: SMS + Email
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-1">
                  Matches your boutique&apos;s tone
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom 3-up value props */}
      <section className="border-t border-slate-800 bg-slate-950/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Built for boutique owners, not growth hackers
            </h3>
            <p className="text-sm text-slate-300">
              You don&apos;t need a data team. Abando translates the numbers
              into simple, “here&apos;s what to fix next” insights.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Protect your brand&apos;s voice
            </h3>
            <p className="text-sm text-slate-300">
              Every recovery sequence is tuned to your aesthetic, language,
              and customer relationships — no cringe automations.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              See the lift, not just the messages
            </h3>
            <p className="text-sm text-slate-300">
              Track recovered revenue, cohort performance, and which plays
              move the needle for your boutique&apos;s style of selling.
            </p>
          </div>
        </div>
      </section>

      <p className="pb-8 text-center text-[11px] text-slate-500">
        Today, these pages run on sample data. As we finalize your Shopify
        integration, these same views will be backed by live Abando cart telemetry.
      </p>
    </main>
  );
}
TSX

#############################################
# 2) /marketing/supplements
#############################################
cat << 'TSX' > app/marketing/supplements/page.tsx
import Link from "next/link";

export default function SupplementsMarketingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-24 pt-20 lg:flex-row lg:items-center">
        {/* Left: pitch */}
        <div className="max-w-xl">
          <p className="mb-3 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-300/80">
            For DTC supplements & wellness brands
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Plug the leaks in your{" "}
            <span className="text-emerald-300">checkout &amp; refill funnel.</span>
          </h1>
          <p className="mt-5 text-slate-300">
            Abando watches your funnel in real time and recovers both
            first-time and refill orders with targeted nudges — sent at
            the moment they matter most.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-slate-300">
            <li>• Ideal for brands doing 200–2,000 orders/month on Shopify.</li>
            <li>• Built for stacks, bundles, and subscription refills.</li>
            <li>• See which offers actually protect your CAC and LTV.</li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo/playground"
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition"
            >
              Watch cart recovery demo
            </Link>
            <Link
              href="/verticals/supplements"
              className="rounded-full border border-slate-600 px-6 py-3 text-sm font-medium text-slate-50 hover:border-slate-300 transition"
            >
              See how it fits your funnel →
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Use this as a 60–90 day experiment: wire Abando into your checkout,
            then compare recovered revenue month over month.
          </p>
        </div>

        {/* Right: impact card */}
        <div className="w-full max-w-md rounded-3xl bg-slate-900/70 p-6 shadow-xl ring-1 ring-slate-800">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
            <span>Funnel impact snapshot</span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
              Demo data
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Abandoned checkouts / month
                </p>
              </div>
              <p className="text-right text-base font-semibold text-slate-100">
                180
              </p>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Recovered by Abando
                </p>
              </div>
              <p className="text-right text-base font-semibold text-emerald-300">
                34
              </p>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Extra monthly revenue
                </p>
              </div>
              <p className="text-right text-base font-semibold text-emerald-300">
                $6,720
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom 3-up value props */}
      <section className="border-t border-slate-800 bg-slate-950/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Recover more first-time orders
            </h3>
            <p className="text-sm text-slate-300">
              When shoppers bail at checkout, Abando sends a clean,
              compliant follow-up that reminds them why your product
              solves their problem today.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Protect your refill schedule
            </h3>
            <p className="text-sm text-slate-300">
              Use sequences that nudge subscribers before they run out,
              so you don&apos;t lose them to Amazon or a cheaper competitor.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Stay on-brand and compliant
            </h3>
            <p className="text-sm text-slate-300">
              Guardrails keep messaging aligned with your claims and brand
              voice instead of rogue AI making risky promises.
            </p>
          </div>
        </div>
      </section>

      <p className="pb-8 text-center text-[11px] text-slate-500">
        Today, these pages run on sample data. As we finalize your Shopify
        integration, these same views will be backed by live Abando cart telemetry.
      </p>
    </main>
  );
}
TSX

echo "✅ Marketing vertical pages created:"
echo "   • app/marketing/women-boutique/page.tsx"
echo "   • app/marketing/supplements/page.tsx"
echo
echo "Next:"
echo "  1) npm run dev"
echo "  2) Visit:"
echo "       • http://localhost:3000/marketing/women-boutique"
echo "       • http://localhost:3000/marketing/supplements"
