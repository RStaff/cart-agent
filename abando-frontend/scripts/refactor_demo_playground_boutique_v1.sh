#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

if [ -f "$TARGET" ]; then
  echo "[demo] Backing up existing $TARGET -> $BACKUP"
  cp "$TARGET" "$BACKUP"
fi

echo "[demo] Writing boutique-focused /demo/playground ..."

cat << 'TSX' > "$TARGET"
import Link from "next/link";

const sevenDayData = [
  { day: "Mon", recovered: 3 },
  { day: "Tue", recovered: 5 },
  { day: "Wed", recovered: 4 },
  { day: "Thu", recovered: 6 },
  { day: "Fri", recovered: 8 },
  { day: "Sat", recovered: 9 },
  { day: "Sun", recovered: 7 },
];

export default function DemoPlaygroundPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row">
        {/* LEFT COLUMN – Story + Patterns */}
        <div className="flex-1 space-y-6">
          {/* Intro */}
          <section className="rounded-2xl border border-emerald-500/30 bg-slate-950/60 p-6 shadow-lg shadow-emerald-500/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Abando demo · Women&apos;s boutique apparel
            </p>
            <h1 className="mt-3 text-2xl font-semibold lg:text-3xl">
              See how Abando reads shopper behavior and turns it into recovered
              orders.
            </h1>
            <p className="mt-3 text-sm text-emerald-100/80">
              This demo uses a women&apos;s boutique apparel store as an example
              scenario. Abando watches real shopper signals—what they view,
              search, and leave behind in the cart—and turns those patterns into
              clear, testable plays instead of random discounts.
            </p>
          </section>

          {/* How detection works + raw signal sample */}
          <section className="grid gap-4 md:grid-cols-[2fr,1.2fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <h2 className="text-sm font-semibold text-emerald-300">
                1. How Abando detects behavior (no guesswork)
              </h2>
              <p className="mt-2 text-xs text-emerald-50/80 leading-relaxed">
                Inside Shopify, Abando receives{" "}
                <span className="font-medium">clean event streams</span>:
                product views, collection views, searches, add-to-cart,
                checkout started, and abandoned checkouts. Think of it as a
                focused behavior feed, not a creepy screen recording tool.
              </p>
              <p className="mt-2 text-xs text-emerald-50/80 leading-relaxed">
                The app then groups those events into{" "}
                <span className="font-medium">
                  patterns that actually affect purchase decisions
                </span>{" "}
                (like sizing anxiety or promo hunting) instead of drowning you
                in dashboards.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold text-emerald-300">
                Raw signal sample (1 shopper session)
              </p>
              <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/70 p-3 text-[10px] leading-snug text-emerald-100">
{`[
  {
    "session_id": "s_1432",
    "device": "mobile",
    "path": "/products/midi-wrap-dress",
    "searched": "wrap dress size 10",
    "cart_value": 162,
    "status": "checkout_abandoned"
  }
]`}
              </pre>
              <p className="mt-2 text-[11px] text-emerald-200/80">
                Abando sees events like this across hundreds of sessions, then
                groups them into patterns you can actually act on.
              </p>
            </div>
          </section>

          {/* Pattern cards */}
          <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-emerald-300">
                2. Three high-impact patterns in boutique shoppers
              </h2>
              <p className="text-[11px] text-emerald-200/80">
                These examples are tuned to boutique apparel, but the engine
                is configurable for other verticals.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {/* Pattern 1 */}
              <div className="flex flex-col rounded-xl border border-slate-700 bg-slate-950/80 p-4">
                <p className="text-[11px] font-semibold tracking-wide text-emerald-300">
                  PATTERN 1 · CART PARKERS
                </p>
                <h3 className="mt-2 text-sm font-semibold">
                  They park pieces “to think about it”
                </h3>
                <p className="mt-2 text-[11px] text-emerald-100/90">
                  <span className="font-semibold">What&apos;s really going on:</span>{" "}
                  shopper likes the item but is unsure about fit, occasion, or
                  total spend.
                </p>
                <p className="mt-2 text-[11px] text-emerald-100/90">
                  <span className="font-semibold">How Abando responds:</span>{" "}
                  delayed nudge like “Still love this look? Here&apos;s how
                  other customers styled it” instead of a generic 10% off blast.
                </p>
              </div>

              {/* Pattern 2 */}
              <div className="flex flex-col rounded-xl border border-slate-700 bg-slate-950/80 p-4">
                <p className="text-[11px] font-semibold tracking-wide text-amber-300">
                  PATTERN 2 · SIZE CHECKERS
                </p>
                <h3 className="mt-2 text-sm font-semibold">
                  They bounce between sizes & size charts
                </h3>
                <p className="mt-2 text-[11px] text-emerald-100/90">
                  <span className="font-semibold">What&apos;s really going on:</span>{" "}
                  fear of ordering the wrong size, especially on dresses,
                  denim, and fitted tops.
                </p>
                <p className="mt-2 text-[11px] text-emerald-100/90">
                  <span className="font-semibold">How Abando responds:</span>{" "}
                  plays that lead with{" "}
                  <span className="font-medium">
                    sizing confidence and fit proof
                  </span>{" "}
                  (reviews mentioning size, photos, try-at-home messaging) in
                  emails or onsite banners.
                </p>
              </div>

              {/* Pattern 3 */}
              <div className="flex flex-col rounded-xl border border-slate-700 bg-slate-950/80 p-4">
                <p className="text-[11px] font-semibold tracking-wide text-sky-300">
                  PATTERN 3 · DROP WATCHERS
                </p>
                <h3 className="mt-2 text-sm font-semibold">
                  They wait for new arrivals or a better deal
                </h3>
                <p className="mt-2 text-[11px] text-emerald-100/90">
                  <span className="font-semibold">What&apos;s really going on:</span>{" "}
                  shopper is engaged with the brand but habitually waits for a
                  signal—new drop, low-stock alert, or limited-time offer.
                </p>
                <p className="mt-2 text-[11px] text-emerald-100/90">
                  <span className="font-semibold">How Abando responds:</span>{" "}
                  gentle urgency plays tied to low-stock sizes, bundle
                  suggestions, or “last chance for this collection” instead of
                  constant promos.
                </p>
              </div>
            </div>
          </section>

          {/* 7-day recovered orders chart */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-emerald-300">
                  3. What this means over a week
                </h2>
                <p className="mt-1 text-[11px] text-emerald-100/80">
                  This example boutique recovers a handful of extra outfits per
                  day—small wins that add up.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-emerald-200/80">
                  7-day recovered orders (demo data)
                </p>
                <p className="text-lg font-semibold text-emerald-300">
                  42 orders
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-end gap-3">
              {sevenDayData.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-emerald-400/80"
                    style={{ height: `${12 + d.recovered * 6}px` }}
                  />
                  <span className="text-[11px] text-emerald-100/80">
                    {d.day}
                  </span>
                  <span className="text-[10px] text-emerald-300/90">
                    {d.recovered}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[11px] text-emerald-100/80">
              In the live product, this chart is driven by your real Shopify
              data—broken down by pattern, channel, and offer type so you can
              stop guessing which play is actually working.
            </p>
          </section>
        </div>

        {/* RIGHT COLUMN – Today panel + next steps */}
        <aside className="w-full max-w-sm space-y-4 lg:w-80">
          {/* Today snapshot */}
          <section className="rounded-2xl border border-emerald-500/40 bg-slate-950/80 p-5 shadow-lg shadow-emerald-500/20">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              Today&apos;s snapshot (demo data)
            </p>
            <h2 className="mt-2 text-sm font-semibold">
              If this were your boutique today…
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                <p className="text-emerald-200/80">Recovered orders</p>
                <p className="mt-1 text-lg font-semibold text-emerald-300">
                  6
                </p>
                <p className="mt-1 text-[10px] text-emerald-100/70">
                  From cart parkers &amp; size checkers.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                <p className="text-emerald-200/80">Extra revenue</p>
                <p className="mt-1 text-lg font-semibold text-emerald-300">
                  $742
                </p>
                <p className="mt-1 text-[10px] text-emerald-100/70">
                  At an average order value of $120–$140.
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-emerald-100/80">
              The psychology matters because it nudges the{" "}
              <span className="font-semibold">real hesitation</span>—fit,
              styling, timing—instead of just shouting “10% OFF!” at everyone.
            </p>
          </section>

          {/* What you actually do next */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-[11px] font-semibold text-emerald-300">
              4. What you&apos;d actually do next
            </p>
            <ol className="mt-2 space-y-2 text-[11px] text-emerald-100/85 list-decimal list-inside">
              <li>
                <span className="font-semibold">Connect your Shopify store</span>{" "}
                so Abando can see real behavior streams.
              </li>
              <li>
                Start with{" "}
                <span className="font-semibold">one pattern</span> (often Cart
                Parkers) and turn on a single, clear play.
              </li>
              <li>
                Watch recovered orders for 7–14 days, then add a second pattern
                or channel once the first is working.
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
                href="/marketing/supplements/playbook"
                className="inline-flex w-full items-center justify-center rounded-lg border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/10"
              >
                See supplements playbook
              </Link>
              <p className="text-[10px] text-emerald-200/80">
                Most merchants start by improving one pattern (like cart
                parkers), then expand to additional plays as recovered orders
                grow.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
TSX

echo "[demo] New boutique-focused /demo/playground written to ${TARGET}"
echo "[demo] Now run: npm run dev and open http://localhost:3000/demo/playground"
