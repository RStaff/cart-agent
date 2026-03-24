"use client";

import { useState } from "react";
import generateAdvisorResponse from "@/lib/advisor/generateAdvisorResponse";
import type { PublicScorecard } from "@/lib/scorecardTypes";
import { merchantIssueFraming, topScorecardIssue } from "@/lib/scorecardPresentation";

type Message = {
  role: "system" | "user";
  content: string;
};

const SUGGESTIONS = [
  "Is this revenue estimate real?",
  "What should I fix first?",
  "What happens after install?",
];

function initialMessage(scorecard: PublicScorecard) {
  const issue = topScorecardIssue(scorecard);
  const issueFraming = merchantIssueFraming(scorecard);
  return `This free audit is pointing to one important idea: ${issueFraming.toLowerCase()} The clearest surfaced issue is ${issue}, and the current estimate is ${scorecard.revenueOpportunityDisplay}. Install is the step that confirms whether the same pattern is showing up in your real checkout.`;
}

export default function AdvisorRail({ scorecard }: { scorecard: PublicScorecard }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: initialMessage(scorecard) },
  ]);
  const [value, setValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  function submitQuestion(question: string) {
    const nextQuestion = question.trim();
    if (!nextQuestion || isThinking) return;

    setMessages((current) => [...current, { role: "user", content: nextQuestion }]);
    setValue("");
    setIsThinking(true);

    window.setTimeout(() => {
      const answer = generateAdvisorResponse(scorecard, nextQuestion);
      setMessages((current) => [...current, { role: "system", content: answer }]);
      setIsThinking(false);
    }, 300);
  }

  return (
    <section className="rounded-xl bg-[#0f172a] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Abando Advisor</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Ask the strongest question you have about this scorecard. Abando will keep the answer grounded in the estimate, the surfaced issue, and what changes after install.
      </p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitQuestion(value);
        }}
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ask what this means for your checkout"
          className="h-12 rounded-lg border border-white/10 bg-[#020617] px-4 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submitQuestion(suggestion)}
              className="rounded-full border border-white/10 bg-[#020617] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-300 hover:text-cyan-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={isThinking}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isThinking ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Thinking…
            </span>
          ) : (
            "Ask Abando"
          )}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "system"
                ? "max-w-[92%] rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-7 text-slate-200"
                : "ml-auto max-w-[85%] rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm leading-7 text-white"
            }
          >
            {message.content}
          </div>
        ))}
        {isThinking ? (
          <div className="max-w-[92%] rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-7 text-slate-400">
            Abando is thinking…
          </div>
        ) : null}
      </div>
    </section>
  );
}
