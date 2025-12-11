"use client";

import { useState } from "react";
import Image from "next/image";
import ShopifyBadge from "@/components/ShopifyBadge";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type HighlightData = {
  label: string;
  headline: string;
  revenue: string;
  patternName: string;
  patternQuote: string;
  whatsGoingOn: string;
  followUps: string[];
  abandoWhy: string;
};

const HIGHLIGHTS: Record<DayKey, HighlightData> = {
  mon: {
    label: "Mon · 3 orders: 3 recovered orders ($345 demo revenue)",
    headline: "Mon · 3 orders: 3 recovered orders",
    revenue: "$345 demo revenue",
    patternName: "Cart parkers",
    patternQuote: `"I like it... I just need to think."`,
    whatsGoingOn:
      "Shoppers parking outfits in the cart while they think about fit, occasion, and total spend. They need reassurance and styling ideas more than a heavier discount.",
    followUps: [
      "Email: styling inspiration + how others wear it",
      "SMS: light “Still thinking about this look?” nudge",
      "Onsite: reassurance on returns & fit when they come back",
    ],
    abandoWhy:
      "Abando treats this as a hesitation moment, not a hard ‘no’. It leans on reassurance and social proof, using the gentlest channel mix that can still move the order without inflating discounts.",
  },
  tue: {
    label: "Tue · 5 orders: 5 recovered orders ($580 demo revenue)",
    headline: "Tue · 5 orders: 5 recovered orders",
    revenue: "$580 demo revenue",
    patternName: "Size checkers",
    patternQuote: `"I'll buy once I'm sure it fits."`,
    whatsGoingOn:
      "Sessions full of size charts, reviews, and returns-policy checks. Shoppers pause until they feel safe choosing a size.",
    followUps: [
      "Email: fit reviews and size guidance",
      "SMS: reminder with sizing tips for the exact items they viewed",
      "Onsite: fit callouts and “free returns” reassurance",
    ],
    abandoWhy:
      "Abando reads all those size-chart loops as a “fit confidence” gap. Instead of shouting promos, it sends calm, fit-focused nudges through the channels this shopper is most likely to notice and trust.",
  },
  wed: {
    label: "Wed · 6 orders: 6 recovered orders ($710 demo revenue)",
    headline: "Wed · 6 orders: 6 recovered orders",
    revenue: "$710 demo revenue",
    patternName: "Cart parkers",
    patternQuote: `"I like it... I just need to think."`,
    whatsGoingOn:
      "Outfits sitting in carts across multiple tabs while shoppers compare options and prices.",
    followUps: [
      "Email: outfit ideas that complete the look",
      "SMS: gentle “Your picks are still waiting” ping",
      "Onsite: subtle reminders on returns and quality when they revisit",
    ],
    abandoWhy:
      "Abando understands that these shoppers are weighing tradeoffs, not abandoning you. It chooses light, value-focused reminders that keep the items top-of-mind without feeling pushy.",
  },
  thu: {
    label: "Thu · 5 orders: 5 recovered orders ($640 demo revenue)",
    headline: "Thu · 5 orders: 5 recovered orders",
    revenue: "$640 demo revenue",
    patternName: "Drop watchers",
    patternQuote: `"I'm waiting for the right moment."`,
    whatsGoingOn:
      "Shoppers hovering around low-stock items or new arrivals, waiting for a clear signal before they commit.",
    followUps: [
      "Email: low-stock and “last chance for this drop” nudges",
      "SMS: short urgency pings around key sizes or outfits",
      "Onsite: subtle low-stock & countdown cues on return visits",
    ],
    abandoWhy:
      "Abando spots this as a “timing problem” and uses just enough scarcity messaging to unlock the purchase—without turning your whole store into a constant fire sale.",
  },
  fri: {
    label: "Fri · 7 orders: 7 recovered orders ($810 demo revenue)",
    headline: "Fri · 7 orders: 7 recovered orders",
    revenue: "$810 demo revenue",
    patternName: "Size checkers",
    patternQuote: `"I'll buy once I'm sure it fits."`,
    whatsGoingOn:
      "Size-curious shoppers bouncing between size guides, reviews, and try-on photos, then leaving right before checkout.",
    followUps: [
      "Email: fit reviews and sizing tips from similar shoppers",
      "SMS: “Still deciding on your size?” follow-up with a quick guide",
      "Onsite: fit callouts and “free exchanges” reassurance on revisit",
    ],
    abandoWhy:
      "Abando reads this as nervousness, not disinterest. It responds with gentle fit proof and safety nets, choosing channels that feel like help, not hype.",
  },
  sat: {
    label: "Sat · 8 orders: 8 recovered orders ($920 demo revenue)",
    headline: "Sat · 8 orders: 8 recovered orders",
    revenue: "$920 demo revenue",
    patternName: "Drop watchers",
    patternQuote: `"I'm waiting for the right moment."`,
    whatsGoingOn:
      "Engaged shoppers hovering around low-stock items or new arrivals, waiting for a signal before they commit. They’re primed to buy but anxious about missing the best drop.",
    followUps: [
      "Email: low-stock and “last chance for this drop” nudges",
      "SMS: short urgency pings around key sizes or outfits",
      "Onsite: subtle low-stock & countdown cues on return visits",
    ],
    abandoWhy:
      "Abando’s AI recognizes this as a “drop watcher” moment and picks a precise, scarcity-based push instead of heavier promos—using just enough urgency to move the order while protecting your margins.",
  },
  sun: {
    label: "Sun · 8 orders: 8 recovered orders ($935 demo revenue)",
    headline: "Sun · 8 orders: 8 recovered orders",
    revenue: "$935 demo revenue",
    patternName: "Mixed hesitations",
    patternQuote: `"I'm interested… I just haven’t pulled the trigger yet."`,
    whatsGoingOn:
      "Weekend browsers flipping between wishlists, saved tabs, and carts. Some need reassurance, others need a small nudge to actually check out.",
    followUps: [
      "Email: round-up of the exact items they viewed",
      "SMS: short “Wrap up your weekend picks” reminder",
      "Onsite: low-friction reminders when they return on mobile",
    ],
    abandoWhy:
      "Abando treats Sunday as a clean-up lane: it blends reassurance and light urgency, using the channel mix that has historically worked best for these patterns in your store.",
  },
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function EmbeddedDashboard() {
  const [activeDay, setActiveDay] = useState<DayKey>("sat");
  const highlight = HIGHLIGHTS[activeDay];

  const pillOrder: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const pillLabels: Record<DayKey, string> = {
    mon: "Mon · 3 orders",
    tue: "Tue · 5 orders",
    wed: "Wed · 6 orders",
    thu: "Thu · 5 orders",
    fri: "Fri · 7 orders",
    sat: "Sat · 8 orders",
    sun: "Sun · 8 orders",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Top header row */}
                    <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-10 md:gap-16">
        <div className="flex items-start gap-4">
          <div className="relative h-9 w-32">
            <Image
              src="/abando-logo.inline.png"
              alt="Abando logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="space-y-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
              Abando dashboard · Live view of recovered orders & shopper patterns
            </p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              See how Abando turned this week's hesitations into extra orders.
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              This embedded view lines up with what shoppers actually did in your store. Instead of one big "abandoned" bucket, Abando groups sessions into hesitation types and quietly runs follow-ups that match how each shopper is hesitating.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 text-left md:items-end md:text-right">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Embedded in Shopify admin
          </p>
          <div className="flex items-center gap-3">
            <ShopifyBadge variant="embedded" />
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-emerald-500/60 px-4 py-1.5 text-xs font-medium tracking-wide text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.35)] hover:border-emerald-400 hover:text-emerald-50"
            >
              Live in your Shopify admin
            </button>
          </div>
        </div>
      </header>

