#!/usr/bin/env bash
set -euo pipefail

# Always run from abando-frontend root
cd "$(dirname "$0")/.."
echo "📁 Repo: $(pwd)"

EMBED_FILE="app/embedded/page.tsx"

# 0) Backup current embedded page
if [ -f "$EMBED_FILE" ]; then
  backup="$EMBED_FILE.before_reset_v3_$(date +%s).tsx"
  cp "$EMBED_FILE" "$backup"
  echo "💾 Backup written to: $backup"
fi

# 1) Ensure ShopifyBadge component exists and uses monotone logo
mkdir -p src/components

cat > src/components/ShopifyBadge.tsx <<'TSX'
import Image from "next/image";
import type { FC } from "react";

type ShopifyBadgeProps = {
  /**
   * Variant:
   * - "embedded"  → "Embedded in Shopify admin"
   * - "works-with" → "Works with Shopify"
   */
  variant?: "embedded" | "works-with";
};

const ShopifyBadge: FC<ShopifyBadgeProps> = ({ variant = "embedded" }) => {
  const label =
    variant === "embedded"
      ? "Embedded in Shopify admin"
      : "Works with Shopify";

  return (
    <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
      <span className="uppercase tracking-[0.24em] text-slate-500">
        {label}
      </span>
      <div className="flex items-center">
        <Image
          src="/shopify_monotone_white.svg"
          alt="Shopify"
          width={80}
          height={24}
          priority
        />
      </div>
    </div>
  );
};

export default ShopifyBadge;
TSX

echo "✅ src/components/ShopifyBadge.tsx rewritten"

# 2) Restore / enforce the logo files
if [ -f public/abando-logo.inline.backup.png ]; then
  cp public/abando-logo.inline.backup.png public/abando-logo.inline.png
  cp public/abando-logo.inline.backup.png public/abando-logo-transparent.png
  echo "✅ Restored Abando inline logo + transparent logo from backup"
fi

# 3) Rewrite embedded dashboard to a clean, working v3
cat > "$EMBED_FILE" <<'TSX'
"use client";

