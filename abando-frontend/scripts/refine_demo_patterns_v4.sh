#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

echo "[demo] Backing up existing ${TARGET} -> ${BACKUP}"
cp "${TARGET}" "${BACKUP}"

cat <<'TSX' > "${TARGET}"
"use client";

import Link from "next/link";

export default function DemoPlaygroundPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
          Abando · Merchant Daily Play
        </p>

        {/* Hero */}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          See how Abando reads shopper behavior in a single day.
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          This demo pretends we&apos;re running a women&apos;s boutique apparel store.
          Abando doesn&apos;t just blast discounts — it watches{" "}
          <span className="font-semibold text-slate-100">behavioral patterns</span>{" "}
          and responds with the smallest nudge that can recover the order.
        </p>

        {/* Why patterns + How it reads behavior */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold text-slate-100">
              Why break shoppers into patterns at all?
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Not every abandoned cart is the same. Some shoppers are almost ready
              and just need a small nudge. Others are still browsing for ideas.
              Treating them the same either burns margin with too many discounts
              or leaves revenue on the table.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>
                <span className="font-semibold">Better fit:</span> messages match
                their actual hesitation instead of shouting &quot;10% OFF&quot; at
                everyone.
              </li>
              <li>
                <span className="font-semibold">Less noise:</span> fewer emails and
                popups, only when behavior really signals intent.
              </li>
              <li>
                <span className="font-semibold">Compounding gains:</span> small lifts
                across several patterns add up to meaningful recovered revenue.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold text-slate-100">
              How Abando reads behavior (without creepy tracking)
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Abando listens to Shopify events you already generate —{" "}
              <span className="font-semibold">no extra pixels or heatmap scripts</span>{" "}
              needed. It simply looks at the same signals your team sees in reports,
              but in real time.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                  1 · Shopify signals
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <li>Added to cart</li>
                  <li>Started checkout</li>
                  <li>Completed order</li>
                  <li>Product &amp; collection tags</li>
                  <li>Campaign / UTM source</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  2 · Behavior patterns
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <li>Outfit builders who pause</li>
                  <li>Scroll-and-bounce browsers</li>
                  <li>Discount-checking returners</li>
                  <li>Routine bundle builders</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-300">
                  3 · Plays Abando can run
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <li>Reminder emails &amp; SMS</li>
                  <li>On-site &quot;finish the look&quot; prompts</li>
                  <li>Tight, targeted incentives</li>
                  <li>Guardrails to protect margin</li>
                </ul>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Think of it less like a heatmap and more like a{" "}
              <span className="font-semibold text-slate-200">pattern map</span> of
              who tends to abandon, who tends to come back, and which nudges work
              best for each group.
            </p>
          </section>
        </div>

        {/* 7-day recovered orders + raw signals + trust box */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold text-slate-100">
              7-day recovered orders (example boutique)
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              This is the kind of view a merchant sees after Abando has watched a
              week of traffic — not a raw log, but a clear summary of{" "}
              <span className="font-semibold">how many orders were saved each day</span>.
            </p>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Last 7 days · Recovered revenue
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-300">$4,980</p>
                <p className="text-xs text-slate-400">
                  from 63 recovered orders (example data)
                </p>
              </div>
              <p className="text-xs font-semibold text-emerald-300">
                +18% vs prior 7 days
              </p>
            </div>

            {/* Simple faux chart */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 px-5 pb-6 pt-4">
              <div className="h-28">
                <div className="flex h-full items-end gap-3">
                  {[
                    { label: "Mon", value: 7 },
                    { label: "Tue", value: 8 },
                    { label: "Wed", value: 9 },
                    { label: "Thu", value: 10 },
                    { label: "Fri", value: 10 },
                    { label: "Sat", value: 10 },
                    { label: "Sun", value: 9 },
                  ].map((d) => (
                    <div
                      key={d.label}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div className="flex-1 w-full rounded-full bg-slate-800/70">
                        <div
                          className="w-full rounded-full bg-emerald-400/80"
                          style={{ height: `${20 + d.value * 4}px` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">{d.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Under the hood this comes from the same Shopify events you already
                track — Abando just organizes them into a daily view you can act on.
              </p>
            </div>

            {/* Raw signal sample */}
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Raw signal sample (what Abando actually sees)
              </p>
              <div className="mt-3 grid grid-cols-[80px_1fr_90px_110px] gap-3 text-[11px] text-slate-200">
                <p className="text-slate-400">Time</p>
                <p className="text-slate-400">Event</p>
                <p className="text-slate-400">Value</p>
                <p className="text-slate-400">Source</p>

                <p>12:03</p>
                <p>checkout_abandoned</p>
                <p>$148.00</p>
                <p>instagram_story</p>

                <p>12:09</p>
                <p>checkout_recovered</p>
                <p>$148.00</p>
                <p>reminder_sms</p>

                <p>12:22</p>
                <p>browse_only</p>
                <p>$0.00</p>
                <p>direct</p>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Abando doesn&apos;t read mouse movements or biometrics — it just turns
                logs like this into patterns and daily recovered-revenue views.
              </p>
            </div>
          </section>

          {/* Trust + next actions */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-emerald-700/70 bg-emerald-950/40 p-5">
              <h2 className="text-sm font-semibold text-emerald-200">
                Why boutiques trust this playbook
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-emerald-50/90">
                <li>Patterns are trained on real ecommerce journeys.</li>
                <li>Plays use behavioral psychology, not hype or dark patterns.</li>
                <li>
                  Guardrails keep copy on-brand so you don&apos;t sound like every other
                  AI popup.
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-sm font-semibold text-slate-100">
                What most merchants do next
              </h2>
              <p className="mt-3 text-sm text-slate-300">
                Start with the vertical playbook that looks closest to your store,
                then connect Shopify so Abando can{" "}
                <span className="font-semibold text-slate-100">
                  watch a week of real traffic
                </span>{" "}
                before you turn anything on.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href="/marketing/women-boutique/playbook"
                  className="inline-flex items-center justify-center rounded-lg bg-pink-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-pink-400"
                >
                  See the full boutique growth plan
                </Link>
                <Link
                  href="/marketing/supplements/playbook"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-900"
                >
                  See supplements playbook
                </Link>
              </div>

              <p className="mt-3 text-[11px] text-slate-400">
                When Abando is installed, this view becomes your daily dashboard:
                which behaviors are firing, which plays are winning, and where to
                test the next improvement.
              </p>
            </section>
          </div>
        </div>

        {/* Patterns row with refined copy */}
        <section className="mt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Today&apos;s three key patterns in this boutique demo
          </p>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Names are for clarity, not jargon. Each pattern is just a different kind
            of hesitation Abando knows how to respond to.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {/* Pattern 1 */}
            <div className="rounded-2xl border border-emerald-700/60 bg-emerald-950/30 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Pattern 1 · Outfit completers
              </p>
              <h3 className="mt-2 text-base font-semibold text-emerald-50">
                “Ready-but-paused” shoppers
              </h3>

              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                What&apos;s really going on
              </p>
              <p className="mt-1 text-sm text-emerald-50/90">
                They add 2–3 items (top, jeans, maybe a jacket), reach checkout, then
                stall. They&apos;re not browsing — they&apos;re building a specific look and
                already picture themselves wearing it, but one small friction point
                (shipping, timing, distraction) made them hesitate.
              </p>

              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                Abando response
              </p>
              <p className="mt-1 text-sm text-emerald-50/90">
                Sends a gentle reminder that references the exact outfit in their cart,
                with optional shipping or fit reassurance{" "}
                <span className="font-semibold">before</span> offering any discount.
              </p>
            </div>

            {/* Pattern 2 */}
            <div className="rounded-2xl border border-sky-700/60 bg-sky-950/25 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300">
                Pattern 2 · Idea browsers
              </p>
              <h3 className="mt-2 text-base font-semibold text-sky-50">
                “Still-deciding” visitors
              </h3>

              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                What&apos;s really going on
              </p>
              <p className="mt-1 text-sm text-sky-50/90">
                They view several collections, maybe tap a size filter, but leave
                without starting checkout. They&apos;re collecting ideas and feeling out
                style, not ready for commitment yet.
              </p>

              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                Abando response
              </p>
              <p className="mt-1 text-sm text-sky-50/90">
                Waits for a clear intent signal (like adding to cart or starting
                checkout) before messaging — avoiding spammy follow-ups that train
                browsers to ignore your brand.
              </p>
            </div>

            {/* Pattern 3 */}
            <div className="rounded-2xl border border-amber-700/60 bg-amber-950/25 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
                Pattern 3 · Value checkers
              </p>
              <h3 className="mt-2 text-base font-semibold text-amber-50">
                “Deal-conscious” returners
              </h3>

              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/80">
                What&apos;s really going on
              </p>
              <p className="mt-1 text-sm text-amber-50/90">
                They come back multiple times to the same pieces, often via campaign
                or email links, pausing on shipping or total price. They genuinely
                want the items but need to feel they&apos;re getting a fair deal.
              </p>

              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/80">
                Abando response
              </p>
              <p className="mt-1 text-sm text-amber-50/90">
                Reserves small, time-bound incentives for this group only and frames
                them as &quot;smart timing&quot; rather than permanent discounts — so you
                protect margin while still saving the right orders.
              </p>
            </div>
          </div>
        </section>

        {/* Detection FAQ / guardrails */}
        <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-sm font-semibold text-slate-100">
            How does Abando actually detect these patterns?
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            Under the hood, Abando is just doing disciplined, repeated analysis of
            the signals Shopify already gives you —{" "}
            <span className="font-semibold">
              no dark patterns, no biometric guessing.
            </span>
          </p>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                What inputs does Abando use?
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-200">
                <li>Cart and checkout events from Shopify.</li>
                <li>Which products / collections were in the cart.</li>
                <li>
                  Whether the shopper comes back and completes later (and how often).
                </li>
                <li>Whether they come from campaigns, email, or direct.</li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                What it doesn&apos;t do
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-200">
                <li>No mouse-position heatmaps.</li>
                <li>No &quot;creepy&quot; tracking outside your store.</li>
                <li>No psychological tricks that mislead customers.</li>
                <li>
                  Just consistent, explainable patterns you can see in your own data.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
          <p>
            Next step: pick the vertical playbook that fits you best. In a real
            store, Abando would watch a week of traffic, then show you which patterns
            are most common before suggesting plays. From there, you decide when each
            flow goes live.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/marketing/women-boutique/playbook"
              className="inline-flex items-center justify-center rounded-lg bg-pink-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-pink-400"
            >
              See the boutique growth plan
            </Link>
            <Link
              href="/marketing/supplements/playbook"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-900"
            >
              See the supplements playbook
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
TSX

echo "[demo] Updated demo page written to ${TARGET}"
echo "[demo] Backup saved to ${BACKUP}"
echo "[demo] Run: npm run dev and open http://localhost:3000/demo/playground"
