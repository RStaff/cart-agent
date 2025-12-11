import React from "react";

export function RawSignal() {
  return (
    <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 md:p-8">
      <p className="text-xs font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
        WHAT THE RAW SIGNAL LOOKS LIKE
      </p>
      <p className="text-sm text-slate-300/90 max-w-2xl">
        Under the hood, Abando is watching anonymous event streams like:
      </p>

      <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950/90 p-4 text-[11px] leading-relaxed text-emerald-200">
{`[
  {
    "session_id": "s_1432",
    "events": [
      "view/dresses/midi-wrap",
      "view/size-guide/dresses",
      "add_to_cart:SKU-DF-102",
      "view/returns-policy",
      "abandon_checkout"
    ]
  },
  {
    "session_id": "b3c__",
    "events": [
      "view/tops/cropped-knit",
      "add_to_cart:SKU-CK-204",
      "abandon_checkout"
    ]
  }
]`}
      </pre>

      <p className="mt-3 text-xs text-slate-300/80">
        Abando sees events like this across hundreds of sessions, then groups
        them into patterns your team can actually act on.
      </p>

      <div className="mt-6 grid gap-4 rounded-2xl border border-emerald-700/40 bg-emerald-900/10 p-4 text-xs text-emerald-100 md:grid-cols-3">
        <div>
          <p className="font-semibold tracking-[0.22em] text-emerald-300 uppercase">
            RAW SHOPPER EVENTS
          </p>
          <p className="mt-2">
            Clicks, searches, size-guide views, add-to-cart, and checkout steps
            Abando receives from Shopify.
          </p>
        </div>
        <div>
          <p className="font-semibold tracking-[0.22em] text-emerald-300 uppercase">
            BEHAVIOR PATTERNS
          </p>
          <p className="mt-2">
            Abando clusters sessions into hesitation types like Cart Parkers,
            Size Checkers, and Drop Watchers instead of one big{" "}
            <span className="italic">“abandoned”</span> bucket.
          </p>
        </div>
        <div>
          <p className="font-semibold tracking-[0.22em] text-emerald-300 uppercase">
            GUIDED PLAYS
          </p>
          <p className="mt-2">
            Each pattern maps to a small set of proven plays so your team
            chooses tone and channels—not targeting logic.
          </p>
        </div>
      </div>
    </section>
  );
}
