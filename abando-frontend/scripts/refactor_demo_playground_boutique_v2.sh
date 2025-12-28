#!/bin/bash

set -euo pipefail

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

echo "[demo] Backing up existing ${TARGET} -> ${BACKUP}"
mkdir -p "$(dirname "$TARGET")"
if [ -f "$TARGET" ]; then
  cp "$TARGET" "$BACKUP"
fi

echo "[demo] Writing boutique-focused /demo/playground ..."

cat > "$TARGET" << 'TSX'
"use client";

import React from "react";
import Link from "next/link";

type DayData = {
  day: string;
  label: string;
  orders: number;
  revenue: number;
  pattern: string;
  items: string;
  howRecovered: string;
};

const WEEK: DayData[] = [
  {
    day: "Mon",
    label: "Mon",
    orders: 3,
    revenue: 360,
    pattern: "Cart parkers",
    items: "Occasion dresses and knit tops parked to 'think about it.'",
    howRecovered:
      "Soft reminder featuring social proof from similar customers, not a blanket discount.",
  },
  {
    day: "Tue",
    label: "Tue",
    orders: 5,
    revenue: 600,
    pattern: "Size checkers",
    items: "Shoppers bouncing between size & fit guides on denim and fitted dresses.",
    howRecovered:
      "Fit-focused flows: reviews mentioning size, photos, and clear returns reassurance.",
  },
  {
    day: "Wed",
    label: "Wed",
    orders: 6,
    revenue: 740,
    pattern: "Cart parkers",
    items: "Event dresses and statement tops saved to cart to 'think about it.'",
    howRecovered:
      "Lookbook-style SMS linking back to the exact outfits they saved with styling ideas.",
  },
  {
    day: "Thu",
    label: "Thu",
    orders: 5,
    revenue: 580,
    pattern: "Drop watchers",
    items: "New arrivals and low-stock pieces viewed multiple times.",
    howRecovered:
      "Limited-time prompts tied to low stock rather than constant countdown timers.",
  },
  {
    day: "Fri",
    label: "Fri",
    orders: 7,
    revenue: 840,
    pattern: "Mix of cart parkers & size checkers",
    items: "Weekend outfits and denim where shoppers hesitated on fit and total spend.",
    howRecovered:
      "Combo flows: fit reassurance plus a gentle 'finish your outfit' nudge.",
  },
  {
    day: "Sat",
    label: "Sat",
    orders: 8,
    revenue: 920,
    pattern: "Drop watchers",
    items: "Limited drops and 'party outfits' revisited after social posts.",
    howRecovered:
      "Back-in-stock and 'your size is still here' messages timed to live demand.",
  },
  {
    day: "Sun",
    label: "Sun",
    orders: 8,
    revenue: 840,
    pattern: "Cart parkers planning the week",
    items: "Workwear and everyday basics saved while planning outfits.",
    howRecovered:
      "Sunday-evening reminders that feel like a stylist check-in, not a flash sale.",
  },
];

function RecoveredOrdersChart() {
  const [activeIndex, setActiveIndex] = React.useState(2);
  const active = WEEK[activeIndex];

  const totalOrders = WEEK.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = WEEK.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <section className="mt-16 rounded-3xl border border-emerald-700/40 bg-slate-950/60 p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-300/80 uppercase">
            3 · What this means over a week
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-50">
            7-day recovered orders snapshot
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300/90">
            This example boutique recovers a handful of extra outfits per day—small
            lifts that add up. In a live account, this view is driven by your real
            Shopify data and lets you compare patterns like cart parkers vs. drop
            watchers.
          </p>
        </div>
        <div className="text-right text-xs text-emerald-300/90">
          <p className="font-semibold">
            {totalOrders} orders · ${totalRevenue.toLocaleString()}{" "}
            <span className="text-emerald-300/70">(demo week)</span>
          </p>
          <p className="mt-1 text-[11px] text-emerald-200/80">
            In production, this ties directly to your revenue so you know where to
            focus next.
          </p>
        </div>
      </div>

      {/* Bars */}
      <div className="mt-8 flex flex-wrap gap-3">
        {WEEK.map((day, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={day.day}
              type="button"
              onClick={() => setActiveIndex(idx)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={[
                "flex-1 min-w-[72px] rounded-full px-4 py-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                isActive
                  ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40"
                  : "bg-emerald-500/80 text-slate-950/80 hover:bg-emerald-400",
              ].join(" ")}
            >
              <div className="text-xs font-semibold">{day.day}</div>
              <div className="mt-1 text-[11px] opacity-80">
                {day.orders} orders
              </div>
            </button>
          );
        })}
      </div>

      {/* Highlight card */}
      <div className="mt-8 rounded-2xl border border-emerald-500/40 bg-emerald-900/10 p-5 sm:p-6">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-300/90 uppercase">
          Highlight of the day
        </p>
        <h3 className="mt-1 text-sm font-semibold text-emerald-100">
          {active.day}: {active.orders} recovered orders (${active.revenue} demo
          revenue)
        </h3>
        <dl className="mt-3 space-y-2 text-sm text-emerald-50/90">
          <div>
            <dt className="font-semibold text-emerald-200">Shopper pattern:</dt>
            <dd>{active.pattern}.</dd>
          </div>
          <div>
            <dt className="font-semibold text-emerald-200">
              What they were eyeing:
            </dt>
            <dd>{active.items}</dd>
          </div>
          <div>
            <dt className="font-semibold text-emerald-200">
              How Abando got them back:
            </dt>
            <dd>{active.howRecovered}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] text-emerald-200/80">
          In the live product, clicking a bar opens the list of recovered sessions
          for that day so your team can see the actual carts and messages that
          fired.
        </p>
      </div>
    </section>
  );
}

