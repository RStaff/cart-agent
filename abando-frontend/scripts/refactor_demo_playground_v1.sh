#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

TARGET="app/demo/playground/page.tsx"

# Backup existing page if it exists
if [ -f "$TARGET" ]; then
  TS="$(date +%Y%m%d-%H%M%S)"
  echo "[demo] Backing up existing ${TARGET} -> ${TARGET}.bak-${TS}"
  cp "$TARGET" "${TARGET}.bak-${TS}"
else
  echo "[demo] No existing ${TARGET} found, creating fresh."
fi

mkdir -p "$(dirname "$TARGET")"

cat << 'TSX' > "$TARGET"
import React from "react";

type DemoPlay = {
  id: string;
  vertical: "Boutique apparel" | "Supplements";
  name: string;
  trigger: string;
  channel: string;
  exampleMessage: string;
  estLift: string;
};

const plays: DemoPlay[] = [
  {
    id: "P1",
    vertical: "Boutique apparel",
    name: "Complete the outfit",
    trigger: "Abandoned cart with dress + no accessories",
    channel: "Email + onsite banner",
    exampleMessage:
      "Still thinking about the Willow Midi? Add the belt & earrings and save 10% on the full look.",
    estLift: "+8–12% recovered revenue",
  },
  {
    id: "P2",
    vertical: "Boutique apparel",
    name: "Low-stock urgency",
    trigger: "Size + color at < 6 units remaining",
    channel: "Email + SMS",
    exampleMessage:
      "Your size in the Linen Wide-Leg Trouser is almost gone. Checkout now before it sells out.",
    estLift: "+4–7% recovered revenue",
  },
  {
    id: "P3",
    vertical: "Supplements",
    name: "Refill reminder",
    trigger: "Cart with 30-day supply abandoned at day 25",
    channel: "Email",
    exampleMessage:
      "You’re almost out of your daily essentials. Refill now and keep your routine on track.",
    estLift: "+10–15% recovered revenue",
  },
  {
    id: "P4",
    vertical: "Supplements",
    name: "Starter bundle nudge",
    trigger: "Customer adds 1 product from starter stack, not the full bundle",
    channel: "Onsite message + email",
    exampleMessage:
      "Most customers start with the full Daily Energy Stack. Add the full bundle and save 15%.",
    estLift: "+6–9% recovered revenue",
  },
];