{/* Top stat cards */}
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/15 to-slate-950 px-5 py-5 shadow-[0_0_35px_rgba(16,185,129,0.3)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Recovered revenue · 7 days
            </p>
            <p className="mt-4 text-3xl font-semibold text-emerald-100">
              $5,040
            </p>
            <p className="mt-2 text-sm text-emerald-100/80">
              Revenue that would likely have been lost without Abando&apos;s
              plays.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 px-5 py-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
              Extra orders · 7 days
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-50">
              40+ orders
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Small daily lifts that add up across Cart Parkers, Size Checkers,
              and Drop Watchers.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 px-5 py-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
              Psychological impact
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-50">
              ~1 extra day of sales
            </p>
            <p className="mt-2 text-sm text-slate-300">
              At this pace, each week feels like adding another full day of
              revenue—without more traffic. We surface this so you can feel the
              breathing room Abando is buying you.
            </p>
          </div>
        </section>

        {/* Section 1: patterns */}
        <section className="mt-14 space-y-6">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-slate-500">
            1 · What Abando is seeing this week
          </p>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-50">
              Same shoppers, clearer patterns.
            </h2>
            <p className="max-w-3xl text-sm text-slate-300">
              Instead of one big &quot;abandoned&quot; bucket, Abando groups
              sessions into hesitation types. That makes it obvious where your
              extra orders are really coming from—and how to talk to those
              shoppers.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Pattern · Cart parkers
              </p>
              <p className="mt-3 text-sm font-medium text-slate-100">
                &quot;I like it… I just need to think.&quot;
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Shoppers parking outfits in the cart while they think about fit,
                occasion, and total spend. They need reassurance and styling
                ideas more than a heavier discount.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Pattern · Size checkers
              </p>
              <p className="mt-3 text-sm font-medium text-slate-100">
                &quot;I&apos;ll buy once I&apos;m sure it fits.&quot;
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Sessions full of size charts, reviews, and returns-policy
                checks. Shoppers pause until they feel safe choosing a size.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Pattern · Drop watchers
              </p>
              <p className="mt-3 text-sm font-medium text-slate-100">
                &quot;I&apos;m waiting for the right moment.&quot;
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Engaged shoppers hovering around low-stock items or new
                arrivals, waiting for a signal before they commit.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: weekly impact + highlight of the day */}
        <section className="mt-16 space-y-6">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-slate-500">
            2 · 7-day recovered orders snapshot
          </p>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-50">
              Weekly impact, tied to real follow-ups.
            </h2>
            <p className="max-w-3xl text-sm text-slate-300">
              Demo data, same logic as your live account: small lifts every day
              add up to a clear weekly impact. Click a day to see which pattern
              dominated and how Abando followed up.
            </p>
          </div>

          {/* Weekly impact card */}
          <div className="rounded-3xl border border-emerald-500/35 bg-gradient-to-b from-emerald-500/12 to-slate-950 px-6 py-6 shadow-[0_0_35px_rgba(16,185,129,0.3)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Weekly impact
            </p>
            <p className="mt-3 text-xl font-semibold text-emerald-50">
              40+ extra orders and just over $5,040 in recovered revenue in 7
              days.
            </p>
            <p className="mt-2 max-w-2xl text-sm text-emerald-50/80">
              That&apos;s like adding an extra day of sales each week—without
              buying more traffic or cranking up promo codes. In a live account,
              this roll-up ties directly to your real recovered orders.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {pillOrder.map((dayKey) => (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => setActiveDay(dayKey)}
                  className={classNames(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    activeDay === dayKey
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
                      : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-100"
                  )}
                >
                  {pillLabels[dayKey]}
                </button>
              ))}
            </div>
          </div>

          {/* Highlight of the day */}
          <div className="rounded-3xl border border-emerald-500/30 bg-slate-950/70 px-6 py-6 shadow-[0_0_45px_rgba(16,185,129,0.35)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Highlight of the day
            </p>
            <p className="mt-3 text-base font-semibold text-slate-50">
              {highlight.headline}: {highlight.revenue}
            </p>

            <div className="mt-5 grid gap-6 md:grid-cols-4">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Shopper pattern
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-50">
                  {highlight.patternName}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {highlight.patternQuote}
                </p>
              </div>

              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  What&apos;s really going on
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {highlight.whatsGoingOn}
                </p>
              </div>

              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Follow-ups sent
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate-300">
                  {highlight.followUps.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                  Abando response &amp; why
                </p>
                <p className="mt-3 text-sm text-slate-200">
                  {highlight.abandoWhy}
                </p>
              </div>
            </div>

            <p className="mt-6 border-t border-emerald-500/20 pt-3 text-[0.7rem] text-slate-400">
              In a live account, these follow-ups reflect the real mix of email,
              SMS, and onsite nudges Abando is running against this pattern in
              your store. The highlight view is designed to match what you see
              in the full playground demo—same patterns, similar recovered-orders
              math, plus channel mix—just anchored inside your Shopify admin.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