import { useState } from "react";
import Image from "next/image";
import ShopifyBadge from "@/components/ShopifyBadge";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type Highlight = {
  label: string;
  headline: string;
  patternLabel: string;
  patternQuote: string;
  whatsGoingOn: string;
  followUps: string[];
  responseWhy: string;
};

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const HIGHLIGHTS: Record<DayKey, Highlight> = {
  mon: {
    label: "Mon · 3 orders: 3 recovered orders ($345 demo revenue)",
    headline: "Cart parkers",
    patternLabel: "Cart parkers",
    patternQuote: `"I like it… I just need to think."`,
    whatsGoingOn:
      "Shoppers parking outfits in the cart while they think about fit, occasion, and total spend. They need reassurance and styling ideas more than a heavier discount.",
    followUps: [
      "Email: styling inspiration + how others wear it",
      "SMS: light “Still thinking about this look?” nudge",
      "Onsite: reassurance on returns & fit when they come back",
    ],
    responseWhy:
      "Abando sees classic “cart parking” and chooses low-friction reassurance plays—styling ideas, social proof, and easy-returns language—so shoppers feel safe finishing the order without blasting bigger coupons to everyone.",
  },
  tue: {
    label: "Tue · 5 orders: 5 recovered orders ($560 demo revenue)",
    headline: "Size checkers",
    patternLabel: "Size checkers",
    patternQuote: `"I'll buy once I'm sure it fits."`,
    whatsGoingOn:
      "Sessions full of size charts, reviews, and returns-policy checks. Shoppers pause until they feel safe choosing a size.",
    followUps: [
      "Email: fit reviews and sizing tips",
      "SMS: reminder with size guidance for the exact items viewed",
      "Onsite: fit callouts and “free returns” reassurance",
    ],
    responseWhy:
      "Abando leans into fit-proof rather than urgency—pulling in real-world sizing signals and low-friction return language so the shopper can commit with confidence instead of abandoning over doubt.",
  },
  wed: {
    label: "Wed · 6 orders: 6 recovered orders ($780 demo revenue)",
    headline: "Drop watchers",
    patternLabel: "Drop watchers",
    patternQuote: `"I'm waiting for the right moment."`,
    whatsGoingOn:
      "Engaged shoppers hovering around low-stock items or new arrivals, waiting for a clear signal before they commit. They’re primed to buy but anxious about missing the best drop.",
    followUps: [
      "Email: low-stock and “last chance for this drop” nudges",
      "SMS: short urgency pings around key sizes or outfits",
      "Onsite: subtle low-stock & countdown cues on return visits",
    ],
    responseWhy:
      "Abando recognizes this as a “drop watcher” pattern and chooses the lightest possible push that can still move the shopper. It leans on urgency around low-stock, not heavier promo codes, so revenue goes up without over-discounting.",
  },
  thu: {
    label: "Thu · 5 orders: 5 recovered orders ($610 demo revenue)",
    headline: "Cart parkers (weekend planners)",
    patternLabel: "Cart parkers",
    patternQuote: `"I'll finish this later."`,
    whatsGoingOn:
      "Carts stacking up mid-week as shoppers plan outfits for the weekend but haven’t locked in sizes or final picks.",
    followUps: [
      "Email: “Lock in your weekend looks” reminder",
      "SMS: gentle “We saved your cart” ping",
      "Onsite: pre-filled cart + simple checkout path on return",
    ],
    responseWhy:
      "Abando reads this as low-intent but high-interest traffic and chooses reminders that respect the shopper’s timing—cart-save and weekend-framing language—so they finish when they’re ready without feeling chased.",
  },
  fri: {
    label: "Fri · 7 orders: 7 recovered orders ($810 demo revenue)",
    headline: "Size checkers (last-minute)",
    patternLabel: "Size checkers",
    patternQuote: `"I'll buy once I'm sure it fits."`,
    whatsGoingOn:
      "Last-minute sizing anxiety right before a big weekend or event. Shoppers bounce between size charts and reviews, then hesitate at checkout.",
    followUps: [
      "Email: fit reviews focused on event-ready outfits",
      "SMS: “We’ve got your size” reassurance for the exact items viewed",
      "Onsite: size-confidence callouts on product and cart",
    ],
    responseWhy:
      "Abando treats this as an urgent fit problem, not a discount problem—surfacing clear, specific fit proof so the shopper can say yes quickly without waiting for a bigger sale.",
  },
  sat: {
    label: "Sat · 8 orders: 8 recovered orders ($920 demo revenue)",
    headline: "Drop watchers",
    patternLabel: "Drop watchers",
    patternQuote: `"I'm waiting for the right moment."`,
    whatsGoingOn:
      "Engaged shoppers hovering around low-stock items or new arrivals, waiting for a signal before they commit.",
    followUps: [
      "Email: low-stock and “last chance for this drop” nudges",
      "SMS: short urgency pings around key sizes or outfits",
      "Onsite: subtle low-stock & countdown cues on return visits",
    ],
    responseWhy:
      "Abando’s AI recognizes this as a “drop watcher” moment and picks a precise, scarcity-based push instead of heavier promos—using just enough urgency to move the order while protecting your margins.",
  },
  sun: {
    label: "Sun · 8 orders: 8 recovered orders ($915 demo revenue)",
    headline: "Mixed hesitation",
    patternLabel: "Mixed patterns",
    patternQuote: `"I like it… but I’m not 100% sure."`,
    whatsGoingOn:
      "A blend of cart parking, size checking, and drop watching as shoppers do one last weekend browse before the week resets.",
    followUps: [
      "Email: recap of saved items with fit and low-stock highlights",
      "SMS: “Before this week resets…” gentle nudge",
      "Onsite: clear next-step messaging when they return to the cart",
    ],
    responseWhy:
      "Abando blends reassurance and light urgency, picking follow-ups that match the mix of hesitation signals so shoppers feel guided—not pressured—into finishing the purchase.",
  },
};

const WEEKLY_ORDERS: Record<DayKey, number> = {
  mon: 3,
  tue: 5,
  wed: 6,
  thu: 5,
  fri: 7,
  sat: 8,
  sun: 8,
};

