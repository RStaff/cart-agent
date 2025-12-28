#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🔧 Scaffolding Vertical Growth Playbook pages…"

# Ensure folders exist
mkdir -p app/marketing/women-boutique/playbook
mkdir -p app/marketing/supplements/playbook

#############################################
# /marketing/women-boutique/playbook
#############################################
cat << 'TSX' > app/marketing/women-boutique/playbook/page.tsx
import Link from "next/link";

export default function BoutiquePlaybookPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold tracking-wide text-slate-300">
            Playbook · Women&apos;s boutique Shopify stores
          </span>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Boutique Vertical Growth Playbook
          </h1>
          <p className="max-w-2xl text-slate-300">
            A 60–90 day plan for turning “just browsing” into repeat boutique
            customers. Use these plays as the default Abando setup for women’s
            fashion &amp; lifestyle brands.
          </p>
        </div>

        {/* Quick stats / context */}
        <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Who this is for
            </p>
            <p className="mt-2 text-sm text-slate-100">
              1–3 person teams running product drops, seasonal collections, and
              curated outfits on Shopify.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Abando focuses on
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-100">
              <li>• First-time orders from “window shoppers”</li>
              <li>• Repeat purchases from dress &amp; basics buyers</li>
              <li>• Clean, on-brand reminders (no cringe flows)</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              What you get
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-100">
              <li>• Pre-built segments for boutique behaviors</li>
              <li>• A weekly “what drove recovered revenue” report</li>
              <li>• A clear 60–90 day experiment to judge lift</li>
            </ul>
          </div>
        </section>

        {/* Plays */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Core plays for this vertical</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            These three plays form the default Abando configuration for boutique
            apparel. You can tune copy and discounts, but the triggers and
            segments stay stable so your data stays trustworthy.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Play 1 */}
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Play 1 · First-time dress save
              </p>
              <h3 className="mt-2 text-base font-semibold">
                Rescue first-time carts over \$120
              </h3>
              <p className="mt-3 flex-1 text-sm text-slate-300">
                When a new shopper abandons a cart with dresses or outfits over
                \$120, Abando nudges them with a small, time-boxed incentive and
                reassurance on shipping and returns.
              </p>
              <dl className="mt-4 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <dt>Channel</dt>
                  <dd>SMS + email</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Trigger</dt>
                  <dd>Exit or 2–4 hours post-abandon</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Main KPI</dt>
                  <dd>Recovered first-time orders</dd>
                </div>
              </dl>
            </div>

            {/* Play 2 */}
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Play 2 · Repeat basics buyers
              </p>
              <h3 className="mt-2 text-base font-semibold">
                Bring back “loyal basics” customers
              </h3>
              <p className="mt-3 flex-1 text-sm text-slate-300">
                Shoppers who repeatedly buy staples (tees, denim, basics) get a
                gentle “we saved your size” reminder instead of heavy discounts,
                protecting margin while nudging the next order.
              </p>
              <dl className="mt-4 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <dt>Segment</dt>
                  <dd>Loyal basics buyers</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Timing</dt>
                  <dd>2–7 days after last browse</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Main KPI</dt>
                  <dd>Recovered repeat revenue</dd>
                </div>
              </dl>
            </div>

            {/* Play 3 */}
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Play 3 · Drop launches
              </p>
              <h3 className="mt-2 text-base font-semibold">
                Turn “just browsing” into launch buyers
              </h3>
              <p className="mt-3 flex-1 text-sm text-slate-300">
                For new collections, Abando remembers shoppers who browsed but
                bounced, then sends a launch-day reminder that matches your
                brand&apos;s tone, not generic urgency spam.
              </p>
              <dl className="mt-4 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <dt>Segment</dt>
                  <dd>Browsed but no purchase</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Timing</dt>
                  <dd>On launch day &amp; 48h later</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Main KPI</dt>
                  <dd>Lift on new-drop sell-through</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* How it connects + CTAs */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">How this connects in Abando</h2>
            <p className="max-w-xl text-sm text-slate-300">
              When you connect your boutique store, Abando starts with these
              default segments and plays. You can adjust tone and incentives,
              while the underlying cohort math stays consistent so finance can
              trust the numbers.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:w-60">
            <Link
              href="/marketing/demo/playground"
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
            >
              View live demo
            </Link>
            <Link
              href="/marketing/verticals/women-boutique"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
            >
              See the Vertical Growth Engine →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
TSX

#############################################
# /marketing/supplements/playbook
#############################################
cat << 'TSX' > app/marketing/supplements/playbook/page.tsx
import Link from "next/link";

