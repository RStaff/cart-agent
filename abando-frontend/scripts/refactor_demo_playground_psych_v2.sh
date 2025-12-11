#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

TARGET="app/demo/playground/page.tsx"

# Backup existing demo page if present
if [ -f "$TARGET" ]; then
  ts="$(date +%Y%m%d-%H%M%S)"
  cp "$TARGET" "${TARGET}.bak-${ts}"
  echo "[demo] Backed up existing ${TARGET} -> ${TARGET}.bak-${ts}"
fi

cat << 'TSX' > "$TARGET"
"use client";

import Link from "next/link";

type Segment = {
  id: string;
  label: string;
  behavior: string;
  whatAbandoSees: string;
  whatAbandoDoes: string;
  whyItWorks: string;
};

const segments: Segment[] = [
  {
    id: "dress-exit",
    label: "High-intent dress shopper exits",
    behavior:
      "Visitor spends 3+ minutes on a dress detail page, adds to cart, then closes the tab.",
    whatAbandoSees:
      "High-intent session on a mid–high AOV item, no discount abuse history, exit without checkout.",
    whatAbandoDoes:
      "Queues a gentle, time-boxed reminder with a small incentive that references the specific dress and use case.",
    whyItWorks:
      "Uses commitment & consistency – they already pictured themselves wearing it. The nudge removes friction instead of shouting a big sale.",
  },
  {
    id: "routine-abandon",
    label: "Skincare routine half-complete",
    behavior:
      "Customer adds cleanser + toner from your routine bundle, then drops off before adding moisturizer.",
    whatAbandoSees:
      "Partial bundle in cart from a known customer who previously bought from your 'glow' collection.",
    whatAbandoDoes:
      "Triggers a 'complete your routine' message featuring the missing step, not a random product.",
    whyItWorks:
      "Leans on completion bias – people dislike leaving sets unfinished more than they like a generic discount.",
  },
  {
    id: "discount-hunter",
    label: "Tab-hopper looking for codes",
    behavior:
      "Visitor adds 3+ items, opens multiple new tabs, scrolls your shipping/returns page, then stalls.",
    whatAbandoSees:
      "High cart value with strong purchase intent, but patterns consistent with comparison and discount hunting.",
    whatAbandoDoes:
      "Offers free shipping or a modest perk instead of a deep blanket discount and emphasizes risk-free returns.",
    whyItWorks:
      "Uses loss aversion – 'do not miss free shipping on this order' beats training them to wait for 30% off every time.",
  },
];

const summaryStats = {
  todayRecovered: "$732",
  weekRecovered: "$4,980",
  playsRunning: 3,
};

export default function DemoPlaygroundPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-12">
        {/* HEADER ROW */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-pink-400">
              Live behavior → Daily plays
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              See how Abando reacts to real shoppers, not just open rates.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300">
              This demo shows the daily rhythm your team will see: which shopper
              behaviors Abando flags, what it does in response, and why those
              plays work for your vertical.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-600/60 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-100 lg:mt-0 lg:max-w-xs">
            <p className="font-semibold text-emerald-300">
              Why boutiques and supplements brands trust this playbook
            </p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Patterns are trained on thousands of real ecommerce journeys.</li>
              <li>
                Plays use proven behavioral psychology, not hype or guesswork.
              </li>
              <li>
                Guardrails keep copy on-brand so you do not sound like every
                other AI popup.
              </li>
            </ul>
          </div>
        </header>

        {/* MAIN GRID */}
        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.3fr)] items-start">
          {/* LEFT: SEGMENT CARDS */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                Today&apos;s behavior stream
              </h2>
              <p className="text-xs text-slate-400">
                Each row is a pattern Abando responds to automatically.
              </p>
            </div>

            <div className="space-y-4">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-pink-400 mb-1.5">
                    Shopper pattern
                  </p>
                  <h3 className="text-sm font-semibold text-slate-50 mb-2">
                    {segment.label}
                  </h3>
                  <p className="text-xs text-slate-300 mb-3">
                    {segment.behavior}
                  </p>

                  <div className="grid gap-3 text-xs text-slate-200 sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800/80">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1.5">
                        What Abando notices
                      </p>
                      <p className="text-[11px] text-slate-200">
                        {segment.whatAbandoSees}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800/80">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1.5">
                        Play it fires
                      </p>
                      <p className="text-[11px] text-slate-200">
                        {segment.whatAbandoDoes}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-emerald-700/60 bg-emerald-950/40 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300 mb-1.5">
                      Why this works (behavioral insight)
                    </p>
                    <p className="text-[11px] text-emerald-50">
                      {segment.whyItWorks}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: STATS + AUTHORITY + NEXT STEPS */}
          <aside className="space-y-4">
            {/* IMPACT CARD */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
                Impact snapshot (example boutique)
              </p>
              <div className="flex items-baseline gap-3">
                <p className="text-2xl font-semibold text-emerald-300">
                  {summaryStats.todayRecovered}
                </p>
                <p className="text-xs text-slate-400">
                  recovered today from abandoned carts
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {summaryStats.weekRecovered} in the last 7 days from{" "}
                {summaryStats.playsRunning} always-on plays.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                <li>• No one on the team sent these one by one.</li>
                <li>• Incentives auto-adjust based on shopper behavior.</li>
                <li>• You can pause or edit any play in a few clicks.</li>
              </ul>
            </div>

            {/* AUTHORITY / TRUST CARD */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
                Built from real boutique and supplements brands
              </p>
              <p className="text-xs text-slate-300 mb-2">
                The play patterns here come from observing thousands of sessions
                across fashion, beauty, and wellness stores—not from a generic
                AI template library.
              </p>
              <p className="text-[11px] text-slate-400">
                You keep full control: Abando suggests the next play, you decide
                when it goes live.
              </p>
            </div>

            {/* NEXT STEP CTA */}
            <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                What most merchants do next
              </p>
              <p className="text-xs text-slate-300">
                Start with the vertical playbook that looks closest to your
                store, then connect Shopify so Abando can watch a week of real
                traffic before you turn anything on.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/marketing/women-boutique/playbook"
                  className="inline-flex items-center justify-center rounded-lg bg-pink-500 px-4 py-2.5 text-xs font-semibold text-black hover:bg-pink-400"
                >
                  See the full boutique growth plan
                </Link>
                <Link
                  href="/marketing/supplements/playbook"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-100 hover:bg-slate-900"
                >
                  See supplements playbook
                </Link>
              </div>

              <p className="text-[11px] text-slate-400">
                When Abando is installed, this view becomes your daily
                dashboard: which behaviors are firing, which plays are winning,
                and where to test the next improvement.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
TSX

echo "[demo] New psych-focused /demo/playground written to ${TARGET}"
echo "[demo] Now run: npm run dev and open http://localhost:3000/demo/playground"
