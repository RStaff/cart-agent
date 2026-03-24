import type { PublicScorecard } from "@/lib/scorecardTypes";
import {
  extractBenchmarkPositionPercent,
  merchantIssueFraming,
  revenueRiskTieIn,
  topScorecardIssue,
} from "@/lib/scorecardPresentation";

function Bar({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
        <span>{label}</span>
        <span className="font-medium text-white">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-900">
        <div className={`h-2 rounded-full ${accent}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export default function BaselineExplainer({ scorecard }: { scorecard: PublicScorecard }) {
  const issue = topScorecardIssue(scorecard);
  const issueFraming = merchantIssueFraming(scorecard);
  const benchmark = extractBenchmarkPositionPercent(scorecard);
  const estimatedGap = benchmark.percent > 0 ? Math.max(0, 100 - benchmark.percent) : 0;

  return (
    <section className="rounded-xl bg-[#0f172a] p-5">
      <h2 className="text-2xl font-semibold tracking-tight text-white">How this estimate was calculated</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Abando compares this store against stores like yours and looks for the clearest issue on this scorecard that may be slowing shoppers down before purchase.
      </p>

      <div className="mt-5 space-y-4">
        <Bar label="Stores like yours" value={100} accent="bg-slate-200" />
        <Bar
          label="Your current benchmark position"
          value={benchmark.percent}
          accent="bg-gradient-to-r from-cyan-400 to-blue-500"
        />
        <Bar label="Opportunity gap" value={estimatedGap} accent="bg-gradient-to-r from-amber-400 to-orange-500" />
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-slate-900/70 p-4">
        <p className="text-sm leading-7 text-slate-200">
          The clearest issue shaping this estimate is <span className="font-semibold text-white">{issue}</span>.
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          {issueFraming} This shows how far your checkout may be from similar Shopify stores. It is not tracked revenue yet.
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-300">{revenueRiskTieIn(scorecard)}</p>
        <p className="mt-2 text-xs leading-6 text-slate-400">
          {benchmark.source === "benchmark_summary"
            ? "The position cue above comes from the current scorecard summary."
            : benchmark.source === "checkout_score_context"
              ? "The position cue above uses the current score context because a direct comparison percentage was not available."
              : "A direct comparison percentage is not available in this scorecard yet."}
        </p>
      </div>
    </section>
  );
}
