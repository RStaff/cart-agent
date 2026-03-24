"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PublicScorecard } from "@/lib/scorecardTypes";
import {
  extractBenchmarkPositionPercent,
  merchantIssueFraming,
  topScorecardIssue,
} from "@/lib/scorecardPresentation";

export default function ScorecardSlideOver({ scorecard }: { scorecard: PublicScorecard }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const issue = topScorecardIssue(scorecard);
  const issueFraming = merchantIssueFraming(scorecard);
  const benchmark = extractBenchmarkPositionPercent(scorecard);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open quick scorecard summary"
        className="fixed bottom-20 right-4 z-[100] inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-5 text-sm font-semibold text-white shadow-[0_20px_60px_rgba(37,99,235,0.45)] ring-1 ring-white/10 transition hover:scale-[1.02] hover:from-blue-400 hover:to-indigo-400 md:bottom-6 md:right-6"
      >
        See quick summary
      </button>

      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-[110] transition ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <button
          type="button"
          aria-label="Close quick scorecard view"
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-scorecard-title"
          className={`absolute right-0 top-0 h-full w-[94vw] max-w-[460px] overflow-y-auto border-l border-white/10 bg-[#020617] px-5 pb-8 pt-5 shadow-2xl transition-transform duration-300 sm:w-[88vw] sm:px-6 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Quick scorecard view</p>
              <h2 id="quick-scorecard-title" className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {scorecard.domain}
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close quick scorecard view"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-300 transition hover:border-cyan-300 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <section className="rounded-xl border border-white/10 bg-[#0f172a] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">What this means</p>
              <p className="mt-3 text-lg font-semibold text-white">Your checkout may be losing revenue.</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                This free audit points to <span className="font-semibold text-white">{scorecard.revenueOpportunityDisplay}</span> in
                estimated opportunity. It is still a pre-install estimate, not tracked revenue from your live store yet.
              </p>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#0f172a] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">What Abando found</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{issueFraming || "Customers may be dropping off before they complete checkout."}</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Scorecard issue: <span className="font-medium text-slate-200">{issue || "checkout slowdown"}</span>
              </p>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#0f172a] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Why this estimate exists</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Abando compares your checkout against stores like yours and measures the gap between your current benchmark position and the
                stronger Shopify patterns seen elsewhere.
              </p>
              <div className="mt-3 rounded-lg bg-slate-900/80 p-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <span>Current benchmark position</span>
                  <span className="font-medium text-white">
                    {benchmark.percent > 0 ? `~${benchmark.percent}%` : "Gap identified"}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#0f172a] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Where customers may be hesitating</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                The current scorecard suggests hesitation between cart, checkout, and payment. That is where Abando looks for the drop-off
                pattern that reduces completed purchases.
              </p>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#0f172a] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">What happens if you install</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Install moves you from benchmark estimate to real checkout tracking. That is when Abando can confirm whether this same issue
                is showing up in live customer behavior.
              </p>
            </section>
          </div>

          <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <p className="text-sm leading-7 text-cyan-50">
              Install confirms this with real checkout data. No changes are made without your approval, and billing is not collected on this
              page.
            </p>
            <Link
              href={scorecard.installPath}
              className="mt-4 inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
            >
              See my real checkout data
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
