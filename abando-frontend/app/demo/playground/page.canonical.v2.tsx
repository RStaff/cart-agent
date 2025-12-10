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
    label: "Mon 3 orders",
    orders: 3,
    revenue: "$345 demo revenue",
    pattern: "Cart parkers",
    whatHappened:
      "Shoppers added 1–2 items, then bounced while thinking about total spend and fit.",
    howAbandoHelps:
      "Sends a delayed nudge like “Still love this look?” with social proof instead of a generic 10% off blast.",
  },
  {
    id: "tue",
    label: "Tue 5 orders",
    orders: 5,
    revenue: "$560 demo revenue",
    pattern: "Size checkers",
    whatHappened:
      "Shoppers bounced between size charts and product pages, worried about fit and returns.",
    howAbandoHelps:
      "Highlights fit reviews and try-at-home messaging so shoppers feel safe choosing a size.",
  },
  {
    id: "wed",
    label: "Wed 6 orders",
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
    label: "Thu 5 orders",
    orders: 5,
    revenue: "$575 demo revenue",
    pattern: "Last-minute browsers",
    whatHappened:
      "Shoppers compared a few looks, then left to check budgets or talk to a friend.",
    howAbandoHelps:
      "Gentle, time-boxed reminders that bring them back to the exact items they were considering.",
  },
  {
    id: "fri",
    label: "Fri 7 orders",
    orders: 7,
    revenue: "$810 demo revenue",
    pattern: "Payday shoppers",
    whatHappened:
      "Interest built up all week, then shoppers came back right after pay hits.",
    howAbandoHelps:
      "Lines up reminders and onsite nudges around payday so interest turns into completed orders.",
  },
  {
    id: "sat",
    label: "Sat 8 orders",
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
    label: "Sun 8 orders",
    orders: 8,
    revenue: "$910 demo revenue",
    pattern: "Window shoppers",
    whatHappened:
      "Weekend browsers compared outfits and saved items for “later” without a trigger to buy.",
    howAbandoHelps:
      "Pulls “liked” and carted items into a single reminder with clear reasons to buy now.",
  },
];

