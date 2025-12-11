#!/usr/bin/env bash
set -euo pipefail

# Always run from repo root (abando-frontend)
cd "$(dirname "$0")/.."

FILE="app/embedded/page.tsx"
BACKUP="app/embedded/page.tsx.before_embedded_reset_$(date +%s).tsx"

if [ -f "$FILE" ]; then
  cp "$FILE" "$BACKUP"
  echo "💾 Backup written to: $BACKUP"
fi

cat <<'TSX' > "$FILE"
"use client";

import Image from "next/image";
import { useState } from "react";

type Day = {
  id: string;
  label: string;
  orders: number;
  revenue: string;
  pattern: string;
  whatHappened: string;
  howAbandoHelps: string;
};

const DAYS: Day[] = [
  {
    id: "mon",
    label: "Mon · 3 orders",
    orders: 3,
    revenue: "$345 demo revenue",
    pattern: "Cart parkers",
    whatHappened:
      "Shoppers added 1–2 items, then bounced while thinking about total spend and fit.",
    howAbandoHelps:
      "Sends a gentle nudge like “Still love this look?” with social proof instead of a generic 10% off blast.",
  },
  {
    id: "tue",
    label: "Tue · 5 orders",
    orders: 5,
    revenue: "$560 demo revenue",
    pattern: "Size checkers",
    whatHappened:
      "Shoppers bounced between size charts and product pages, worried about fit and returns.",
    howAbandoHelps:
      "Leads with sizing confidence (fit reviews, photos, try-at-home messaging) instead of pure discounts.",
  },
  {
    id: "wed",
    label: "Wed · 6 orders",
    orders: 6,
    revenue: "$690 demo revenue",
    pattern: "Outfit builders",
    whatHappened:
      "Shoppers built full outfits in the cart, then stalled right before checkout.",
    howAbandoHelps:
      "Uses saved-cart reminders and “finish the look” bundles to pull full outfits across the line.",
  },
  {
    id: "thu",
    label: "Thu · 5 orders",
    orders: 5,
    revenue: "$575 demo revenue",
    pattern: "Last-minute browsers",
    whatHappened:
      "Shoppers compared a few looks, then left to check budgets or talk to a friend.",
    howAbandoHelps:
      "Time-boxed reminders that bring them back to the exact items they were considering.",
  },
  {
    id: "fri",
    label: "Fri · 7 orders",
    orders: 7,
    revenue: "$810 demo revenue",
    pattern: "Payday shoppers",
    whatHappened:
      "Interest built all week, then shoppers came back right after pay hits.",
    howAbandoHelps:
      "Lines up reminders and onsite nudges around payday so interest turns into completed orders.",
  },
  {
    id: "sat",
    label: "Sat · 8 orders",
    orders: 8,
    revenue: "$920 demo revenue",
    pattern: "Drop watchers",
    whatHappened:
      "Shoppers were waiting on low-stock and restock cues before checking out.",
    howAbandoHelps:
      "Urgency plays tied to low-stock sizes and “last chance for this weekend” messaging.",
  },
  {
    id: "sun",
    label: "Sun · 8 orders",
    orders: 8,
    revenue: "$910 demo revenue",
    pattern: "Window shoppers",
    whatHappened:
      "Weekend browsers compared outfits and saved items for “later” without a trigger to buy.",
    howAbandoHelps:
      "Pulls liked and carted items into a single reminder with clear reasons to buy now.",
  },
];

const WEEKLY_ORDERS = DAYS.reduce((sum, d) => sum + d.orders, 0);
const WEEKLY_REVENUE = 5040; // demo roll-up used in the copy