export default function DemoPlaygroundPage() {
  const todayRecovered = "$1,840";
  const last7Recovered = "$9,720";
  const winRate = "38%";

  return (
    <main className="min-h-screen w-full bg-slate-950 text-slate-50">
      {/* HERO: What Abando does, in one glance */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <p className="text-xs font-semibold text-pink-300 tracking-[0.2em] uppercase mb-3">
          ABANDO MERCHANT DAILY PLAY
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-3">
          Turn abandoned carts into{" "}
          <span className="text-pink-400">predictable revenue</span>.
        </h1>
        <p className="text-sm md:text-base text-slate-300 max-w-2xl">
          This demo shows how Abando automatically spots profitable segments,
          runs proven plays for each vertical, and measures the revenue you get
          back&mdash;without hiring another marketer.
        </p>
      </section>

      {/* TOPLINE METRICS */}
      <section className="max-w-5xl mx-auto px-4 pb-6 grid gap-4 md:grid-cols-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Recovered today</p>
          <p className="text-2xl font-semibold mb-1">{todayRecovered}</p>
          <p className="text-xs text-slate-400">
            From abandoned carts across boutique + supplements.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Recovered last 7 days</p>
          <p className="text-2xl font-semibold mb-1">{last7Recovered}</p>
          <p className="text-xs text-slate-400">
            The real number your team cares about.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Winning-play hit rate</p>
          <p className="text-2xl font-semibold mb-1">{winRate}</p>
          <p className="text-xs text-slate-400">
            Share of abandoned carts touched by a top-performing play.
          </p>
        </div>
      </section>

      {/* STEP 1: SPOT OPPORTUNITY */}
      <section className="max-w-5xl mx-auto px-4 pb-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Step 1 · Abando spots the opportunity for you
        </h2>
        <p className="text-sm text-slate-300 mb-4">
          Every morning, Abando pulls in fresh abandoned cart data from your
          Shopify store and groups shoppers into high-value segments.
        </p>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900">
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-4 py-2">Segment</th>
                <th className="px-4 py-2">Vertical</th>
                <th className="px-4 py-2">Shoppers</th>
                <th className="px-4 py-2">Cart value</th>
                <th className="px-4 py-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-800">
                <td className="px-4 py-2 text-slate-100">
                  “Complete-the-look” outfits
                </td>
                <td className="px-4 py-2 text-pink-300 text-xs">
                  Boutique apparel
                </td>
                <td className="px-4 py-2">46</td>
                <td className="px-4 py-2">$7,820</td>
                <td className="px-4 py-2 text-amber-300 text-xs">
                  High churn risk
                </td>
              </tr>
              <tr className="border-t border-slate-800">
                <td className="px-4 py-2 text-slate-100">
                  Low-stock statement pieces
                </td>
                <td className="px-4 py-2 text-pink-300 text-xs">
                  Boutique apparel
                </td>
                <td className="px-4 py-2">19</td>
                <td className="px-4 py-2">$3,140</td>
                <td className="px-4 py-2 text-amber-300 text-xs">
                  High urgency
                </td>
              </tr>
              <tr className="border-t border-slate-800">
                <td className="px-4 py-2 text-slate-100">
                  Refill-at-risk subscribers
                </td>
                <td className="px-4 py-2 text-emerald-300 text-xs">
                  Supplements
                </td>
                <td className="px-4 py-2">72</td>
                <td className="px-4 py-2">$5,460</td>
                <td className="px-4 py-2 text-emerald-300 text-xs">
                  High recovery potential
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* STEP 2: RUN THE RIGHT PLAY */}
      <section className="max-w-5xl mx-auto px-4 pb-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Step 2 · Abando runs the right play for each segment
        </h2>
        <p className="text-sm text-slate-300 mb-4">
          For each segment, Abando recommends a proven play tuned for your
          vertical. You can review, edit, or approve in one place.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {plays.map((play) => (
            <div
              key={play.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  {play.id} · {play.vertical}
                </span>
                <span className="text-[11px] text-emerald-300">
                  {play.estLift}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-50">
                {play.name}
              </h3>
              <p className="text-xs text-slate-400">
                <span className="font-semibold">Trigger:</span> {play.trigger}
              </p>
              <p className="text-xs text-slate-400">
                <span className="font-semibold">Channel:</span> {play.channel}
              </p>
              <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  “{play.exampleMessage}”
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STEP 3: SHOW THE MONEY */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Step 3 · You see the recovered revenue, not just clicks
        </h2>
        <p className="text-sm text-slate-300 mb-4">
          Every play rolls up into clear, merchant-level numbers you can share
          with your team&mdash;no spreadsheets or exports required.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">
              Boutique apparel – recovered this week
            </p>
            <p className="text-xl font-semibold mb-1">$5,420</p>
            <p className="text-xs text-slate-400">
              Primarily from “Complete the outfit” and low-stock urgency plays.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">
              Supplements – recovered this week
            </p>
            <p className="text-xl font-semibold mb-1">$4,300</p>
            <p className="text-xs text-slate-400">
              Driven by refill reminders and starter bundle nudges.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">
              Top play this week (by recovered revenue)
            </p>
            <p className="text-sm font-semibold mb-1">
              Boutique · Complete-the-look outfits
            </p>
            <p className="text-xs text-slate-400">
              Automatically prioritized each morning when you open Abando.
            </p>
          </div>
        </div>

        {/* CTA ROW */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/marketing/women-boutique/playbook"
            className="inline-flex items-center justify-center rounded-lg bg-pink-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-pink-400"
          >
            View Women&apos;s Boutique growth plan
          </a>
          <a
            href="/marketing/supplements/playbook"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-900"
          >
            View Supplements growth plan
          </a>
        </div>
      </section>
    </main>
  );
}
TSX

echo "[demo] New /demo/playground page written to ${TARGET}"
echo "[demo] Now run: npm run dev and open http://localhost:3000/demo/playground"
