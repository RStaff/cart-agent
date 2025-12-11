"use client";

import Image from "next/image";
import { useState } from "react";

type PatternId = "cart_parkers" | "size_checkers" | "drop_watchers";

type Pattern = {
  id: PatternId;
  name: string;
  quote: string;
  description: string;
  channels: string[];
};

const PATTERNS: Pattern[] = [
  {
    id: "cart_parkers",
    name: "Cart parkers",
    quote: "\"I like it… I just need to think.\"",
    description:
      "Shoppers parking outfits in the cart while they think about fit, occasion, and total spend. They need reassurance and styling ideas more than a heavier discount.",
    channels: [
      "Email: styling inspiration + how others wear it",
      "SMS: light \"Still thinking about this look?\" nudge",
      "Onsite: reassurance on returns & fit when they come back",
    ],
  },
  {
    id: "size_checkers",
    name: "Size checkers",
    quote: "\"I'll buy once I'm sure it fits.\"",
    description:
      "Sessions full of size charts, reviews, and returns-policy checks. Shoppers pause until they feel safe choosing a size.",
    channels: [
      "Email: fit reviews and size guidance",
      "SMS: reminder with sizing tips for the exact items they viewed",
      "Onsite: fit callouts and \"free returns\" reassurance",
    ],
  },
  {
    id: "drop_watchers",
    name: "Drop watchers",
    quote: "\"I'm waiting for the right moment.\"",
    description:
      "Engaged shoppers hovering around low-stock items or new arrivals, waiting for a signal before they commit.",
    channels: [
      "Email: low-stock and \"last chance for this drop\" nudges",
      "SMS: short urgency pings around key sizes or outfits",
      "Onsite: subtle low-stock & countdown cues on return visits",
    ],
  },
];

type Day = {
  id: string;
  label: string;
  orders: number;
  revenue: string;
  patternId: PatternId;
};

const DAYS: Day[] = [
  {
    id: "mon",
    label: "Mon · 3 orders",
    orders: 3,
    revenue: "$345 demo revenue",
    patternId: "cart_parkers",
  },
  {
    id: "tue",
    label: "Tue · 5 orders",
    orders: 5,
    revenue: "$560 demo revenue",
    patternId: "size_checkers",
  },
  {
    id: "wed",
    label: "Wed · 6 orders",
    orders: 6,
    revenue: "$690 demo revenue",
    patternId: "cart_parkers",
  },
  {
    id: "thu",
    label: "Thu · 5 orders",
    orders: 5,
    revenue: "$575 demo revenue",
    patternId: "drop_watchers",
  },
  {
    id: "fri",
    label: "Fri · 7 orders",
    orders: 7,
    revenue: "$810 demo revenue",
    patternId: "size_checkers",
  },
  {
    id: "sat",
    label: "Sat · 8 orders",
    orders: 8,
    revenue: "$920 demo revenue",
    patternId: "drop_watchers",
  },
  {
    id: "sun",
    label: "Sun · 8 orders",
    orders: 8,
    revenue: "$910 demo revenue",
    patternId: "cart_parkers",
  },
];