const dayOrder: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function EmbeddedPage() {
  const [selectedDay, setSelectedDay] = useState<DayKey>("sat");
  const highlight = HIGHLIGHTS[selectedDay];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Abando dashboard · Live view of recovered orders &amp; shopper patterns
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-[2.1rem]">
              See how Abando turned this week&apos;s hesitations into extra orders.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300">
              This embedded view lines up with what shoppers actually did in your store.
              Instead of one big &quot;abandoned&quot; bucket, Abando groups sessions into a few
              hesitation patterns and quietly runs follow-ups that match how each shopper is
              hesitating.
            </p>
          </div>
          <div className="mt-1 flex flex-col items-end gap-3">
            <ShopifyBadge variant="embedded" />
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live in your Shopify admin
            </div>
          </div>
        </div>

        {/* Top metrics */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent px-6 py-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Recovered revenue · 7 days
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-200">$5,040</p>
            <p className="mt-2 text-sm text-emerald-100/80">
              Revenue that would likely have been lost without Abando&apos;s plays.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Extra orders · 7 days
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-50">40+ orders</p>
            <p className="mt-2 text-sm text-slate-300">
              Small daily lifts that add up across Cart Parkers, Size Checkers, and Drop Watchers.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Psychological impact
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-50">~1 extra day of sales</p>
            <p className="mt-2 text-sm text-slate-300">
              At this pace, each week feels like adding another full day of revenue—without more
              traffic. We surface this so you can feel the breathing room Abando is buying you.
            </p>
          </div>
        </div>

        {/* Section 1: patterns */}
        <section className="mt-12 space-y-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
            1 · What Abando is seeing this week
          </p>
          <h2 className="text-lg font-semibold text-slate-50">
            Same shoppers, clearer patterns.
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Instead of one big &quot;abandoned&quot; bucket, Abando groups sessions into hesitation
            types. That makes it obvious where your extra orders are really coming from—and how to
            talk to those shoppers.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Pattern · Cart parkers
              </p>
              <p className="mt-2 text-sm font-medium text-slate-50">
                &quot;I like it… I just need to think.&quot;
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Shoppers parking outfits in the cart while they think about fit, occasion, and total
                spend. They need reassurance and styling ideas more than a heavier discount.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Pattern · Size checkers
              </p>
              <p className="mt-2 text-sm font-medium text-slate-50">
                &quot;I&apos;ll buy once I&apos;m sure it fits.&quot;
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Sessions full of size charts, reviews, and returns-policy checks. Shoppers pause
                until they feel safe choosing a size.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Pattern · Drop watchers
              </p>
              <p className="mt-2 text-sm font-medium text-slate-50">
                &quot;I&apos;m waiting for the right moment.&quot;
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Engaged shoppers hovering around low-stock items or new arrivals, waiting for a
                signal before they commit.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: weekly impact + highlight */}
        <section className="mt-14 space-y-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
            2 · 7-day recovered orders snapshot
          </p>
          <h2 className="text-lg font-semibold text-slate-50">
            Weekly impact, tied to real follow-ups.
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Demo data, same logic as your live account: small lifts every day add up to a clear
            weekly impact. Click a day to see which pattern dominated and how Abando followed up.
          </p>

          {/* Weekly impact card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent px-6 py-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Weekly impact
            </p>
            <p className="mt-2 text-lg font-semibold text-emerald-100">
              40+ extra orders and just over $5,040 in recovered revenue in 7 days.
            </p>
            <p className="mt-2 text-sm text-emerald-100/80">
              That&apos;s like adding an extra day of sales each week—without buying more traffic
              or cranking up promo codes. In a live account, this roll-up ties directly to your real
              recovered orders.
            </p>

            {/* Day pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {dayOrder.map((day) => {
                const selected = day === selectedDay;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={[
                      "rounded-full border px-3 py-1 text-xs",
                      selected
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
                        : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-emerald-500/60 hover:text-emerald-100",
                    ].join(" ")}
                  >
                    {DAY_LABELS[day]} · {WEEKLY_ORDERS[day]} orders
                  </button>
                );
              })}
            </div>
          </div>

          {/* Highlight of the day */}
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-slate-950/80 px-6 py-5 shadow-[0_0_60px_rgba(16,185,129,0.25)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Highlight of the day
            </p>
            <p className="mt-2 text-sm font-semibold text-emerald-100">
              {highlight.label}
            </p>

            <div className="mt-5 grid gap-6 md:grid-cols-4">
              {/* Shopper pattern */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Shopper pattern
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-50">
                  {highlight.patternLabel}
                </p>
                <p className="mt-2 text-sm text-slate-300">{highlight.patternQuote}</p>
              </div>

              {/* What's really going on */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  What&apos;s really going on
                </p>
                <p className="mt-2 text-sm text-slate-300">{highlight.whatsGoingOn}</p>
              </div>

              {/* Follow-ups sent */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Follow-ups sent
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {highlight.followUps.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-[0.35rem] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Abando response & why */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                  Abando response &amp; why
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {highlight.responseWhy}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  Under the hood, Abando blends email, SMS, and onsite nudges based on what similar
                  shoppers have historically responded to—so each follow-up feels natural, not noisy,
                  while still protecting your margins.
                </p>
              </div>
            </div>

            <p className="mt-6 border-t border-emerald-500/20 pt-3 text-[0.7rem] text-slate-400">
              In a live account, these follow-ups reflect the real mix of email, SMS, and onsite
              nudges Abando is running against this pattern in your store. The highlight view is
              designed to match what you see in the full playground demo—same patterns, similar
              recovered-orders math, plus channel mix—just anchored inside your Shopify admin.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
TSX

echo "✅ app/embedded/page.tsx rewritten to embedded dashboard v3 (logos + pills + Abando response)"
