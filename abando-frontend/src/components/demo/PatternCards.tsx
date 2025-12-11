import React from "react";

const patterns = [
  {
    label: "Pattern 1 · Cart parkers",
    title: "They park pieces \"to think about it\"",
    goingOn:
      "Shopper likes the item but isn’t sure about fit, occasion, or total spend. They’re mentally trying on outfits and need reassurance more than a bigger coupon.",
    responds:
      "Sends a delayed nudge like “Still love this look? Here’s how other customers styled it” instead of a generic 10%-off blast.",
  },
  {
    label: "Pattern 2 · Size checkers",
    title: "They bounce between sizes & size charts",
    goingOn:
      "Fear of ordering the wrong size, especially on dresses, denim, and fitted tops. They pause until they feel confident they won’t have to hassle with returns.",
    responds:
      "Plays that lead with sizing confidence and fit proof (reviews mentioning size, photos, try-at-home messaging) in emails or onsite banners.",
  },
  {
    label: "Pattern 3 · Drop watchers",
    title: "They wait for new arrivals or a better deal",
    goingOn:
      "Shopper is engaged with the brand but habitually waits for a signal—new drop, low-stock alert, or limited-time offer—before committing.",
    responds:
      "Gentle urgency plays tied to low-stock sizes, bundle suggestions, or “last chance for this collection” instead of constant promos.",
  },
];

export function PatternCards() {
  return (
    <section className="space-y-4">
      <p className="text-xs font-semibold tracking-[0.22em] text-slate-300/80">
        2 · THREE HIGH-IMPACT PATTERNS IN THIS BOUTIQUE DEMO
      </p>
      <h2 className="text-xl font-semibold text-slate-50">
        Today&apos;s key patterns in this boutique demo
      </h2>
      <p className="text-sm text-slate-300/90 max-w-2xl">
        Names are for clarity, not jargon. Each pattern is just a different kind
        of hesitation Abando knows how to respond to.
      </p>

      <div className="mt-4 grid gap-6 md:grid-cols-3">
        {patterns.map((p) => (
          <div
            key={p.label}
            className="rounded-2xl border border-emerald-500/40 bg-slate-950/70 p-5"
          >
            <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-300 uppercase">
              {p.label}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-slate-50">
              {p.title}
            </h3>

            <div className="mt-3 space-y-3 text-xs text-slate-200/90">
              <div>
                <p className="font-semibold tracking-wide text-slate-300/80">
                  WHAT&apos;S REALLY GOING ON
                </p>
                <p className="mt-1">{p.goingOn}</p>
              </div>
              <div>
                <p className="font-semibold tracking-wide text-slate-300/80">
                  HOW ABANDO RESPONDS
                </p>
                <p className="mt-1">{p.responds}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
