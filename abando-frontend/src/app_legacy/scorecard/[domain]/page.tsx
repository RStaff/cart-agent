import { notFound } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import AdvisorRail from "@/components/advisor/AdvisorRail";
import InstallBlock from "@/components/install/InstallBlock";
import CenteredContainer from "@/components/layout/CenteredContainer";
import { findPublicScorecard } from "@/lib/scorecards";

type PageProps = {
  params: Promise<{ domain: string }>;
};

export default async function ScorecardPage({ params }: PageProps) {
  const { domain } = await params;
  const scorecard = findPublicScorecard(domain);

  if (!scorecard) {
    notFound();
  }

  const topIssue = scorecard.topFindings?.[0] || "checkout friction";

  return (
    <CenteredContainer>
      <header className="flex items-center justify-between">
        <BrandLogo width={148} height={24} />
        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Scorecard</span>
      </header>

      <section className="space-y-3">
        <p className="text-sm font-medium text-cyan-300">{scorecard.domain}</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white">Estimated checkout revenue opportunity</h1>
      </section>

      <section className="rounded-xl bg-[#0f172a] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Revenue card</p>
        <div className="mt-3 text-4xl font-semibold tracking-tight text-white">{scorecard.revenueOpportunityDisplay}</div>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          This is a benchmark-based estimate tied to the strongest issue on this scorecard, not tracked revenue from your live store yet.
        </p>
      </section>

      <section className="rounded-xl bg-[#0f172a] p-5">
        <p className="text-sm leading-7 text-slate-200">
          Abando’s current scorecard points to <span className="font-semibold text-white">{topIssue}</span> as the clearest issue affecting checkout completion.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          {scorecard.benchmarkSummary || "This scorecard suggests the store may be underperforming relative to similar Shopify stores."}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          The important thing here is not the estimate by itself. It is the issue the estimate points to, and whether that issue shows up again once real tracking is active after install.
        </p>
      </section>

      <AdvisorRail scorecard={scorecard} />
      <InstallBlock installPath={scorecard.installPath} />
    </CenteredContainer>
  );
}
