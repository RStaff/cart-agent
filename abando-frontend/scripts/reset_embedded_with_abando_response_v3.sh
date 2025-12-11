#!/usr/bin/env bash
set -euo pipefail

# Run from repo root
cd "$(dirname "$0")/.."

FILE="app/embedded/page.tsx"

if [ -f "$FILE" ]; then
  backup="${FILE}.before_embedded_v3_$(date +%s).tsx"
  cp "$FILE" "$backup"
  echo "💾 Backup written to: $backup"
fi

cat > "$FILE" << 'TSX'
import React from "react";

export default function EmbeddedPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Abando dashboard · Live view of recovered orders &amp; shopper patterns
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              See how Abando turned this week&apos;s hesitations into extra orders.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              This embedded view lines up with what shoppers actually did in your store. Instead of one big
              &quot;abandoned&quot; bucket, Abando groups sessions into a few hesitation patterns and quietly runs
              follow-ups that match how each shopper is hesitating.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Embedded in
            </p>
            <p className="mt-2 text-sm font-medium text-slate-200">
              Shopify admin
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Abando stays in sync with your real orders, discounts, and campaigns.
            </p>
          </div>
        </header>

        {/* Top metrics row */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Recovered revenue · 7 days
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-100">
              $5,040
            </p>
            <p className="mt-2 text-sm text-emerald-100/80">
              Revenue that would likely have been lost without Abando&apos;s plays.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Extra orders · 7 days
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
              42+ orders
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Small daily lifts that add up across Cart Parkers, Size Checkers, and Drop Watchers.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Psychological impact
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
              ~1 extra day of sales
            </p>
            <p className="mt-2 text-sm text-slate-400">
              At this pace, each week feels like adding another full day of revenue—without more traffic. We surface
              this so you can feel the breathing room Abando is buying you.
            </p>
          </div>
        </section>

        {/* Section 1: patterns */}
        <section className="mt-12">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
            1 · What Abando is seeing this week
          </p>
          <h2 className="mt-3 text-lg font-semibold text-slate-50">
            Same shoppers, clearer patterns.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Instead of one big &quot;abandoned&quot; bucket, Abando groups sessions into hesitation types. That makes it
            obvious where your extra orders are really coming from—and how to talk to those shoppers.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Pattern · Cart parkers
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                &quot;I like it… I just need to think.&quot;
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Shoppers park outfits in the cart while they think about fit, occasion, and total spend. They need
                reassurance and styling ideas more than a heavier discount.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Pattern · Size checkers
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                &quot;I&apos;ll buy once I&apos;m sure it fits.&quot;
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Sessions full of size charts, reviews, and returns-policy checks. Shoppers pause until they feel safe
                choosing a size.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Pattern · Drop watchers
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                &quot;I&apos;m waiting for the right moment.&quot;
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Engaged shoppers hovering around low-stock items or new arrivals, waiting for a signal before they
                commit.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: weekly impact + highlight */}
        <section className="mt-12">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
            2 · 7-day recovered orders snapshot
          </p>
          <h2 className="mt-3 text-lg font-semibold text-slate-50">
            Weekly impact, tied to real follow-ups.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Demo data, same logic as your live account: small lifts every day add up to a clear weekly impact.
            Click a day to see which pattern dominated and how Abando followed up.
          </p>

          {/* Weekly impact card */}
          <div className="mt-6 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Weekly impact
            </p>
            <p className="mt-3 text-lg font-semibold text-emerald-50">
              40+ extra orders and just over $5,040 in recovered revenue in 7 days.
            </p>
            <p className="mt-2 text-sm text-emerald-100/80">
              That&apos;s like adding an extra day of sales each week—without buying more traffic or cranking up promo
              codes. In a live account, this roll-up ties directly to your real recovered orders.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {["Mon · 3 orders", "Tue · 5 orders", "Wed · 6 orders", "Thu · 5 orders", "Fri · 7 orders", "Sat · 8 orders", "Sun · 8 orders"].map(
                (label, idx) => (
                  <button
                    key={label}
                    type="button"
                    className={`rounded-full border px-3 py-1 ${
                      label.startsWith("Sat")
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-100"
                        : "border-slate-700 bg-slate-900/80 text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Highlight of the day card */}
          <div className="mt-6 rounded-3xl border border-emerald-500/25 bg-slate-950/70 p-5 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Highlight of the day
            </p>
            <p className="mt-3 text-sm font-medium text-emerald-100">
              Sat · 8 orders: 8 recovered orders ($920 demo revenue)
            </p>

            <div className="mt-4 grid gap-6 md:grid-cols-4">
              {/* Shopper pattern */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Shopper pattern
                </p>
                <p className="mt-2 text-sm font-medium text-slate-100">
                  Drop watchers
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  &quot;I&apos;m waiting for the right moment.&quot;
                </p>
              </div>

              {/* What&apos;s really going on */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  What&apos;s really going on
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Engaged shoppers hovering around low-stock items or new arrivals, waiting for a clear signal before
                  they commit. They&apos;re primed to buy but anxious about missing the best drop.
                </p>
              </div>

              {/* Follow-ups sent */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Follow-ups sent
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  <li>• Email: low-stock and &quot;last chance for this drop&quot; nudges.</li>
                  <li>• SMS: short urgency pings around key sizes or outfits.</li>
                  <li>• Onsite: subtle low-stock &amp; countdown cues on return visits.</li>
                </ul>
              </div>

              {/* Abando response & why */}
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-emerald-400">
                  Abando response &amp; why
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Abando&apos;s AI recognizes this as a &quot;drop watcher&quot; pattern and chooses the lightest
                  possible push that can still move the shopper. It leans on urgency around low-stock, not bigger
                  coupons.
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Under the hood, Abando blends email, SMS, and onsite cues based on what similar shoppers have
                  historically responded to—so each follow-up feels natural, not noisy, while still protecting your
                  margins.
                </p>
              </div>
            </div>

            <p className="mt-5 text-[0.7rem] text-slate-500">
              In a live account, these follow-ups reflect the real mix of email, SMS, and onsite nudges Abando is
              running against this pattern in your store. The highlight view is designed to match what you see in the
              full playground demo—same patterns, similar recovered-orders math, plus channel mix—just anchored inside
              your Shopify admin.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
TSX

echo "✅ Embedded dashboard updated to v3 with 'Abando response & why' highlight column."
