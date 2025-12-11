#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Bootstrapping Abando Psych Insight Demo…"

# 1) Ensure config directory exists
mkdir -p src/config

# 2) Define vertical psych demo shoppers
cat << 'TS' > src/config/verticalPlays.ts
import type { VerticalKey } from "@/config/marketingRoutes";

export type PsychDriver =
  | "price_sensitivity"
  | "reassurance_seeking"
  | "exploration"
  | "social_proof";

export type DemoShopper = {
  id: string;
  label: string;
  vertical: VerticalKey;
  behaviorSummary: string;
  segmentLabel: string;
  psychDriver: PsychDriver;
  abandoResponse: string;
};

export const demoShoppers: DemoShopper[] = [
  {
    id: "boutique_price_sensitive_outfit",
    label: "Boutique Shopper",
    vertical: "boutique",
    behaviorSummary: "Viewed 3 dresses → added 1 to cart → hesitated on shipping cost.",
    segmentLabel: "Price-Sensitive Outfit Completer",
    psychDriver: "price_sensitivity",
    abandoResponse:
      "Style pairing suggestion + small free-shipping unlock cue instead of a blanket discount.",
  },
  {
    id: "supplements_research_seeker",
    label: "Supplements Shopper",
    vertical: "supplements",
    behaviorSummary: "Compared ingredient labels → added 1 item → stalled at checkout.",
    segmentLabel: "Research-Driven Health Seeker",
    psychDriver: "reassurance_seeking",
    abandoResponse:
      "Science-backed reassurance message that sticks to approved claims and clarifies benefits.",
  },
  {
    id: "returning_high_intent",
    label: "Returning Visitor",
    vertical: "boutique",
    behaviorSummary: "Viewed product again → scrolled reviews → added to cart → left.",
    segmentLabel: "High-Intent Hesitator",
    psychDriver: "social_proof",
    abandoResponse:
      "Subtle reminder plus social-proof nudge (reviews, UGC) instead of pure urgency.",
  },
];
TS

echo "✅ Wrote src/config/verticalPlays.ts"

# 3) Rewrite /demo/playground to render from config
TARGET="app/demo/playground/page.tsx"

if [ -f "$TARGET" ]; then
  ts="$(date +%Y%m%d-%H%M%S)"
  cp "$TARGET" "${TARGET}.bak-${ts}"
  echo "🗂  Backed up existing ${TARGET} -> ${TARGET}.bak-${ts}"
fi

cat << 'TSX' > "$TARGET"
import Link from "next/link";
import { demoShoppers } from "@/config/verticalPlays";
import { getDefaultColdLanding } from "@/config/marketingRoutes";

export default function DemoPlaygroundPage() {
  const defaultLanding = getDefaultColdLanding();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="text-xs font-medium tracking-[0.2em] text-sky-400 mb-3">
            ABANDO DEMO · PSYCH INSIGHT VIEW
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold mb-4">
            Abando Daily Rhythm <span className="text-sky-400">(Psych Insight Demo)</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            This is a simulation of how Abando interprets real customer behavior across your
            Shopify store — using behavioral psychology to choose the right play automatically,
            not just “blast everyone with a coupon.”
          </p>
        </header>

        <section className="mb-10 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-sm font-semibold mb-4 text-slate-100">
            The Abando Customer Behavior Loop
          </h2>
          <div className="grid gap-4 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">Observe</p>
              <p className="text-slate-300">
                We read browsing, cart actions, hesitation, and return visits for each shopper.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">Interpret</p>
              <p className="text-slate-300">
                We infer the shopper&apos;s likely motive — price sensitivity, reassurance seeking,
                exploration, or social proof needs.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">Act</p>
              <p className="text-slate-300">
                Abando selects the best play for that vertical (onsite nudge, email, SMS,
                reassurance message, etc.).
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">Learn</p>
              <p className="text-slate-300">
                Plays adapt over time based on what consistently wins — you see the lift without
                micromanaging flows.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Example Customers Today
          </h2>
          <div className="space-y-4">
            {demoShoppers.map((shopper) => (
              <div
                key={shopper.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-sm"
              >
                <p className="text-xs font-medium text-slate-400 mb-1">
                  {shopper.label}
                </p>
                <p className="text-slate-200 mb-2">{shopper.behaviorSummary}</p>
                <p className="text-xs mb-1">
                  <span className="font-semibold text-sky-400">Segment: </span>
                  <span className="text-slate-100">{shopper.segmentLabel}</span>
                </p>
                <p className="text-xs mb-1">
                  <span className="font-semibold text-emerald-400">Psych driver: </span>
                  <span className="text-slate-100 capitalize">
                    {shopper.psychDriver.replace(/_/g, " ")}
                  </span>
                </p>
                <p className="text-xs text-slate-300 mt-2">
                  <span className="font-semibold text-violet-300">Abando response: </span>
                  {shopper.abandoResponse}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            What Abando Handles Automatically
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
            <li>Chooses the correct behavioral play for your vertical (boutique or supplements).</li>
            <li>Predicts which shoppers need reassurance vs. urgency vs. social proof.</li>
            <li>Adapts tone to match your niche while staying inside your brand and compliance.</li>
            <li>Learns which plays win over time and rotates them automatically.</li>
          </ul>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link
            href={defaultLanding}
            className="inline-flex items-center justify-center rounded-lg bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-300"
          >
            Start with my best-fit vertical
          </Link>
          <Link
            href="/verticals"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-900"
          >
            Explore both verticals
          </Link>
        </section>
      </div>
    </main>
  );
}
TSX

echo "✅ New psych-insight /demo/playground written to ${TARGET}"
echo
echo "Next:"
echo "  1) npm run dev"
echo "  2) Open http://localhost:3000/demo/playground"
echo "  3) Click through to your default vertical and /verticals to confirm flow."
