import Link from "next/link";
import type { PublicScorecard } from "@/lib/scorecardTypes";
import {
  merchantIssueCheckFirst,
  merchantIssueFraming,
  merchantIssueWhyItMatters,
  revenueRiskTieIn,
  topScorecardIssue,
} from "@/lib/scorecardPresentation";

export default function ScorecardNarrative({ scorecard }: { scorecard: PublicScorecard }) {
  const issue = topScorecardIssue(scorecard);
  const issueFraming = merchantIssueFraming(scorecard);
  const whyItMatters = merchantIssueWhyItMatters(scorecard);
  const checkFirst = merchantIssueCheckFirst(scorecard);

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Scorecard close</p>
        <h2 className="text-2xl font-semibold tracking-tight text-white">What Abando sees</h2>
        <p className="text-sm leading-7 text-slate-200">{issueFraming}</p>
      </div>

      <div className="mt-5 grid gap-4">
        <NarrativeBlock title="Why it matters" body={whyItMatters} />
        <NarrativeBlock title="What to check first" body={checkFirst} />
        <NarrativeBlock
          title="Next step"
          body={`Connect Shopify so Abando can confirm whether this same pattern is happening in your real checkout behavior. ${revenueRiskTieIn(scorecard)}`}
        />
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/60 p-4">
        <p className="text-sm leading-7 text-slate-300">
          Surfaced issue: <span className="font-semibold text-slate-100">{issue}</span>
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-400">
          This is still a benchmark-based estimate before install. Successful connection is what allows Abando to start confirming the pattern with tracked store activity.
        </p>
      </div>

      <Link
        href={scorecard.installPath}
        className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
      >
        Continue to Shopify approval
      </Link>
    </section>
  );
}

function NarrativeBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-200">{body}</p>
    </div>
  );
}