export default function SupplementsPlaybookPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold tracking-wide text-slate-300">
            Playbook · DTC supplements &amp; wellness
          </span>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Supplements Vertical Growth Playbook
          </h1>
          <p className="max-w-2xl text-slate-300">
            A focused set of plays for brands selling stacks, bundles, and
            subscriptions on Shopify. Built to protect compliance while you
            recover more first-time and refill orders.
          </p>
        </div>

        {/* Context */}
        <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Who this is for
            </p>
            <p className="mt-2 text-sm text-slate-100">
              Brands doing roughly 200–2,000 orders/month on Shopify with
              subscription or refill behavior.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Abando focuses on
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-100">
              <li>• First-time stack buyers</li>
              <li>• Refill and subscription renewals</li>
              <li>• High-margin bundles that can&apos;t be over-discounted</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              What you get
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-100">
              <li>• Guardrails around claims &amp; messaging</li>
              <li>• SKU + bundle-level recovery insight</li>
              <li>• A clean 60–90 day experiment to judge lift</li>
            </ul>
          </div>
        </section>

        {/* Plays */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Core plays for this vertical</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            These plays are tuned for supplement funnels where compliance and
            LTV matter as much as raw conversion. They&apos;re designed to plug
            into your existing email/SMS tools, not replace them.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Play 1 */}
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Play 1 · First-time stack rescue
              </p>
              <h3 className="mt-2 text-base font-semibold">
                Recover new customers abandoning high-value stacks
              </h3>
              <p className="mt-3 flex-1 text-sm text-slate-300">
                When a new visitor abandons a cart with a best-selling stack,
                Abando sends a compliant reminder focusing on benefits, not
                disease claims, plus a small “first order” incentive.
              </p>
              <dl className="mt-4 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <dt>Channel</dt>
                  <dd>Email + optional SMS</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Trigger</dt>
                  <dd>Abandon + 1–3 hours</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Main KPI</dt>
                  <dd>Recovered first-time revenue</dd>
                </div>
              </dl>
            </div>

            {/* Play 2 */}
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Play 2 · Refill protection
              </p>
              <h3 className="mt-2 text-base font-semibold">
                Nudge subscribers before they run out
              </h3>
              <p className="mt-3 flex-1 text-sm text-slate-300">
                For subscribers who browse but don&apos;t complete a refill,
                Abando sends a “running low soon” reminder that keeps them with
                you instead of drifting to a cheaper competitor.
              </p>
              <dl className="mt-4 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <dt>Segment</dt>
                  <dd>Active subs + recent browse</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Timing</dt>
                  <dd>7–10 days before expected run-out</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Main KPI</dt>
                  <dd>Reduced refill churn</dd>
                </div>
              </dl>
            </div>

            {/* Play 3 */}
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Play 3 · High-margin bundle guardrail
              </p>
              <h3 className="mt-2 text-base font-semibold">
                Recover bundles without racing to the bottom
              </h3>
              <p className="mt-3 flex-1 text-sm text-slate-300">
                For premium bundles, Abando emphasizes value, social proof, and
                education instead of heavy discounts so you can protect AOV and
                CAC payback period.
              </p>
              <dl className="mt-4 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <dt>Segment</dt>
                  <dd>High-margin bundles</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Timing</dt>
                  <dd>Abandon + 24–48 hours</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Main KPI</dt>
                  <dd>Recovered bundle revenue</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* How it connects + CTAs */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">How this connects in Abando</h2>
            <p className="max-w-xl text-sm text-slate-300">
              Once your Shopify store is connected, Abando maps your SKUs into
              these segments and plays. Your team can approve copy and
              guardrails while Abando handles the timing and cohort tracking.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:w-60">
            <Link
              href="/marketing/demo/playground"
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
            >
              View live demo
            </Link>
            <Link
              href="/verticals/supplements"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
            >
              See the Vertical Growth Engine →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
TSX

#############################################
# Patch CTAs on existing marketing pages
#############################################

if [ -f app/marketing/women-boutique/page.tsx ]; then
  echo "🔁 Updating boutique CTA to point at playbook…"
  perl -pi -e 's#href="/marketing/verticals/women-boutique"#href="/marketing/women-boutique/playbook"#g' app/marketing/women-boutique/page.tsx
fi

if [ -f app/marketing/supplements/page.tsx ]; then
  echo "🔁 Updating supplements CTA to point at playbook…"
  perl -pi -e 's#href="/verticals/supplements"#href="/marketing/supplements/playbook"#g' app/marketing/supplements/page.tsx
fi

echo "✅ Playbook pages created."
echo "Next steps:"
echo "  1) npm run dev"
echo "  2) Visit:"
echo "       • http://localhost:3000/marketing/women-boutique/playbook"
echo "       • http://localhost:3000/marketing/supplements/playbook"