export default function EmbeddedDashboardPage() {
  const [activeDayId, setActiveDayId] = useState<Day["id"]>("sat");

  const activeDay = DAYS.find((d) => d.id === activeDayId) ?? DAYS[0];
  const activePattern =
    PATTERNS.find((p) => p.id === activeDay.patternId) ?? PATTERNS[0];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top: header + primary KPIs */}
      <section className="mx-auto max-w-5xl px-6 pt-10 pb-8 lg:pt-12">
        <header className="flex items-start justify-between gap-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 ring-1 ring-sky-500/40">
                <Image
                  src="/abando-logo.png"
                  alt="Abando"
                  width={26}
                  height={24}
                  priority
                />
              </div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                <span className="font-semibold">Abando dashboard</span>{" "}
                <span className="ml-2 text-slate-500">
                  Live view of recovered orders & shopper patterns
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              See how Abando turned this week&apos;s hesitations{" "}
              <span className="text-slate-200">into extra orders.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
              This embedded view lines up with what shoppers actually did in
              your store. Instead of one big &quot;abandoned&quot; bucket, Abando
              groups sessions into a few patterns and quietly runs follow-ups
              that match how each shopper is hesitating.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-500">
              Embedded in
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

        {/* KPI band */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/5 px-6 py-5 shadow-[0_0_45px_rgba(16,185,129,0.35)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
              Recovered revenue · 7 days
            </p>
            <p className="mt-3 text-2xl font-semibold text-emerald-100">
              $5,040
            </p>
            <p className="mt-2 text-xs text-emerald-100/80">
              Revenue that would likely have been lost without Abando&apos;s
              plays.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-700/70 bg-slate-900/60 px-6 py-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Extra orders · 7 days
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-50">
              42+ orders
            </p>
            <p className="mt-2 text-xs text-slate-300">
              Small daily lifts across Cart Parkers, Size Checkers, and Drop
              Watchers.
            </p>
          </div>

          <div className="rounded-3xl border border-sky-500/40 bg-sky-500/5 px-6 py-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-sky-300/90">
              Psychological impact
            </p>
            <p className="mt-3 text-2xl font-semibold text-sky-50">
              ~1 extra day of sales
            </p>
            <p className="mt-2 text-xs text-sky-100/85">
              At this pace, each week feels like adding another full day of
              revenue—without more traffic. We surface this so you can feel the
              breathing room Abando is buying you.
            </p>
          </div>
        </div>
      </section>

      {/* Middle: patterns (left) + weekly impact (right) */}
      <section className="border-t border-slate-900/60 bg-slate-950 pb-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 pt-10 lg:flex-row">
          {/* Left: what Abando is seeing this week */}
          <div className="flex-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-slate-500">
              1 · What Abando is seeing this week
            </p>
            <h2 className="mt-3 text-lg font-semibold text-slate-50">
              Same shoppers, clearer patterns.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Instead of one big &quot;abandoned&quot; bucket, Abando groups
              sessions into hesitation types. That makes it obvious where your
              extra orders are really coming from—and how to talk to those
              shoppers.
            </p>

            <div className="mt-6 space-y-4">
              {PATTERNS.map((pattern) => (
                <div
                  key={pattern.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5"
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
                    Pattern · {pattern.name}
                  </p>
                  <p className="mt-2 text-[0.85rem] font-medium text-emerald-100">
                    {pattern.quote}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {pattern.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: weekly impact + pills + highlight */}
          <div className="flex-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-slate-500">
              2 · 7-day recovered orders snapshot
            </p>
            <h2 className="mt-3 text-lg font-semibold text-slate-50">
              Weekly impact, tied to real follow-ups.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Demo data, same logic as your live account: small lifts every day
              add up to a clear weekly impact. Click a day to see which pattern
              dominated and how Abando followed up.
            </p>

            <div className="mt-6 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 px-6 py-5 text-sm text-emerald-50 shadow-[0_0_45px_rgba(16,185,129,0.45)]">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-300/85">
                Weekly impact
              </p>
              <p className="mt-3 text-base font-semibold">
                40+ extra orders and just over $5,000 in recovered revenue in 7
                days.
              </p>
              <p className="mt-3 text-[13px] text-emerald-100/90">
                That&apos;s like adding an extra day of sales every week—without
                buying more traffic or cranking up promo codes. In a live
                account, this roll-up ties directly to your real recovered
                orders.
              </p>
            </div>

            {/* Day pills */}
            <div className="mt-5 flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const isActive = day.id === activeDayId;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayId(day.id)}
                    className={[
                      "rounded-full border px-3.5 py-1.5 text-[0.72rem] font-medium",
                      "transition-colors duration-150",
                      isActive
                        ? "border-emerald-400/80 bg-emerald-500/15 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                        : "border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-900",
                    ].join(" ")}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>

            {/* Highlight card for active day */}
            <div className="mt-6 rounded-3xl border border-emerald-500/60 bg-emerald-500/10 p-5 text-sm text-emerald-50 shadow-[0_0_45px_rgba(16,185,129,0.35)]">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-300">
                Highlight of the day
              </p>
              <p className="mt-3 text-base font-semibold text-slate-50">
                {activeDay.label}: {activeDay.orders} recovered orders (
                {activeDay.revenue})
              </p>

              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Shopper pattern
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-50">
                    {activePattern.name}
                  </p>
                  <p className="mt-2 text-xs text-emerald-100/85">
                    {activePattern.quote}
                  </p>
                </div>

                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    What&apos;s really going on
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    {activePattern.description}
                  </p>
                </div>

                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Follow-ups sent
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
                    {activePattern.channels.map((channel) => (
                      <li key={channel} className="flex gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{channel}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="mt-4 text-[11px] text-emerald-200/80">
                In a live account, these follow-ups reflect the real mix of
                email, SMS, and onsite nudges Abando is running against this
                pattern in your store.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <section className="border-t border-slate-900/60 bg-slate-950 pb-10">
        <div className="mx-auto max-w-5xl px-6 pt-6">
          <p className="text-[11px] text-slate-500">
            This demo is designed to line up with Abando&apos;s full playground
            view: same patterns, similar recovered-orders math, plus channel
            mix—just anchored inside your Shopify admin.
          </p>
        </div>
      </section>
    </main>
  );
}