export default function DemoPlaygroundPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        {/* Hero & sidebar */}
        <section className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-300/80 uppercase">
              Abando demo · Women&apos;s boutique apparel
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-[2.3rem]">
              See how Abando reads shopper behavior and turns it into recovered
              orders.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300/90">
              This demo uses a women&apos;s boutique apparel store as an example
              scenario. In production, Abando watches what shoppers view, search,
              and leave in their cart, then groups those sessions into a few clear
              behavior patterns instead of treating everyone who abandoned the
              same way.
            </p>
            <p className="mt-4 text-sm text-slate-300/90">
              You&apos;ll see three things:
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-200/90">
              <li>
                How Abando segments shoppers instead of blasting discounts.
              </li>
              <li>
                Three high-impact hesitation patterns for boutique shoppers.
              </li>
              <li>
                A 7-day snapshot of extra orders recovered from those plays.
              </li>
            </ol>
          </div>

          <aside className="flex flex-col gap-4">
            <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
                What this demo is (and isn&apos;t)
              </p>
              <p className="mt-3 text-sm text-slate-200/90">
                This isn&apos;t a fake &quot;AI magic&quot; animation. It&apos;s a
                realistic sketch of how Abando observes sessions, groups them into
                patterns, and shows you the impact in plain numbers.
              </p>
              <p className="mt-3 text-sm text-slate-200/90">
                The goal is for your team to say,{" "}
                <span className="italic">
                  &quot;Okay, we see what&apos;s happening with our shoppers, and
                  we know which three plays to run next.&quot;
                </span>
              </p>
            </section>

            <section className="rounded-3xl border border-emerald-700/50 bg-emerald-900/5 p-5 sm:p-6">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-300/80 uppercase">
                What you&apos;d do next with Abando
              </p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-emerald-100/90">
                <li>Connect your Shopify store (about 1–2 minutes).</li>
                <li>
                  Let Abando quietly observe a week of traffic and learn your
                  shopper patterns.
                </li>
                <li>
                  Turn on 2–3 plays for your strongest patterns first, then expand
                  from there.
                </li>
              </ol>
              <div className="mt-4 space-y-2">
                <Link
                  href="/marketing/women-boutique/playbook"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                >
                  See full boutique growth plan
                </Link>
                <Link
                  href="/marketing/verticals"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/10"
                >
                  See other verticals
                </Link>
              </div>
              <p className="mt-3 text-[10px] text-emerald-200/80">
                Most merchants start by improving one pattern (like cart parkers),
                then expand to additional plays as recovered orders grow.
              </p>
            </section>
          </aside>
        </section>

        {/* Section 1 – Why segments */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
            1 · Why segments instead of &quot;everyone who abandoned&quot;?
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-50">
            Some shoppers are almost ready. Others are still browsing.
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-300/90">
            Not every abandoned cart is the same. Some shoppers are checking
            outfits on their phone at work. Others park items while they wait for
            payday. Treating them all the same leads to noisy discounts and trained
            bargain hunters.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-slate-300/90">
            Abando focuses on a small set of{" "}
            <span className="text-emerald-300 font-semibold">
              clear shopper patterns
            </span>
            . That keeps your strategy simple, measurable, and easy to iterate on
            with your team.
          </p>
        </section>

        {/* Section 2 – Pattern cards */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
            2 · Three high-impact patterns in this boutique demo
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-50">
            Today&apos;s key patterns in this boutique demo
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300/90">
            Names are for clarity, not jargon. Each pattern is just a different
            kind of hesitation Abando knows how to respond to.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {/* Pattern 1 */}
            <article className="rounded-2xl border border-emerald-600/50 bg-slate-950/90 p-5">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-300/80 uppercase">
                Pattern 1 · Cart parkers
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                They park pieces &quot;to think about it&quot;
              </h3>
              <p className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                What&apos;s really going on
              </p>
              <p className="mt-1 text-sm text-slate-300/90">
                Shopper likes the item but is unsure about fit, occasion, or total
                spend. They&apos;re mentally trying on outfits and need reassurance
                more than a bigger coupon.
              </p>
              <p className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-emerald-300/80 uppercase">
                How Abando responds
              </p>
              <p className="mt-1 text-sm text-slate-300/90">
                Sends a delayed nudge like{" "}
                <span className="italic">
                  &quot;Still love this look? Here&apos;s how other customers styled
                  it&quot;
                </span>{" "}
                instead of a generic 10%-off blast.
              </p>
            </article>

            {/* Pattern 2 */}
            <article className="rounded-2xl border border-emerald-600/50 bg-slate-950/90 p-5">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-300/80 uppercase">
                Pattern 2 · Size checkers
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                They bounce between sizes &amp; size charts
              </h3>
              <p className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                What&apos;s really going on
              </p>
              <p className="mt-1 text-sm text-slate-300/90">
                Fear of ordering the wrong size, especially on dresses, denim, and
                fitted tops. They pause until they feel confident they won&apos;t
                have to hassle with returns.
              </p>
              <p className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-emerald-300/80 uppercase">
                How Abando responds
              </p>
              <p className="mt-1 text-sm text-slate-300/90">
                Plays that lead with sizing confidence and fit proof (reviews
                mentioning size, photos, try-at-home messaging) in emails or onsite
                banners.
              </p>
            </article>

            {/* Pattern 3 */}
            <article className="rounded-2xl border border-emerald-600/50 bg-slate-950/90 p-5">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-300/80 uppercase">
                Pattern 3 · Drop watchers
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-50">
                They wait for new arrivals or a better deal
              </h3>
              <p className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                What&apos;s really going on
              </p>
              <p className="mt-1 text-sm text-slate-300/90">
                Shopper is engaged with the brand but habitually waits for a
                signal—new drop, low-stock alert, or limited-time offer—before
                committing.
              </p>
              <p className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-emerald-300/80 uppercase">
                How Abando responds
              </p>
              <p className="mt-1 text-sm text-slate-300/90">
                Gentle urgency plays tied to low-stock sizes, bundle suggestions,
                or{" "}
                <span className="italic">
                  &quot;last chance for this collection&quot;
                </span>{" "}
                instead of constant promos.
              </p>
            </article>
          </div>
        </section>

        {/* Section 3 – Raw signal + interpretation + transformer */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
                What the raw signal looks like
              </p>
              <p className="mt-2 text-sm text-slate-300/90">
                Under the hood, Abando is watching anonymous event streams like:
              </p>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900/90 p-4 text-[11px] leading-relaxed text-slate-200">
                {`[
  {
    "session_id": "s_1432",
    "events": [
      "view/dresses/midi-wrap",
      "view/size-guide/dresses",
      "add_to_cart:SKU-DF-102",
      "view/returns-policy",
      "abandon_checkout"
    ]
  },
  {
    "session_id": "b3c_…",
    "events": [
      "view/tops/cropped-knit",
      "add_to_cart:SKU-CK-204",
      "abandon_checkout"
    ]
  }
]`}
              </pre>

              {/* Transformer mini-row */}
              <div className="mt-5 grid gap-4 rounded-2xl border border-emerald-700/40 bg-emerald-900/10 p-4 text-xs sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-emerald-300/90 uppercase">
                    Raw shopper events
                  </p>
                  <p className="mt-1 text-emerald-100/85">
                    Clicks, searches, size-guide views, add-to-cart, and checkout
                    steps Abando receives from Shopify.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-emerald-300/90 uppercase">
                    Behavior patterns
                  </p>
                  <p className="mt-1 text-emerald-100/85">
                    Abando clusters sessions into hesitation types like Cart
                    Parkers, Size Checkers, and Drop Watchers instead of one big
                    &quot;abandoned&quot; bucket.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-emerald-300/90 uppercase">
                    Guided plays
                  </p>
                  <p className="mt-1 text-emerald-100/85">
                    Each pattern maps to a small set of proven plays so your team
                    chooses tone and channels—not targeting logic.
                  </p>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-slate-400/90">
                Abando sees events like this across hundreds of sessions, then
                groups them into patterns your team can actually act on.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
                How Abando interprets it
              </p>
              <p className="mt-2 text-sm text-slate-300/90">
                Instead of showing you raw logs, Abando turns them into simple,
                human-readable insights like:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>• 38% of abandons checked returns policy first.</li>
                <li>• 24% abandoned after comparing 3+ dress styles.</li>
                <li>• 18% abandoned while building full outfits.</li>
              </ul>
              <p className="mt-3 text-sm text-slate-300/90">
                Each pattern maps to a small set of plays (emails, SMS, onsite
                prompts) so you&apos;re not guessing which message to send.
              </p>
            </div>
          </div>

          {/* Interactive chart */}
          <RecoveredOrdersChart />
        </section>
      </div>
    </main>
  );
}
TSX

echo "[demo] New boutique-focused /demo/playground written to ${TARGET}"
