"use client";

import React from "react";

type WeeklyImpactPanelProps = {
  /**
   * Optional headline, default keeps the demo language.
   */
  title?: string;
  /**
   * Optional weekly recovered total. If omitted, we fall back to a fixed demo number.
   */
  weeklyTotal?: string;
};

export function WeeklyImpactPanel({
  title = "What this 7-day view really means",
  weeklyTotal = "$5,000+",
}: WeeklyImpactPanelProps) {
  return (
    <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5 text-sm text-emerald-100">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-emerald-300">
        Weekly recovered impact
      </p>
      <h3 className="mt-2 text-sm font-semibold text-emerald-100">
        {title}
      </h3>
      <p className="mt-3 leading-relaxed text-emerald-100/90">
        In this demo, Abando turns a noisy stream of cart events into a
        simple story about recovered revenue. Across the last 7 days,
        it protects just over{" "}
        <span className="font-semibold">{weeklyTotal}</span> that would
        otherwise have slipped away.
      </p>
      <p className="mt-3 leading-relaxed text-emerald-100/80">
        Each tile above isn&apos;t just a chart – it represents shoppers
        Abando actually pulled back from the brink of abandoning:
        people who were price-checking, comparing outfits, or hesitating
        on shipping. The system spots those patterns, tests plays, and
        rolls forward only what reliably wins back orders.
      </p>
      <p className="mt-3 leading-relaxed text-emerald-100/75">
        Psychologically, this turns an overwhelming firehose of data into
        something every stakeholder understands:{" "}
        <span className="font-semibold">
          “Here&apos;s how much we saved this week, and which patterns
          were responsible.”
        </span>
        That makes it easier to defend budget, align teams, and say “no”
        to random one-off campaigns that don&apos;t move real revenue.
      </p>
    </div>
  );
}
