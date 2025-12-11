#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Wiring Abando marketing funnel v1 (Women’s Boutique ICP)..."
cd "$(dirname "$0")/.."

# 1) Ensure directories exist
mkdir -p app/marketing/women-boutique

#############################################
# 2) app/marketing/layout.tsx
#############################################
cat << 'TSX' > app/marketing/layout.tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "Abando – AI Cart Recovery for Women’s Boutique Apparel",
  description:
    "Abando is your AI cart recovery copilot for women’s boutique apparel shops on Shopify. Turn abandoned carts into repeat customers.",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
        {children}
      </div>
    </div>
  );
}
TSX

#############################################
# 3) app/marketing/page.tsx
#    -> Redirect /marketing → /marketing/women-boutique
#############################################
cat << 'TSX' > app/marketing/page.tsx
import { redirect } from "next/navigation";

export default function MarketingRootRedirect() {
  redirect("/marketing/women-boutique");
}
TSX

#############################################
# 4) app/marketing/women-boutique/page.tsx
#############################################
cat << 'TSX' > app/marketing/women-boutique/page.tsx
import Link from "next/link";
// If you want a teaser of the engine, uncomment this and the section below:
// import { VerticalGrowthEngineSection } from "../../components/VerticalGrowthEngineSection";

export default function WomensBoutiqueMarketingPage() {
  return (
    <main className="flex flex-1 flex-col gap-12 py-8">
      {/* Hero */}
      <section className="grid gap-8 md:grid-cols-[1.3fr,1fr] items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-pink-500/40 bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-200">
            For women’s boutique Shopify stores
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Recover more lost checkouts for your{" "}
            <span className="text-pink-300">boutique apparel shop</span>
            <br className="hidden sm:block" /> without hiring an agency.
          </h1>

          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            Abando watches your checkout flow, finds the moments shoppers drop off,
            and automatically runs AI-powered recovery campaigns that sound like
            your brand – not generic spam.
          </p>

          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Designed specifically for women’s fashion & lifestyle brands</li>
            <li>• No-code setup: connect your Shopify store, pick your tone, go live</li>
            <li>• See which campaigns actually bring shoppers back to checkout</li>
          </ul>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/demo/playground"
              className="inline-flex items-center justify-center rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-pink-500/30 hover:bg-pink-400 transition"
            >
              Try the Abando demo
            </Link>

            <Link
              href="/verticals/women-boutique"
              className="inline-flex items-center justify-center rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-100 hover:border-slate-400 hover:text-white transition"
            >
              View the boutique growth playbook
            </Link>
          </div>

          <p className="pt-1 text-xs text-slate-400">
            Perfect for 1–3 store owner teams doing product drops, seasonal launches,
            and repeat customer campaigns.
          </p>
        </div>

        {/* Right side – simple “screenshot” card */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-pink-500/20 blur-3xl" />
          <div className="relative rounded-3xl border border-slate-700 bg-slate-900/70 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">
                Today’s boutique recovery
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                +18% checkout lift
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-2">
                <div>
                  <div className="font-medium">Abandoned: Cart over \$120</div>
                  <div className="text-[11px] text-slate-400">
                    7 shoppers dropped at shipping step
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Recovered</div>
                  <div className="text-sm font-semibold text-emerald-300">
                    3 orders
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-3">
                <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">
                  Example message
                </div>
                <p className="text-[11px] leading-relaxed text-slate-200">
                  “Hey Maya, we saved your size in the{" "}
                  <span className="text-pink-200">Rosewood Wrap Dress</span>.
                  Checkout today and we&apos;ll include free 2-day shipping for this drop.”
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Channel mix: SMS + Email</span>
                <span>Matches your boutique’s tone &amp; style</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof / benefits */}
      <section className="grid gap-4 border-t border-slate-800 pt-8 md:grid-cols-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-white">
            Built for boutique owners, not growth hackers
          </h2>
          <p className="text-xs text-slate-400">
            You don’t need a data science team. Abando translates the numbers into
            simple, “here’s what to fix next” insights.
          </p>
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-white">
            Protect your brand’s voice
          </h2>
          <p className="text-xs text-slate-400">
            Every recovery sequence is tuned to your aesthetic, language, and
            customer relationships – no cringe automations.
          </p>
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-white">
            See the lift, not just the messages
          </h2>
          <p className="text-xs text-slate-400">
            Track recovered revenue, cohort performance, and which plays matter most
            for your boutique’s style of selling.
          </p>
        </div>
      </section>

      {/* Optional: vertical engine teaser */}
      {/*
      <section className="border-t border-slate-800 pt-8">
        <VerticalGrowthEngineSection variant="women-boutique" />
      </section>
      */}
    </main>
  );
}
TSX

echo "✅ Marketing funnel v1 wired:"
echo "   - /marketing              → redirects to /marketing/women-boutique"
echo "   - /marketing/women-boutique  (Women’s Boutique ICP landing)"
echo
echo "Next:"
echo "  1) npm run dev"
echo "  2) Visit:"
echo "       • http://localhost:3000/marketing"
echo "       • http://localhost:3000/marketing/women-boutique"
echo "  3) Later: point abando.ai → /marketing in Vercel"