export default function DemoPlaygroundPage() {
  const [activeDayId, setActiveDayId] = useState<Day["id"]>("sat");
  const activeDay = DAYS.find((d) => d.id === activeDayId) ?? DAYS[0];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HERO */}
      <section className="mx-auto max-w-5xl px-6 py-16 lg:py-24">
        <header className="flex items-start justify-between gap-8">
          {/* Left: Abando logo + demo label */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 ring-1 ring-sky-500/40">
                <Image
                  src="/abando-logo.png"
                  alt="Abando"
                  width={28}
                  height={26}
                  priority
                />
              </div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Women&apos;s boutique apparel demo
              </p>
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.7rem]">
              See how Abando reads shopper behavior
              <br className="hidden sm:block" />
              <span className="text-slate-200">
                {" "}
                and turns it into recovered orders.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-300">
              This demo uses a women&apos;s boutique apparel store as an example.
              In production, Abando watches what shoppers view, search, and
              leave in their cart, then turns those sessions into a few clear
              shopper patterns instead of treating everyone who abandoned the
              same way.
            </p>
          </div>

          {/* Right: Built for Shopify */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">
              Built for
            </span>
            <Image
              src="/shopify_monotone_white.svg"
              alt="Shopify"
              width={90}
              height={28}
              className="opacity-90"
            />
          </div>
        </header>
      </section>

      {/* 1. Why segments instead of “everyone who abandoned”? */}
      <section className="border-t border-slate-900/60 bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:py-12">
          <h3 className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
            1 · Why segments instead of &quot;everyone who abandoned&quot;?
          </h3>
          <h2 className="mt-4 text-lg font-semibold text-slate-50">
            Some shoppers are almost ready. Others are still browsing.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
            Not every abandoned cart is the same. Some shoppers are checking
            outfits on their phone at work. Others park items while they wait
            for payday. Treating them all the same leads to noisy discounts and
            trained bargain hunters. Abando keeps your strategy simple and
            targeted instead of shouting at everyone.
          </p>
        </div>
      </section>

      {/* 2. Three high-impact patterns */}
      <section className="border-t border-slate-900/60 bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:py-12">
          <h3 className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
            2 · Three high-impact patterns in this boutique demo
          </h3>
          <h2 className="mt-4 text-lg font-semibold text-slate-50">
            Today&apos;s key patterns in this boutique demo
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            Names are just for clarity, not jargon. Each pattern is a different
            kind of hesitation Abando knows how to respond to.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-300">
                Pattern 1 · Cart parkers
              </p>
              <h3 className="mt-3 text-sm font-semibold text-slate-50">
                They park pieces &quot;to think about it&quot;
              </h3>
              <p className="mt-3 text-sm text-slate-300">
                Shopper likes the item but isn&apos;t sure about fit, occasion,
                or total spend. They&apos;re mentally trying on outfits and need
                reassurance more than a bigger coupon.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                How Abando responds
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Sends a delayed nudge like &quot;Still love this look? Here&apos;s how
                other customers styled it&quot; instead of a generic 10%-off blast.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-300">
                Pattern 2 · Size checkers
              </p>
              <h3 className="mt-3 text-sm font-semibold text-slate-50">
                They bounce between sizes &amp; size charts
              </h3>
              <p className="mt-3 text-sm text-slate-300">
                Fear of ordering the wrong size—especially on dresses, denim,
                and fitted tops. They pause until they feel confident they
                won&apos;t have to deal with returns.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                How Abando responds
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Plays that lead with sizing confidence and fit proof (reviews,
                photos, try-at-home messaging) instead of pure discounts.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-300">
                Pattern 3 · Drop watchers
              </p>
              <h3 className="mt-3 text-sm font-semibold text-slate-50">
                They wait for new arrivals or a better deal
              </h3>
              <p className="mt-3 text-sm text-slate-300">
                Shopper is engaged but waits for a signal—new drop, low-stock
                alert, or limited-time offer—before committing.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                How Abando responds
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Gentle urgency plays tied to low-stock sizes, bundle
                suggestions, or &quot;last chance for this collection&quot; instead of
                constant promos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 7-day recovered orders snapshot (interactive) */}
      <section className="border-t border-slate-900/60 bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:py-12">
          <h3 className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
            3 · What this means over a week
          </h3>
          <h2 className="mt-4 text-lg font-semibold text-slate-50">
            7-day recovered orders snapshot
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            This example boutique recovers a handful of extra outfits per
            day—small lifts that add up. In a live account, this view is driven
            by your real Shopify data and lets you compare patterns like cart
            parkers vs. drop watchers.
          </p>
          <p className="mt-3 text-sm text-emerald-300">
            Across the full week, this demo recovers just over{" "}
            <span className="font-semibold">$5,000</span> in orders that would
            have been lost — all from small, pattern-driven plays instead of
            blanket discounts.
          </p>

          {/* Weekly impact summary card */}
          <div className="mt-6 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 px-8 py-6 text-sm text-emerald-50 shadow-[0_0_60px_rgba(16,185,129,0.45)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300/80">
              Weekly impact
            </p>
            <p className="mt-3 text-base font-semibold">
              40+ extra orders and just over $5,000 in recovered revenue in 7
              days.
            </p>
            <p className="mt-3 text-[13px] text-emerald-100/90">
              That&apos;s like adding an extra day of sales every week — without
              buying more traffic or blasting bigger coupons. In a live
              account, this roll-up ties directly to your real recovered
              orders.
            </p>
          </div>

          {/* Pills for each day */}
          <div className="mt-6 flex flex-wrap gap-3">
            {DAYS.map((day) => {
              const isActive = day.id === activeDayId;
              return (
                <button
                  key={day.id}
                  type="button"
                  onMouseEnter={() => setActiveDayId(day.id)}
                  onFocus={() => setActiveDayId(day.id)}
                  className={[
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium",
                    "transition-colors duration-150",
                    isActive
                      ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                      : "border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-900",
                  ].join(" ")}
                >
                  {day.label}
                </button>
              );
            })}
          </div>

          {/* Highlight card driven by active day */}
          <div className="mt-8 rounded-3xl border border-emerald-500/60 bg-emerald-500/10 p-6 shadow-[0_0_45px_rgba(16,185,129,0.35)] lg:p-8">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-300">
              Highlight of the day
            </p>
            <p className="mt-3 text-base font-semibold text-slate-50">
              {activeDay.label}: {activeDay.orders} recovered orders (
              {activeDay.revenue})
            </p>

            <div className="mt-5 grid gap-6 lg:grid-cols-3">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Shopper pattern
                </p>
                <p className="mt-2 text-sm font-medium text-slate-50">
                  {activeDay.pattern}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {activeDay.whatHappened}
                </p>
              </div>

              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  What&apos;s really going on
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {activeDay.whatHappened}
                </p>
              </div>

              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  How Abando gets them back
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {activeDay.howAbandoHelps}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Raw signal → guided plays */}
      <section className="border-t border-slate-900/60 bg-slate-950 pb-16">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:py-12">
          <h3 className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
            4 · How Abando turns raw signal into guided plays
          </h3>
          <h2 className="mt-4 text-lg font-semibold text-slate-50">
            What the raw signal looks like
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            Under the hood, Abando is watching anonymous event streams such as
            views, size-guide checks, add-to-cart, and checkout steps. Those
            noisy events roll up into a small number of patterns your team can
            act on.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <pre className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950 p-6 text-xs leading-relaxed text-slate-200">
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
    "session_id": "b3c__",
    "events": [
      "view/tops/cropped-knit",
      "add_to_cart:SKU-CK-204",
      "abandon_checkout"
    ]
  }
]`}
            </pre>

            <div className="flex flex-col justify-between gap-4">
              <p className="text-sm leading-relaxed text-slate-300">
                Abando sees raw events like this across hundreds of sessions,
                then groups them into patterns your team can actually act on.
              </p>
              <div className="grid gap-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Raw shopper events
                  </p>
                  <p className="mt-2">
                    Clicks, searches, size-guide views, add-to-cart, and
                    checkout steps Abando receives from Shopify.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Behavior patterns
                  </p>
                  <p className="mt-2">
                    Abando clusters sessions into hesitation types like Cart
                    Parkers, Size Checkers, and Drop Watchers instead of one big
                    &quot;abandoned&quot; bucket.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Guided plays
                  </p>
                  <p className="mt-2">
                    Each pattern maps to a small set of proven plays so your
                    team chooses tone and channels—not targeting logic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
