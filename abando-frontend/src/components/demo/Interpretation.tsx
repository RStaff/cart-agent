import React from "react";

export function Interpretation() {
  return (
    <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 md:p-8">
      <p className="text-xs font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
        HOW ABANDO INTERPRETS IT
      </p>
      <p className="text-sm text-slate-300/90 max-w-2xl">
        Abando doesn&apos;t dump raw logs on your team. It rolls those events up
        into a few clear insights you can read in seconds, like:
      </p>

      <ul className="mt-3 space-y-2 text-sm text-slate-200">
        <li>
          • 38% of abandons happened right after shoppers checked the returns
          policy.
        </li>
        <li>
          • 24% abandoned after comparing 3+ outfits side by side.
        </li>
        <li>
          • 18% abandoned while building full outfits and never quite hitting
          “Buy.”
        </li>
      </ul>

      <p className="mt-3 text-sm text-slate-300/90 max-w-2xl">
        Each pattern maps to a small set of plays (emails, SMS, onsite prompts),
        so your team isn&apos;t guessing which message to send first.
      </p>
    </section>
  );
}
