#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

if [ -f "$TARGET" ]; then
  echo "[demo] Backing up existing ${TARGET} -> ${BACKUP}"
  cp "$TARGET" "$BACKUP"
fi

cat << 'TSX' > "$TARGET"
import Link from "next/link";

type RecoveredPoint = {
  day: string;
  orders: number;
};

const recovered7Day: RecoveredPoint[] = [
  { day: "Mon", orders: 3 },
  { day: "Tue", orders: 4 },
  { day: "Wed", orders: 6 },
  { day: "Thu", orders: 5 },
  { day: "Fri", orders: 7 },
  { day: "Sat", orders: 8 },
  { day: "Sun", orders: 9 },
];

const maxOrders = Math.max(...recovered7Day.map((p) => p.orders));

export default function DemoPlaygroundPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row lg:py-12">
        {/* MAIN COLUMN */}
        <div className="flex-1 space-y-8">
          {/* Intro */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Demo · Abando Merchant Daily Play
            </p>
            <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">
              How Abando thinks about your shoppers in real time
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              This demo uses a women&apos;s boutique apparel store as an example
              scenario. In production, Abando watches your checkout, browse, and
              cart activity, then groups shoppers into a few{" "}
              <span className="font-semibold text-emerald-300">
                behavior patterns
              </span>{" "}
              so you can respond with the right play.
            </p>
          </section>

          {/* Segmentation explainer */}
          <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
            <h2 className="mb-2 text-sm font-semibold">
              Why segments instead of &quot;everyone who abandoned&quot;?
            </h2>
            <p className="mb-4 text-xs text-slate-300">
              Not every abandoned cart is the same. Some shoppers are comparing
              outfits on their phone at work. Others park items while they wait
              for payday. Treating them all the same leads to noisy discounts
              and trained bargain hunters.
            </p>
            <p className="text-xs text-slate-300">
              Abando focuses on a small set of{" "}
              <span className="font-semibold text-emerald-300">
                clear shopper patterns
              </span>
              . That keeps your strategy simple, measurable, and easy to iterate
              on with your team.
            </p>
          </section>

          {/* Pattern cards */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold">Today&apos;s key patterns</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {/* Pattern 1 */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  Pattern 1 · Last-minute comparers
                </p>
                <p className="mb-2 text-sm font-semibold">
                  Shoppers checking one more option before committing
                </p>
                <p className="mb-2 text-[11px] text-slate-300">
                  <span className="font-semibold text-slate-100">
                    What&apos;s really going on:
                  </span>{" "}
                  They like the item, but want reassurance on fit, style, or
                  price before clicking &quot;Buy&quot;.
                </p>
                <p className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-100">
                    How Abando responds:
                  </span>{" "}
                  Sends a quick reminder with social proof (“customers like you
                  loved…”) instead of a heavy discount.
                </p>
              </div>

              {/* Pattern 2 */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  Pattern 2 · Cart parkers
                </p>
                <p className="mb-2 text-sm font-semibold">
                  Shoppers who use the cart as a &quot;save for later&quot;
                  shelf
                </p>
                <p className="mb-2 text-[11px] text-slate-300">
                  <span className="font-semibold text-slate-100">
                    What&apos;s really going on:
                  </span>{" "}
                  They&apos;re interested but timing, budget, or decision fatigue
                  is in the way right now.
                </p>
                <p className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-100">
                    How Abando responds:
                  </span>{" "}
                  Uses gentle check-ins (“ready to finish your look?”) and small
                  nudges instead of aggressive countdown timers.
                </p>
              </div>

              {/* Pattern 3 */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  Pattern 3 · Warming window shoppers
                </p>
                <p className="mb-2 text-sm font-semibold">
                  Browsers who return multiple times before adding to cart
                </p>
                <p className="mb-2 text-[11px] text-slate-300">
                  <span className="font-semibold text-slate-100">
                    What&apos;s really going on:
                  </span>{" "}
                  They like the brand but haven&apos;t seen the right piece or
                  offer to tip them into trying you.
                </p>
                <p className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-100">
                    How Abando responds:
                  </span>{" "}
                  Highlights new arrivals, curated outfits, or bundles that match
                  what they&apos;ve viewed instead of repeating the same hero
                  banner.
                </p>
              </div>
            </div>
          </section>

          {/* Raw signal sample + interpretation */}
          <section className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/80 p-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div>
              <h2 className="mb-2 text-sm font-semibold">
                What the raw signal looks like
              </h2>
              <p className="mb-3 text-[11px] text-slate-300">
                Under the hood, Abando is watching anonymous event streams like:
              </p>
              <pre className="overflow-x-auto rounded-md bg-slate-950/90 p-3 text-[10px] text-emerald-200">
{`[
  {
    "sessionId": "a9f…",
    "events": [
      "view:/dresses/midi-floral",
      "add_to_cart:SKU-DF-102",
      "view:/returns-policy",
      "abandon_checkout"
    ]
  },
  {
    "sessionId": "b3c…",
    "events": [
      "view:/tops/cropped-knit",
      "add_to_cart:SKU-CK-204",
      "abandon_checkout"
    ]
  }
]`}
              </pre>
            </div>
            <div className="space-y-2 rounded-lg bg-slate-900/70 p-4">
              <h3 className="text-xs font-semibold text-emerald-300">
                How Abando interprets it
              </h3>
              <p className="text-[11px] text-slate-300">
                Instead of showing you raw logs, Abando groups these into
                simple, human-readable insights your team can act on:
              </p>
              <ul className="space-y-1 text-[11px] text-slate-200">
                <li>• 38% of abandons checked returns policy first</li>
                <li>• 24% abandoned after comparing 3+ dress styles</li>
                <li>• 18% abandoned while building full outfits</li>
              </ul>
              <p className="pt-1 text-[11px] text-slate-400">
                Each pattern maps to a small set of plays (emails, SMS, onsite
                prompts) so you&apos;re not guessing which message to send.
              </p>
            </div>
          </section>

          {/* 7-day recovered orders "chart" */}
          <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-5">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">
                  7-day recovered orders snapshot
                </h2>
                <p className="text-[11px] text-slate-300">
                  Simple view of how many extra orders came from Abando plays
                  this week.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Recovered orders (7d)</p>
                <p className="text-lg font-semibold text-emerald-300">
                  {recovered7Day.reduce((sum, p) => sum + p.orders, 0)}
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-end gap-2">
              {recovered7Day.map((point) => (
                <div key={point.day} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-24 w-full items-end justify-center rounded-md bg-slate-900">
                    <div
                      className="w-3 rounded-sm bg-emerald-400/80"
                      style={{
                        height: `${(point.orders / maxOrders) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {point.day}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-300">
                    {point.orders}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              In a live account, this view connects straight to your revenue and
              lets you compare patterns (cart parkers vs. last-minute comparers)
              so you know where to focus next week.
            </p>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="w-full max-w-sm space-y-5 lg:w-80">
          {/* Context & authority */}
          <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-5">
            <h2 className="mb-2 text-sm font-semibold">
              What this demo is (and isn&apos;t)
            </h2>
            <p className="mb-2 text-[11px] text-slate-300">
              This isn&apos;t a fake &quot;AI magic&quot; animation. It&apos;s
              a realistic sketch of how Abando observes sessions, groups them
              into patterns, and shows you the impact in plain numbers.
            </p>
            <p className="text-[11px] text-slate-400">
              The goal is to help your team say, &quot;Okay, we see what&apos;s
              happening with our shoppers, and we know which three plays to run
              next.&quot;
            </p>
          </section>

          {/* Next steps */}
          <section className="space-y-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5">
            <h2 className="text-sm font-semibold text-emerald-200">
              What you&apos;d do next with Abando
            </h2>
            <ol className="mb-2 space-y-1 text-[11px] text-emerald-100/90">
              <li>1. Connect your Shopify store (1–2 minutes).</li>
              <li>2. Let Abando quietly observe a week of traffic.</li>
              <li>
                3. Turn on 2–3 plays for your strongest shopper patterns first.
              </li>
            </ol>
            <div className="space-y-2">
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
            </div>
            <p className="text-[10px] text-emerald-200/80">
              Most merchants start by improving one pattern (like cart parkers),
              then expand to additional plays as recovered orders grow.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
TSX

echo "[demo] New psych-focused /demo/playground written to ${TARGET}"
echo "[demo] Now run: npm run dev and open http://localhost:3000/demo/playground"
