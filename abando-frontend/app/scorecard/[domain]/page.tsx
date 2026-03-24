import { notFound } from "next/navigation";
import AdvisorRail from "@/components/advisor/AdvisorRail";
import PublicHeader from "@/components/brand/PublicHeader";
import CenteredContainer from "@/components/layout/CenteredContainer";
import { findPublicScorecard } from "@/lib/scorecards";
import BaselineExplainer from "@/components/scorecard/BaselineExplainer";
import CheckoutFlowDiagram from "@/components/scorecard/CheckoutFlowDiagram";
import GuidedScorecardMode from "@/components/scorecard/GuidedScorecardMode";
import ScorecardNarrative from "@/components/scorecard/ScorecardNarrative";
import ScorecardSlideOver from "@/components/scorecard/ScorecardSlideOver";
import {
  merchantIssueFraming,
  revenueRiskTieIn,
  topScorecardIssue,
} from "@/lib/scorecardPresentation";

type PageProps = {
  params: Promise<{ domain: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { domain } = await params;
  const scorecard = findPublicScorecard(domain);

  if (!scorecard) {
    return {
      title: "Abando Scorecard",
    };
  }

  return {
    title: `${scorecard.domain} checkout scorecard | Abando`,
  };
}

export default async function ScorecardPage({ params }: PageProps) {
  const { domain } = await params;
  const scorecard = findPublicScorecard(domain);

  if (!scorecard) {
    notFound();
  }

  const topIssue = topScorecardIssue(scorecard);
  const issueFraming = merchantIssueFraming(scorecard);

  return (
    <>
      <CenteredContainer>
        <PublicHeader />

        <section className="space-y-3">
          <p className="text-sm font-medium text-cyan-300">{scorecard.domain}</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Your checkout may be losing revenue</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-300">
            This free audit uses Shopify benchmark patterns to show where your store may be losing customers before purchase.
          </p>
        </section>

        <section className="rounded-xl bg-[#0f172a] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Revenue card</p>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-white">{scorecard.revenueOpportunityDisplay}</div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            This estimate comes from how similar Shopify stores perform and the strongest issue surfaced on this scorecard. It is not tracked revenue yet. Connect Shopify to confirm it with real checkout data after successful approval.
          </p>
          <p className="mt-3 text-sm leading-7 text-cyan-100">{revenueRiskTieIn(scorecard)}</p>
          <p className="mt-3 text-sm leading-7 text-cyan-100">You are still viewing a free audit — nothing has been installed yet.</p>
        </section>

        <section className="rounded-xl border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(15,23,42,1)_0%,rgba(11,31,45,1)_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Primary finding</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{issueFraming}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Surfaced issue: <span className="font-medium text-slate-100">{topIssue}</span>
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            This is the clearest problem on the scorecard, which is why Abando is treating it as the strongest place to confirm first.
          </p>
        </section>

        <GuidedScorecardMode scorecard={scorecard} />

        <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <BaselineExplainer scorecard={scorecard} />
            <CheckoutFlowDiagram scorecard={scorecard} />
          </div>
          <div className="space-y-6">
            <AdvisorRail scorecard={scorecard} />
          </div>
        </div>
        <ScorecardNarrative scorecard={scorecard} />
      </CenteredContainer>
      <ScorecardSlideOver scorecard={scorecard} />
    </>
  );
}
