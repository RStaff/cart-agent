#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$HOME/projects/cart-agent/abando-frontend"
TARGET="${ROOT_DIR}/app/demo/playground/page.tsx"

echo "[demo] Updating ${TARGET}"

if [ -f "${TARGET}" ]; then
  TS="$(date +%Y%m%d-%H%M%S)"
  cp "${TARGET}" "${TARGET}.bak-${TS}"
  echo "[demo] Backup created at ${TARGET}.bak-${TS}"
fi

cat > "${TARGET}" <<'TSX'
import Link from "next/link";

export default function DemoPlaygroundPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-16">
        {/* HERO */}
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
            Abando • Merchant Daily Play
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            See how Abando reads shopper behavior in a single day.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            This demo pretends we&apos;re running a{" "}
            <span className="font-semibold text-slate-50">
              women&apos;s boutique apparel store
            </span>
            . Abando doesn&apos;t just blast discounts — it watches{" "}
            <span className="font-semibold">behavioral patterns</span> and
            responds with the smallest nudge that can recover the order.
          </p>
        </header>

        {/* TOP EXPLANATION ROW */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold text-slate-100">
              Why break shoppers into patterns at all?
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Not every abandoned cart is the same. Some shoppers are almost
              ready and just need a small nudge. Others are still browsing for
              ideas. Treating them the same either burns margin with too many
              discounts or leaves revenue on the table.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                • <span className="font-semibold">Better fit:</span> messages
                match their actual hesitation instead of shouting &quot;10% OFF&quot;
                at everyone.
              </li>
              <li>
                • <span className="font-semibold">Less noise:</span> fewer
                emails and popups, only when behavior really signals intent.
              </li>
              <li>
                • <span className="font-semibold">Compounding gains:</span>{" "}
                small lifts across several patterns add up to meaningful
                recovered revenue.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold text-slate-100">
              How Abando reads behavior (without creepy tracking)
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Abando listens to Shopify events you already generate —{" "}
              <span className="font-semibold">
                no extra pixels or heatmap scripts needed
              </span>
              . It simply looks at the same signals your team sees in reports,
              but in real time.
            </p>

            <div className="mt-4 grid gap-4 text-xs sm:grid-cols-3 sm:text-sm">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                  1 • Shopify signals
                </p>
                <ul className="mt-2 space-y-1 text-slate-300">
                  <li>• Added to cart</li>
                  <li>• Started checkout</li>
                  <li>• Completed order</li>
                  <li>• Product &amp; collection tags</li>
                  <li>• Campaign / UTM source</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                  2 • Behavior patterns
                </p>
                <ul className="mt-2 space-y-1 text-slate-300">
                  <li>• Last-minute outfit completers</li>
                  <li>• Scroll-and-bounce browsers</li>
                  <li>• Discount-sensitive returners</li>
                  <li>• Routine bundle builders</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-pink-300">
                  3 • Plays Abando can run
                </p>
                <ul className="mt-2 space-y-1 text-slate-300">
                  <li>• Reminder emails &amp; SMS</li>
                  <li>• On-site &quot;finish the look&quot; prompts</li>
                  <li>• Tight, targeted incentives</li>
                  <li>• Guardrails to protect margin</li>
                </ul>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Think of it less like a heatmap and more like a{" "}
              <span className="font-semibold text-slate-200">
                pattern map
              </span>{" "}
              of who tends to abandon, who tends to come back, and which nudges
              work best for each group.
            </p>
          </div>
        </section>

        {/* 7-DAY RECOVERED ORDERS CHART */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold text-slate-100">
              7-day recovered orders (example boutique)
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              This is the kind of view a merchant sees after Abando has watched
              a week of traffic — not a raw log, but a clear summary of{" "}
              <span className="font-semibold">how many orders were saved</span>{" "}
              each day.
            </p>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                    Last 7 days • Recovered revenue
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-300">
                    $4,980
                  </p>
                  <p className="text-xs text-slate-400">
                    from 63 recovered orders (example data)
                  </p>
                </div>
                <div className="text-right text-xs text-emerald-300">
                  <p>+18% vs prior 7 days</p>
                </div>
              </div>

              {/* Simple sparkline-style chart */}
              <div className="mt-4">
                <svg
                  viewBox="0 0 100 30"
                  className="h-16 w-full text-emerald-400"
                  role="img"
                  aria-label="Recovered orders over the last 7 days"
                >
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points="0,24 16,22 33,19 50,15 66,12 83,9 100,7"
                  />
                  {/* baseline */}
                  <line
                    x1="0"
                    y1="24"
                    x2="100"
                    y2="24"
                    stroke="rgba(148,163,184,0.3)"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                </svg>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1 text-center text-[11px] text-slate-300">
                <span>7</span>
                <span>8</span>
                <span>9</span>
                <span>9</span>
                <span>10</span>
                <span>10</span>
                <span>10</span>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Under the hood this comes from the same Shopify events you
                already track — Abando just organizes them into a daily view you
                can act on.
              </p>
            </div>
          </div>

          {/* SIDE IMPACT / TRUST PANEL */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5">
              <h3 className="text-sm font-semibold text-emerald-200">
                Why boutiques trust this playbook
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-emerald-50/90">
                <li>• Patterns are trained on real ecommerce journeys.</li>
                <li>
                  • Plays use behavioral psychology, not hype or dark patterns.
                </li>
                <li>
                  • Guardrails keep copy on-brand so you don&apos;t sound like
                  every other AI popup.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-semibold text-slate-100">
                What most merchants do next
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Start with the vertical playbook that looks closest to your
                store, then connect Shopify so Abando can{" "}
                <span className="font-semibold">
                  watch a week of real traffic
                </span>{" "}
                before you turn anything on.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/marketing/women-boutique/playbook"
                  className="inline-flex items-center justify-center rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-black hover:bg-pink-400"
                >
                  See the full boutique growth plan
                </Link>
                <Link
                  href="/marketing/supplements/playbook"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
                >
                  See supplements playbook
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PATTERN CARDS */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Today&apos;s three key patterns in this boutique demo
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Names are for clarity, not jargon. Each pattern is just a different
            kind of hesitation Abando knows how to respond to.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-emerald-500/40 bg-emerald-950/10 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                Pattern 1 • Outfit completers
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-50">
                &quot;Almost-ready&quot; shoppers
              </h3>
              <p className="mt-2 text-sm text-slate-200">
                They add 2–3 items (top, jeans, maybe a jacket), reach checkout,
                then stall. They&apos;re not browsing — they&apos;re building a
                specific look.
              </p>
              <p className="mt-3 text-xs text-slate-300">
                <span className="font-semibold text-emerald-300">
                  Abando response:
                </span>{" "}
                gentle reminder like &quot;Your look is still in your bag —
                want to finish checking out?&quot; before offering any discount.
              </p>
            </article>

            <article className="rounded-2xl border border-sky-500/40 bg-sky-950/10 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                Pattern 2 • Idea browsers
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-50">
                Scroll-and-bounce visitors
              </h3>
              <p className="mt-2 text-sm text-slate-200">
                They view several collections, maybe tap a size filter, but
                leave without starting checkout. They&apos;re still deciding
                what style feels right.
              </p>
              <p className="mt-3 text-xs text-slate-300">
                <span className="font-semibold text-sky-300">
                  Abando response:
                </span>{" "}
                waits for a clear intent signal (like adding to cart) before
                messaging them, avoiding spammy follow-ups that reduce trust.
              </p>
            </article>

            <article className="rounded-2xl border border-amber-500/40 bg-amber-950/10 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                Pattern 3 • Value checkers
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-50">
                Discount-sensitive returners
              </h3>
              <p className="mt-2 text-sm text-slate-200">
                They come back multiple times to the same items, often through
                email clicks or campaigns, and pause at shipping or total price.
              </p>
              <p className="mt-3 text-xs text-slate-300">
                <span className="font-semibold text-amber-300">
                  Abando response:
                </span>{" "}
                reserves small, time-bound incentives for this group only — so
                you protect margin while still saving the right orders.
              </p>
            </article>
          </div>
        </section>

        {/* DETECTION EXPLANATION */}
        <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-sm font-semibold text-slate-100">
            How does Abando actually detect these patterns?
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Under the hood, Abando is just doing disciplined, repeated analysis
            of the signals Shopify already gives you —{" "}
            <span className="font-semibold">
              no dark patterns, no biometric guessing
            </span>
            .
          </p>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                What inputs does Abando use?
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                <li>• Cart and checkout events from Shopify.</li>
                <li>• Which products / collections were in the cart.</li>
                <li>
                  • Whether the shopper comes back and completes later (and how
                  often).
                </li>
                <li>• Whether they come from campaigns, email, or direct.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                What it doesn&apos;t do
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                <li>• No mouse-position heatmaps.</li>
                <li>• No &quot;creepy&quot; tracking outside your store.</li>
                <li>• No psychological tricks that mislead customers.</li>
                <li>
                  • Just consistent, explainable patterns you can see in your
                  own data.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* NEXT STEPS / CTA */}
        <section className="mt-2 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Next step: pick the vertical playbook that fits you best.
            </h2>
            <p className="text-sm text-slate-300">
              In a real store, Abando would watch a week of traffic, then show
              you which patterns are most common before suggesting plays. From
              there, you can decide when each flow goes live.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/marketing/women-boutique/playbook"
              className="inline-flex items-center justify-center rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-black hover:bg-pink-400"
            >
              See the boutique growth plan
            </Link>
            <Link
              href="/marketing/supplements/playbook"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
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

echo "[demo] New /demo/playground with 7-day chart written to ${TARGET}"
echo "[demo] Now run: npm run dev and open http://localhost:3000/demo/playground"
TSX
