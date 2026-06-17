import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/brand/PublicHeader";
import CenteredContainer from "@/components/layout/CenteredContainer";
import { findPublicScorecard } from "@/lib/scorecards";

type PageProps = {
  params: Promise<{ domain: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { domain } = await params;
  const scorecard = findPublicScorecard(domain);

  if (!scorecard) {
    return {
      title: "ShopiFixer audit result",
    };
  }

  return {
    title: `${scorecard.domain} audit result | ShopiFixer`,
  };
}

export default async function ScorecardPage({ params }: PageProps) {
  const { domain } = await params;
  const scorecard = findPublicScorecard(domain);

  if (!scorecard) {
    notFound();
  }

  const primaryIssue = scorecard.topFindings?.[0] || scorecard.benchmarkSummary || "checkout friction";
  const confidence = scorecard.confidence || "Benchmark-based estimate";
  const convertedScore = typeof scorecard.checkoutScore === "number" ? `${scorecard.checkoutScore}/100` : "Benchmark-only";

  return (
    <>
      <CenteredContainer>
        <PublicHeader />

        <section className="space-y-3">
          <p className="text-sm font-medium text-cyan-300">{scorecard.domain}</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Your audit points to a ShopiFixer Fix Sprint</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-300">
            This scorecard shows where your Shopify checkout may be leaking revenue and what a scoped fix sprint would focus on next.
          </p>
        </section>

        <section className="rounded-xl border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(15,23,42,1)_0%,rgba(11,31,45,1)_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Primary finding</p>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-white">{scorecard.revenueOpportunityDisplay}</div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            This is a benchmark-based estimate of likely opportunity, not tracked live revenue. The audit helps decide whether the ShopiFixer Fix Sprint is the right next step for the issue surfaced here.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-4 rounded-xl bg-[#0f172a] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">What the audit found</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white">{primaryIssue}</h2>
            <p className="text-sm leading-7 text-slate-300">
              Confidence: <span className="font-medium text-slate-100">{confidence}</span>
            </p>
            <p className="text-sm leading-7 text-slate-400">
              Scorecard snapshot: <span className="text-slate-200">{convertedScore}</span>
            </p>
            <p className="text-sm leading-7 text-slate-300">
              The next decision is whether this problem is worth fixing with a scoped sprint. That is what the ShopiFixer offer is built for.
            </p>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Why this matters</p>
            <p className="text-sm leading-7 text-slate-300">
              Small checkout issues compound quickly. The audit exists to show which issue should be fixed first and whether the scoped ShopiFixer sprint is a fit.
            </p>
            <p className="text-sm leading-7 text-slate-400">
              This is still an estimate, not a guarantee. The recommendation becomes more concrete when you compare the result against the $950 Fix Sprint.
            </p>
          </section>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Recommended next move</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{scorecard.benchmarkSummary || "Review the ShopiFixer Fix Sprint"}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            If the audit surfaces a real fix candidate, the next step is to review the ShopiFixer offer and decide whether to proceed with the scoped sprint.
          </p>
        </section>

        <section className="rounded-xl border border-slate-800 bg-[#07111f] p-5 shadow-2xl shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Next step</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/shopifixer" className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              See the $950 Fix Sprint
            </Link>
            <Link href="/shopifixer" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200">
              Review the ShopiFixer offer
            </Link>
          </div>
        </section>
      </CenteredContainer>
    </>
  );
}