export default function EmbeddedAbandoDashboardPage() {
  const [activeDayId, setActiveDayId] = useState<Day["id"]>("sat");
  const activeDay = DAYS.find((d) => d.id === activeDayId) ?? DAYS[0];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HEADER */}
      <section className="border-b border-slate-900/60 bg-slate-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-500/40">
              <Image
                src="/abando-logo.png"
                alt="Abando"
                width={22}
                height={20}
                priority
              />
            </div>
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Abando dashboard
              </p>
              <p className="text-xs text-slate-300">
                Live view of recovered orders and shopper patterns for your store.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[0.65rem] uppercase tracking-[0.26em] text-slate-500">
              Embedded in
            </span>
            <Image
              src="/shopify_monotone_white.svg"
              alt="Shopify"
              width={80}
              height={26}
              className="opacity-90"
            />
          </div>
        </div>
      </section>

      {/* TOPLINE IMPACT STRIP */}
      <section className="border-b border-slate-900/60 bg-slate-950/80">
        <div className="mx-auto grid max-w-5xl gap-4 px-6 py-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 to-emerald-500/0 px-4 py-4 text-sm shadow-[0_0_40px_rgba(16,185,129,0.35)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
              Recovered revenue · 7 days
            </p>
            <p className="mt-2 text-xl font-semibold text-emerald-100">
              ${WEEKLY_REVENUE.toLocaleString()}
            </p>
            <p className="mt-1 text-[0.78rem] text-emerald-100/80">
              Revenue that would have been lost without Abando&apos;s plays.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Extra orders · 7 days
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-50">
              {WEEKLY_ORDERS}+ orders
            </p>
            <p className="mt-1 text-[0.8rem] text-slate-300">
              Small daily lifts that add up across Cart Parkers, Size Checkers,
              and Drop Watchers.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Psychological impact
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-50">
              ~1 extra day of sales
            </p>
            <p className="mt-1 text-[0.8rem] text-slate-300">
              At this pace, each week feels like adding another full day of
              revenue without buying more traffic.
            </p>
          </div>
        </div>
      </section>

      {/* PATTERN SUMMARY + WEEKLY SNAPSHOT */}
      <section className="bg-slate-950">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,2.4fr)]">
          {/* Left: Patterns summary */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">
              1 · What Abando is seeing this week
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Instead of one big “abandoned” bucket, Abando groups sessions into
              hesitation types. That makes it clear where your extra orders are
              really coming from.
            </p>

            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Pattern · Cart parkers
                </p>
                <p className="mt-1 text-[0.8rem] text-slate-200">
                  &quot;I like it… I just need to think.&quot;
                </p>
                <p className="mt-2">
                  Shoppers parking outfits in the cart while they think about fit and
                  total spend. Abando leans on reassurance and styling ideas instead
                  of heavier discounts.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Pattern · Size checkers
                </p>
                <p className="mt-1 text-[0.8rem] text-slate-200">
                  &quot;I&apos;ll buy once I&apos;m sure it fits.&quot;
                </p>
                <p className="mt-2">
                  Sessions full of size charts, reviews, and returns policy checks.
                  Abando responds with fit proof and low-friction returns language.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Pattern · Drop watchers
                </p>
                <p className="mt-1 text-[0.8rem] text-slate-200">
                  &quot;I&apos;m waiting for the right moment.&quot;
                </p>
                <p className="mt-2">
                  Shoppers hovering around low-stock items or new arrivals. Abando
                  uses light urgency and “last chance for this collection” messages
                  instead of shouting promos at everyone.
                </p>
              </div>
            </div>
          </div>

          {/* Right: 7-day interactive snapshot */}
          <div className="rounded-3xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-slate-950 to-emerald-500/0 p-6 shadow-[0_0_55px_rgba(16,185,129,0.35)] lg:p-7">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-300/90">
              2 · 7-day recovered orders snapshot
            </p>
            <p className="mt-2 text-sm text-emerald-100/90">
              Demo data, same logic as your live account: small lifts every day
              that add up to a clear weekly impact.
            </p>

            {/* Weekly impact headline */}
            <div className="mt-4 rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-300">
                Weekly impact
              </p>
              <p className="mt-2 text-base font-semibold text-emerald-50">
                {WEEKLY_ORDERS}+ extra orders and just over ${WEEKLY_REVENUE.toLocaleString()} in
                recovered revenue in 7 days.
              </p>
              <p className="mt-2 text-[0.8rem] text-emerald-100/90">
                That&apos;s like adding an extra day of sales each week—without buying
                more traffic or cranking up promo codes.
              </p>
            </div>

            {/* Day pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const isActive = day.id === activeDayId;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onMouseEnter={() => setActiveDayId(day.id)}
                    onFocus={() => setActiveDayId(day.id)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-[0.7rem] font-medium",
                      "transition-colors duration-150",
                      isActive
                        ? "border-emerald-400/80 bg-emerald-500/15 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                        : "border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-900",
                    ].join(" ")}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>

            {/* Active day highlight */}
            <div className="mt-5 rounded-2xl border border-emerald-500/60 bg-slate-950/70 p-4 text-sm lg:p-5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Highlight of the day
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-50">
                {activeDay.label}: {activeDay.orders} recovered orders (
                {activeDay.revenue})
              </p>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Shopper pattern
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-50">
                    {activeDay.pattern}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {activeDay.whatHappened}
                  </p>
                </div>

                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    What&apos;s really going on
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {activeDay.whatHappened}
                  </p>
                </div>

                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    How Abando gets them back
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {activeDay.howAbandoHelps}
                  </p>
                </div>
              </div>
            </div>

            {/* Alignment note with the demo */}
            <p className="mt-4 text-[0.7rem] text-slate-400">
              This view is designed to line up with what you saw in the Abando demo
              wherever it makes sense—same patterns, same recovered-orders math—
              but using your real storefront data.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
TSX

echo "✅ app/embedded/page.tsx reset to canonical embedded dashboard v1."
