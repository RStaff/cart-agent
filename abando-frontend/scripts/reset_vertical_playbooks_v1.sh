#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🔧 Resetting vertical playbook pages…"

# Make sure folders exist
mkdir -p app/marketing/women-boutique/playbook
mkdir -p app/marketing/supplements/playbook

########################################
# Boutique Vertical Playbook
########################################
cat << 'TSX' > app/marketing/women-boutique/playbook/page.tsx
export default function BoutiqueVerticalPlaybookPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-6 py-16">
      <header className="max-w-5xl mx-auto mb-12">
        <p className="text-xs tracking-wide text-pink-300 mb-3">
          Playbook · Women&apos;s boutique Shopify stores
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-4">
          Boutique Vertical Growth Playbook
        </h1>
        <p className="text-slate-300 max-w-2xl">
          A 60–90 day plan for turning “just browsing” into repeat boutique
          customers. Use these plays as the default Abando setup for women&apos;s
          fashion &amp; lifestyle brands.
        </p>
      </header>

      <section className="max-w-5xl mx-auto mb-10 grid md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xs text-slate-400 mb-2">WHO THIS IS FOR</h3>
          <p className="text-sm text-slate-100">
            1–3 person teams running product drops, seasonal collections, and
            curated outfits on Shopify.
          </p>
        </div>
        <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xs text-slate-400 mb-2">ABANDO FOCUSES ON</h3>
          <ul className="text-sm text-slate-100 space-y-1">
            <li>• First-time orders from “window shoppers”</li>
            <li>• Repeat basics buyers (denim, tees, staples)</li>
            <li>• Clean, on-brand reminders (no cringe flows)</li>
          </ul>
        </div>
        <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xs text-slate-400 mb-2">WHAT YOU GET</h3>
          <ul className="text-sm text-slate-100 space-y-1">
            <li>• Pre-built segments for boutique behaviours</li>
            <li>• A weekly “what drove recovered revenue” report</li>
            <li>• A clear 60–90 day experiment to judge lift</li>
          </ul>
        </div>
      </section>

      <section className="max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold mb-6">Core plays for this vertical</h2>
        <p className="text-sm text-slate-300 mb-6 max-w-2xl">
          These three plays form the default Abando configuration for boutique
          apparel. You can tune copy and discounts, but the triggers and
          segments stay stable so your data stays trustworthy.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
            <p className="text-[11px] tracking-wide text-pink-300 mb-2">
              PLAY 1 · FIRST-TIME DRESS SAVE
            </p>
            <h3 className="font-semibold mb-3">
              Rescue first-time carts over $120
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              When a new shopper abandons a cart with dresses or outfits over
              $120, Abando nudges them with a small, time-boxed incentive and
              reassurance on shipping and returns.
            </p>
            <dl className="text-xs text-slate-400 space-y-1">
              <div>
                <dt className="inline font-semibold text-slate-300">Channel:</dt>{" "}
                <dd className="inline">SMS + email</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Trigger:</dt>{" "}
                <dd className="inline">Exit or 2–4 hours post-abandon</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Main KPI:</dt>{" "}
                <dd className="inline">Recovered first-time orders</dd>
              </div>
            </dl>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
            <p className="text-[11px] tracking-wide text-pink-300 mb-2">
              PLAY 2 · REPEAT BASICS BUYERS
            </p>
            <h3 className="font-semibold mb-3">
              Bring back “loyal basics” customers
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              Shoppers who repeatedly buy staples (tees, denim, basics) get a
              gentle “we saved your size” reminder instead of heavy discounts,
              protecting margin while nudging the next order.
            </p>
            <dl className="text-xs text-slate-400 space-y-1">
              <div>
                <dt className="inline font-semibold text-slate-300">Segment:</dt>{" "}
                <dd className="inline">Loyal basics buyers</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Timing:</dt>{" "}
                <dd className="inline">2–7 days after last browse</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Main KPI:</dt>{" "}
                <dd className="inline">Recovered repeat revenue</dd>
              </div>
            </dl>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
            <p className="text-[11px] tracking-wide text-pink-300 mb-2">
              PLAY 3 · DROP LAUNCHES
            </p>
            <h3 className="font-semibold mb-3">
              Turn “just browsing” into launch buyers
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              For new collections, Abando remembers shoppers who browsed but
              bounced, then sends a launch-day reminder that matches your
              boutique&apos;s tone, not generic urgency spam.
            </p>
            <dl className="text-xs text-slate-400 space-y-1">
              <div>
                <dt className="inline font-semibold text-slate-300">Segment:</dt>{" "}
                <dd className="inline">Browsed but no purchase</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Timing:</dt>{" "}
                <dd className="inline">On launch day &amp; 48h later</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Main KPI:</dt>{" "}
                <dd className="inline">Lift on new-drop sell-through</dd>
              </div>
            </dl>
          </div>
        </div>

        <section className="mt-10 p-6 bg-slate-900/40 border border-slate-700 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-semibold mb-2">How this connects in Abando</h3>
            <p className="text-sm text-slate-300 max-w-xl">
              When you connect your boutique store, Abando starts with these
              default segments and plays. You can adjust tone and incentives,
              while the underlying cohort math stays consistent so finance can
              trust the numbers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-3 md:mt-0">
            <a
              href="/marketing/demo/playground"
              className="inline-block bg-green-400 text-black px-6 py-3 rounded-lg font-semibold text-sm hover:bg-green-300 text-center"
            >
              View live demo
            </a>
            <a
              href="/marketing/verticals/women-boutique"
              className="inline-block border border-slate-600 px-6 py-3 rounded-lg font-semibold text-sm text-slate-100 hover:bg-slate-900 text-center"
            >
              See the Vertical Growth Engine →
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}
TSX

