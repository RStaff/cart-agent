"use client";

import React, { useState } from "react";

type DaySummary = {
  day: string;
  orders: number;
  revenue: number;
  pattern: string;
  items: string[];
  insight: string;
  recovery: string;
};

const DAYS: DaySummary[] = [
  {
    day: "Mon",
    orders: 3,
    revenue: 360,
    pattern: "Cart parkers",
    items: ["Occasion dresses", "work blazers"],
    insight:
      "Shoppers saved higher-ticket outfits but backed off before checkout.",
    recovery:
      "Soft reminder with social proof (“Here’s how other customers styled this look”).",
  },
  {
    day: "Tue",
    orders: 5,
    revenue: 620,
    pattern: "Size checkers",
    items: ["Denim", "fitted tops"],
    insight:
      "Most abandons bounced between two sizes and size-guide views before dropping.",
    recovery:
      "Fit-proof email highlighting reviews that mention size and easy exchanges.",
  },
  {
    day: "Wed",
    orders: 6,
    revenue: 740,
    pattern: "Cart parkers",
    items: ["Event dresses", "statement tops"],
    insight:
      "Biggest lift day. Shoppers were planning outfits for events but sat on full carts.",
    recovery:
      "Lookbook-style SMS linking back to the exact outfits they saved with styling ideas.",
  },
  {
    day: "Thu",
    orders: 5,
    revenue: 580,
    pattern: "Drop watchers",
    items: ["New arrivals", "featured collection"],
    insight:
      "Shoppers were watching a new drop but waited for a stronger signal to commit.",
    recovery:
      "Low-stock messaging on key sizes plus a gentle “this collection is almost gone” nudge.",
  },
  {
    day: "Fri",
    orders: 7,
    revenue: 840,
    pattern: "Mixed",
    items: ["Weekend outfits", "matching sets"],
    insight:
      "High-intent weekend shoppers juggling multiple options, then stalling.",
    recovery:
      "Reminder that refocuses on 1–2 hero outfits instead of the whole cart.",
  },
  {
    day: "Sat",
    orders: 8,
    revenue: 920,
    pattern: "Drop watchers",
    items: ["Limited drop", "bestseller restocks"],
    insight:
      "Shoppers were waiting on low-stock and restock cues before checking out.",
    recovery:
      "Urgency plays tied to low-stock sizes and “last chance for this weekend” messaging.",
  },
  {
    day: "Sun",
    orders: 8,
    revenue: 820,
    pattern: "Cart parkers",
    items: ["Try-on hauls", "“maybe later” pieces"],
    insight:
      "End-of-week carts full of try-on items that felt optional, not urgent.",
    recovery:
      "Gentle follow-up with “ready when you are” language and free-returns reassurance.",
  },
];

export function WeeklySnapshot() {
  const [selected, setSelected] = useState<DaySummary>(DAYS[2]); // default Wed

  const totalOrders = DAYS.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = DAYS.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <section className="space-y-6 rounded-3xl border border-emerald-700/50 bg-slate-950/70 p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-baseline">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
            3 · WHAT THIS MEANS OVER A WEEK
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-50">
            7-day recovered orders snapshot
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300/90">
            This example boutique recovers a handful of extra outfits per
            day—small lifts that add up. In a live account, this view is driven
            by your real Shopify data and lets you compare patterns like cart
            parkers vs. drop watchers.
          </p>
        </div>

        <p className="mt-2 text-right text-sm text-emerald-200 md:mt-0">
          <span className="font-semibold">
            {totalOrders} orders · ${totalRevenue.toLocaleString()}
          </span>{" "}
          <span className="text-[11px] text-emerald-200/80">(demo week)</span>
          <br />
          <span className="text-[11px] text-slate-400">
            In production, this ties directly to your revenue so you know where
            to focus next.
          </span>
        </p>
      </div>

      {/* Bubbles row */}
      <div className="mt-4 flex flex-wrap gap-3">
        {DAYS.map((d) => {
          const isSelected = d.day === selected.day;
          return (
            <button
              key={d.day}
              type="button"
              className={[
                "flex min-w-[80px] flex-col items-center justify-center rounded-full px-4 py-3 text-xs transition",
                isSelected
                  ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40"
                  : "bg-emerald-700/70 text-emerald-50 hover:bg-emerald-500/90",
              ].join(" ")}
              title={`${d.day}: ${d.orders} recovered orders · ${d.pattern}`}
              onMouseEnter={() => setSelected(d)}
              onClick={() => setSelected(d)}
            >
              <span className="font-semibold">{d.day}</span>
              <span className="text-[11px] opacity-90">
                {d.orders} orders
              </span>
            </button>
          );
        })}
      </div>

      {/* Drilldown panel */}
      <div className="mt-6 rounded-2xl border border-emerald-600/40 bg-slate-950/80 p-5">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-300 uppercase">
          HIGHLIGHT OF THE DAY
        </p>
        <h3 className="mt-2 text-sm font-semibold text-slate-50">
          {selected.day}: {selected.orders} recovered orders ($
          {selected.revenue.toLocaleString()} demo revenue)
        </h3>

        <dl className="mt-4 space-y-3 text-sm text-slate-200/90">
          <div>
            <dt className="font-semibold text-slate-300/90">Shopper pattern</dt>
            <dd>{selected.pattern}.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-300/90">
              What they were eyeing
            </dt>
            <dd>{selected.items.join(", ")}.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-300/90">
              What&apos;s really going on
            </dt>
            <dd>{selected.insight}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-300/90">
              How Abando got them back
            </dt>
            <dd>{selected.recovery}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-emerald-200/80">
          In the live product, clicking a day would open the actual recovered
          sessions for that date so your team can see the carts and messages
          that fired.
        </p>
      </div>
    </section>
  );
}
