#!/usr/bin/env bash
set -euo pipefail

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

echo "[demo] Backing up existing ${TARGET} -> ${BACKUP}"
cp "${TARGET}" "${BACKUP}"

cat > "${TARGET}" <<'TSX'
"use client";

import Link from "next/link";

const recoveredSeries = [
  { day: "Mon", date: 7, orders: 7 },
  { day: "Tue", date: 8, orders: 8 },
  { day: "Wed", date: 9, orders: 9 },
  { day: "Thu", date: 10, orders: 10 },
  { day: "Fri", date: 11, orders: 10 },
  { day: "Sat", date: 12, orders: 10 },
  { day: "Sun", date: 13, orders: 9 },
];

export default function DemoPlaygroundPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">

        {/* HEADER */}
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Abando • Merchant daily play
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            See how Abando reads shopper behavior in a single day.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            This demo pretends we&apos;re running a women&apos;s boutique apparel store.
            Abando doesn&apos;t just blast discounts — it watches{" "}
            <span className="font-medium text-slate-100">behavioral patterns</span> and
            responds with the smallest nudge that can recover the order.
          </p>
        </header>

        {/* WHY PATTERNS + HOW IT READS */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200">
              Why break shoppers into patterns at all?
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Not every abandoned cart is the same. Some shoppers are almost ready and just
              need a small nudge. Others are still browsing for ideas. Treating them the same
              either burns margin with too many discounts or leaves revenue on the table.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <span className="font-medium text-slate-100">Better fit:</span>{" "}
                messages match their actual hesitation instead of shouting &quot;10% OFF&quot; at everyone.
              </li>
              <li>
                <span className="font-medium text-slate-100">Less noise:</span>{" "}
                fewer emails and popups, only when behavior really signals intent.
              </li>
              <li>
                <span className="font-medium text-slate-100">Compounding gains:</span>{" "}
                small lifts across several patterns add up to meaningful recovered revenue.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200">
              How Abando reads behavior (without creepy tracking)
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Abando listens to Shopify events you already generate —{" "}
              <span className="font-medium text-slate-100">no extra pixels or heatmap scripts needed.</span>{" "}
              It simply looks at the same signals your team sees in reports, but in real time.
            </p>

            <div className="mt-5 grid gap-4 text-xs text-slate-200 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  1 • Shopify signals
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-200">
                  <li>Added to cart</li>
                  <li>Started checkout</li>
                  <li>Completed order</li>
                  <li>Product &amp; collection tags</li>
                  <li>Campaign / UTM source</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  2 • Behavior patterns
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-200">
                  <li>Last-minute outfit completers</li>
                  <li>Scroll-and-bounce browsers</li>
                  <li>Discount-sensitive returners</li>
                  <li>Routine bundle builders</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  3 • Plays Abando can run
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-200">
                  <li>Reminder emails &amp; SMS</li>
                  <li>On-site &quot;finish the look&quot; prompts</li>
                  <li>Tight, targeted incentives</li>
                  <li>Guardrails to protect margin</li>
                </ul>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-slate-400">
              Think of it less like a heatmap and more like a{" "}
              <span className="font-medium text-slate-200">pattern map</span> of who tends to abandon,
              who tends to come back, and which nudges work best for each group.
            </p>
          </div>
        </section>

        {/* 7-DAY RECOVERED ORDERS + TRUST + RAW SIGNAL SAMPLE */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          {/* Chart + raw signals */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200">
              7-day recovered orders (example boutique)
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              This is the kind of view a merchant sees after Abando has watched a week of traffic —
              not a raw log, but a clear summary of{" "}
              <span className="font-medium text-slate-100">how many orders were saved each day.</span>
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-emerald-400 uppercase">
                    Last 7 days · Recovered revenue
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-emerald-300">
                    $4,980
                  </p>
                  <p className="text-xs text-slate-400">
                    from 63 recovered orders (example data)
                  </p>
                </div>
                <p className="text-xs font-medium text-emerald-300">
                  +18% vs prior 7 days
                </p>
              </div>

              {/* Tiny line / column chart */}
              <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 px-4 pb-4 pt-6">
                <div className="flex h-32 items-end gap-4">
                  {recoveredSeries.map((point) => {
                    const maxOrders = 10; // from our series above
                    const height = (point.orders / maxOrders) * 100;
                    return (
                      <div
                        key={point.day}
                        className="flex flex-1 flex-col items-center justify-end gap-2 text-[11px] text-slate-400"
                      >
                        <div className="flex w-full items-end justify-center">
                          <div
                            className="w-full max-w-[18px] rounded-full bg-emerald-400/80"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <span>{point.day}</span>
                          <span className="text-[10px] text-slate-500">
                            {point.date}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  Under the hood this comes from the same Shopify events you already track —
                  Abando just organizes them into a daily view you can act on.
                </p>
              </div>

              {/* NEW: tiny raw signal sample */}
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Raw signal sample (what Abando actually sees)
                </p>
                <div className="mt-2 grid grid-cols-[auto,auto,auto,1fr] gap-x-4 gap-y-1 text-[11px]">
                  <span className="font-semibold text-slate-300">Time</span>
                  <span className="font-semibold text-slate-300">Event</span>
                  <span className="font-semibold text-slate-300 text-right">
                    Value
                  </span>
                  <span className="font-semibold text-slate-300">Source</span>

                  <span className="text-slate-400">12:03</span>
                  <span className="text-slate-200">checkout_abandoned</span>
                  <span className="text-right text-slate-200">$148.00</span>
                  <span className="text-slate-400">instagram_story</span>

                  <span className="text-slate-400">12:09</span>
                  <span className="text-slate-200">checkout_recovered</span>
                  <span className="text-right text-slate-200">$148.00</span>
                  <span className="text-slate-400">reminder_sms</span>

                  <span className="text-slate-400">12:22</span>
                  <span className="text-slate-200">browse_only</span>
                  <span className="text-right text-slate-200">$0.00</span>
                  <span className="text-slate-400">direct</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Abando doesn&apos;t read mouse movements or biometrics — it just turns logs
                  like this into patterns and daily recovered-revenue views.
                </p>
              </div>
            </div>
          </div>

          {/* Trust & next steps */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-700/60 bg-emerald-900/10 p-5">
              <h3 className="text-sm font-semibold text-emerald-200">
                Why boutiques trust this playbook
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-emerald-50/90">
                <li>Patterns are trained on real ecommerce journeys.</li>
                <li>Plays use behavioral psychology, not hype or dark patterns.</li>
                <li>Guardrails keep copy on-brand so you don&apos;t sound like every other AI popup.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-semibold text-slate-200">
                What most merchants do next
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Start with the vertical playbook that looks closest to your store, then connect
                Shopify so Abando can{" "}
                <span className="font-medium text-slate-100">watch a week of real traffic</span>{" "}
                before you turn anything on.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/marketing/women-boutique/playbook"
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-pink-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-pink-400"
                >
                  See the full boutique growth plan
                </Link>
                <Link
                  href="/marketing/supplements/playbook"
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-900"
                >
                  See supplements playbook
                </Link>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                When Abando is installed, this view becomes your daily dashboard:
                which behaviors are firing, which plays are winning, and where to test the next improvement.
              </p>
            </div>
          </div>
        </section>

        {/* PATTERN CARDS */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Today&apos;s three key patterns in this boutique demo
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Names are for clarity, not jargon. Each pattern is just a different kind of hesitation
            Abando knows how to respond to.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-700/60 bg-slate-900/70 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Pattern 1 • Outfit completers
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                &quot;Almost-ready&quot; shoppers
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                They add 2–3 items (top, jeans, maybe a jacket), reach checkout, then stall.
                They&apos;re not browsing — they&apos;re building a specific look.
              </p>
              <p className="mt-3 text-xs text-emerald-200">
                Abando response: gentle reminder like{" "}
                <span className="italic">
                  &quot;Your look is still in your bag — want to finish checking out?&quot;
                </span>{" "}
                before offering any discount.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-700/60 bg-slate-900/70 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
                Pattern 2 • Idea browsers
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                Scroll-and-bounce visitors
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                They view several collections, maybe tap a size filter, but leave without
                starting checkout. They&apos;re still deciding what style feels right.
              </p>
              <p className="mt-3 text-xs text-sky-200">
                Abando response: waits for a clear intent signal (like adding to cart) before
                messaging them, avoiding spammy follow-ups that reduce trust.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-700/60 bg-slate-900/70 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                Pattern 3 • Value checkers
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                Discount-sensitive returners
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                They come back multiple times to the same items, often through email clicks
                or campaigns, and pause at shipping or total price.
              </p>
              <p className="mt-3 text-xs text-amber-200">
                Abando response: reserves small, time-bound incentives for this group only —
                so you protect margin while still saving the right orders.
              </p>
            </div>
          </div>
        </section>

        {/* DETECTION FAQ + NEXT STEP */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200">
              How does Abando actually detect these patterns?
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Under the hood, Abando is just doing disciplined, repeated analysis of the signals
              Shopify already gives you — <span className="font-medium text-slate-100">
              no dark patterns, no biometric guessing.
              </span>
            </p>

            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  What inputs does Abando use?
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  <li>Cart and checkout events from Shopify.</li>
                  <li>Which products / collections were in the cart.</li>
                  <li>Whether the shopper comes back and completes later (and how often).</li>
                  <li>Whether they come from campaigns, email, or direct.</li>
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  What it doesn&apos;t do
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  <li>No mouse-position heatmaps.</li>
                  <li>No &quot;creepy&quot; tracking outside your store.</li>
                  <li>No psychological tricks that mislead customers.</li>
                  <li>
                    Just consistent, explainable patterns you can see in your own data.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200">
              Next step: pick the vertical playbook that fits you best.
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              In a real store, Abando would watch a week of traffic, then show you which patterns
              are most common before suggesting plays. From there, you decide when each flow goes live.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/marketing/women-boutique/playbook"
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-pink-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-pink-400"
              >
                See the boutique growth plan
              </Link>
              <Link
                href="/marketing/supplements/playbook"
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                See the supplements playbook
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
TSX

echo "[demo] New /demo/playground with raw signal sample written to ${TARGET}"