########################################
# Supplements & Wellness Playbook
########################################
cat << 'TSX' > app/marketing/supplements/playbook/page.tsx
export default function SupplementsVerticalPlaybookPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-6 py-16">
      <header className="max-w-5xl mx-auto mb-12">
        <p className="text-xs tracking-wide text-emerald-300 mb-3">
          Playbook · DTC supplements &amp; wellness brands
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-4">
          Supplements Vertical Growth Playbook
        </h1>
        <p className="text-slate-300 max-w-2xl">
          A 60–90 day experiment for plugging leaks in your checkout &amp; refill
          funnel. Use these plays as the default Abando setup for subscription-
          friendly supplements and wellness brands.
        </p>
      </header>

      <section className="max-w-5xl mx-auto mb-10 grid md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xs text-slate-400 mb-2">WHO THIS IS FOR</h3>
          <p className="text-sm text-slate-100">
            DTC brands doing ~200–2,000 orders/month on Shopify with stacks,
            bundles, and subscriptions.
          </p>
        </div>
        <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xs text-slate-400 mb-2">ABANDO FOCUSES ON</h3>
          <ul className="text-sm text-slate-100 space-y-1">
            <li>• First-time checkout completes</li>
            <li>• On-time refills before people churn</li>
            <li>• Cross-selling into higher-value bundles</li>
          </ul>
        </div>
        <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xs text-slate-400 mb-2">WHAT YOU GET</h3>
          <ul className="text-sm text-slate-100 space-y-1">
            <li>• Lift on first-time order rate</li>
            <li>• More active subscribers per 90-day cohort</li>
            <li>• Clear CAC/LTV protection by offer</li>
          </ul>
        </div>
      </section>

      <section className="max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold mb-6">Core plays for this vertical</h2>
        <p className="text-sm text-slate-300 mb-6 max-w-2xl">
          These three plays form the default Abando configuration for
          supplements &amp; wellness. You can swap copy and incentive levels,
          but the underlying segments stay fixed so performance stays clean.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
            <p className="text-[11px] tracking-wide text-emerald-300 mb-2">
              PLAY 1 · FIRST-TIME CHECKOUT SAVE
            </p>
            <h3 className="font-semibold mb-3">
              Recover first-time carts at checkout
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              When a new visitor bails at checkout with a single product or
              starter stack, Abando sends a light-touch reminder with a small
              incentive rather than a heavy discount.
            </p>
            <dl className="text-xs text-slate-400 space-y-1">
              <div>
                <dt className="inline font-semibold text-slate-300">Channel:</dt>{" "}
                <dd className="inline">Email first, SMS optional</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Trigger:</dt>{" "}
                <dd className="inline">1–3 hours after abandon</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Main KPI:</dt>{" "}
                <dd className="inline">Recovered first-time orders</dd>
              </div>
            </dl>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
            <p className="text-[11px] tracking-wide text-emerald-300 mb-2">
              PLAY 2 · REFILL PROTECTION
            </p>
            <h3 className="font-semibold mb-3">
              Protect your refill schedule
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              Subscribers who are due to run out get a timely nudge so you
              don&apos;t lose them to Amazon or a cheaper competitor.
            </p>
            <dl className="text-xs text-slate-400 space-y-1">
              <div>
                <dt className="inline font-semibold text-slate-300">Segment:</dt>{" "}
                <dd className="inline">Active subscribers, nearing refill</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Timing:</dt>{" "}
                <dd className="inline">7–10 days before expected run-out</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Main KPI:</dt>{" "}
                <dd className="inline">On-time refill rate</dd>
              </div>
            </dl>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700">
            <p className="text-[11px] tracking-wide text-emerald-300 mb-2">
              PLAY 3 · BUNDLE COMPLETION
            </p>
            <h3 className="font-semibold mb-3">Increase bundle completion</h3>
            <p className="text-sm text-slate-300 mb-4">
              Shoppers who bought part of a routine get nudged with
              “complete your morning set” messaging—focused on outcomes, not
              spammy upsells.
            </p>
            <dl className="text-xs text-slate-400 space-y-1">
              <div>
                <dt className="inline font-semibold text-slate-300">Segment:</dt>{" "}
                <dd className="inline">Partial bundle buyers</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Timing:</dt>{" "}
                <dd className="inline">3–10 days after first purchase</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-slate-300">Main KPI:</dt>{" "}
                <dd className="inline">Bundle completion revenue</dd>
              </div>
            </dl>
          </div>
        </div>

        <section className="mt-10 p-6 bg-slate-900/40 border border-slate-700 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-semibold mb-3">How this connects in Abando</h3>
            <p className="text-sm text-slate-300 max-w-xl">
              These plays form the foundation for supplements merchants inside
              Abando&apos;s vertical engine. You can tune tone, offers, and
              guardrails while the system keeps the math and segments stable.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-3 md:mt-0">
            <a
              href="/marketing/demo/playground"
              className="inline-block bg-emerald-400 text-black px-6 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-300 text-center"
            >
              View live demo
            </a>
            <a
              href="/verticals/supplements"
              className="inline-block border border-slate-600 px-6 py-3 rounded-lg font-semibold text-sm text-slate-100 hover:bg-slate-900 text-center"
            >
              See the Vertical Growth Engine →
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}
TSX

########################################
# Ensure marketing CTAs point to playbooks
########################################

if [ -f app/marketing/women-boutique/page.tsx ]; then
  echo "🔁 Updating boutique CTA to point at boutique playbook…"
  perl -pi -e 's#href="/marketing/verticals/women-boutique"#href="/marketing/women-boutique/playbook"#g' app/marketing/women-boutique/page.tsx
fi

if [ -f app/marketing/supplements/page.tsx ]; then
  echo "🔁 Updating supplements CTA to point at supplements playbook…"
  perl -pi -e 's#href="/verticals/supplements"#href="/marketing/supplements/playbook"#g' app/marketing/supplements/page.tsx
fi

echo "✅ Vertical playbooks reset complete."
echo "Now run: npm run dev"
echo "Then visit:"
echo "  • http://localhost:3000/marketing/women-boutique/playbook"
echo "  • http://localhost:3000/marketing/supplements/playbook"
