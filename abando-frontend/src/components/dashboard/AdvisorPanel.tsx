"use client";

import { useMemo, useState } from "react";
import type { DashboardIssue, DashboardRecommendation } from "@/components/dashboard/types";

const SUGGESTIONS = [
  "Is this pattern already confirmed?",
  "What should I fix first?",
  "What happens as more checkout activity comes in?",
];

export default function AdvisorPanel({
  issue,
  recommendation,
  embedded = false,
}: {
  issue: DashboardIssue;
  recommendation: DashboardRecommendation;
  embedded?: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");

  const answer = useMemo(() => {
    const normalized = submittedQuestion.trim().toLowerCase();
    if (!normalized) return "";

    if (normalized.includes("confirmed") || normalized.includes("real")) {
      return `Not fully yet. Abando is comparing the original prediction with live checkout behavior around ${issue.summary.toLowerCase()} The current goal is to confirm whether that same slowdown keeps showing up consistently.`;
    }

    if (normalized.includes("fix")) {
      return `${recommendation.title}. That is the clearest first action because it targets the stage where shoppers may be slowing down before they ever reach payment.`;
    }

    if (normalized.includes("more checkout") || normalized.includes("activity")) {
      return `As more live checkout activity comes in, Abando can tell whether this slowdown is occasional or consistent. That is what moves the scorecard prediction toward confirmation or away from it.`;
    }

    return `Abando is focused on ${issue.summary.toLowerCase()} right now. This view gets clearer as more live checkout activity comes in.`;
  }, [issue.confidence, issue.summary, recommendation.title, submittedQuestion]);

  function submit(nextQuestion: string) {
    const resolved = nextQuestion.trim();
    if (!resolved) return;
    setQuestion(resolved);
    setSubmittedQuestion(resolved);
  }

  return (
    <section className={`rounded-2xl p-5 ${embedded ? "border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]" : "border border-white/10 bg-[#0f172a]"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Advisor</p>
      <h3 className={`mt-2 text-2xl font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-white"}`}>Ask Abando about this checkout pattern</h3>
      <p className={`mt-3 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
        Use this panel to understand what the original scorecard predicted, what live checkout behavior is starting to show, and what to check first.
      </p>

      <div className={`mt-4 rounded-xl p-3 ${embedded ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-slate-950/50"}`}>
        <label className="sr-only" htmlFor="dashboard-advisor-input">
          Ask what Abando is seeing
        </label>
        <div className="flex gap-2">
          <input
            id="dashboard-advisor-input"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask what Abando is measuring..."
            className={`h-12 flex-1 rounded-lg border px-4 text-sm outline-none transition placeholder:text-slate-500 ${
              embedded
                ? "border-slate-300 bg-white text-slate-950 focus:border-cyan-400"
                : "border-white/10 bg-[#020617] text-white focus:border-cyan-300"
            }`}
          />
          <button
            type="button"
            onClick={() => submit(question)}
            className={`inline-flex h-12 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white ${
              embedded ? "bg-slate-900" : "bg-gradient-to-r from-blue-500 to-indigo-500"
            }`}
          >
              Ask
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => submit(suggestion)}
            className={`rounded-full border px-3 py-2 text-sm transition ${
              embedded
                ? "border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-800"
                : "border-white/10 bg-slate-900 text-slate-200 hover:border-cyan-300 hover:text-cyan-200"
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className={`mt-4 rounded-xl border p-4 ${embedded ? "border-cyan-200 bg-cyan-50" : "border-cyan-400/20 bg-cyan-400/5"}`}>
        {submittedQuestion ? (
          <>
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Latest answer</p>
            <p className={`mt-2 text-sm font-medium ${embedded ? "text-slate-950" : "text-white"}`}>{submittedQuestion}</p>
            <p className={`mt-3 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>{answer}</p>
          </>
        ) : (
          <>
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Suggested starting point</p>
            <p className={`mt-3 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
              Ask why this issue surfaced, what to fix first, or how much confidence Abando has as live activity comes in.
            </p>
            <p className={`mt-2 text-sm leading-7 ${embedded ? "text-slate-500" : "text-slate-400"}`}>
              Abando will keep the pre-install prediction and the post-install confirmation status clearly separate.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
