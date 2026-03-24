"use client";

import { useState } from "react";
import type { DashboardRecommendation } from "@/components/dashboard/types";

export default function RecommendationCard({
  recommendation,
  embedded = false,
}: {
  recommendation: DashboardRecommendation;
  embedded?: boolean;
}) {
  const [reviewing, setReviewing] = useState(false);

  return (
    <section className={`rounded-2xl p-6 ${embedded ? "border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]" : "border border-white/10 bg-[#0f172a]"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Recommended next step</p>
      <h3 className={`mt-2 text-2xl font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-white"}`}>{recommendation.title}</h3>
      <p className={`mt-4 text-base leading-8 ${embedded ? "text-slate-600" : "text-slate-300"}`}>{recommendation.why}</p>
      <p className={`mt-2 text-sm leading-7 ${embedded ? "text-slate-500" : "text-slate-400"}`}>Treat this as the first place to validate before making broader checkout changes.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className={`inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${
            embedded
              ? "border-cyan-200 bg-cyan-50 text-cyan-800 hover:border-cyan-300"
              : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:border-cyan-300"
          }`}
        >
          Review this area
        </button>
        <button
          type="button"
          onClick={() => setReviewing((current) => !current)}
          className={`inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${
            reviewing
              ? embedded
                ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                : "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
              : embedded
                ? "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
                : "border-white/10 bg-slate-900 text-slate-200 hover:border-cyan-300 hover:text-cyan-200"
          }`}
        >
          {reviewing ? "Marked for follow-up" : "Mark for follow-up"}
        </button>
      </div>
    </section>
  );
}
