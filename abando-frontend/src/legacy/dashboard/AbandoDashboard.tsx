import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import AutopilotCard from "@/components/dashboard/AutopilotCard";
import RecoveryOpportunityCard from "@/components/dashboard/RecoveryOpportunityCard";

type ScorecardsOutput = {
  store: string;
  checkout_score: number;
  estimated_revenue_leak: string;
  top_leak: string;
  industry_benchmark: string;
  benchmark_comparison?: {
    your_store_conversion: string;
    shopify_median: string;
  };
};

type StoreScore = {
  domain: string;
  opportunity_score: number;
  score_band: string;
};

type AuditRun = {
  domain?: string;
  store_domain?: string;
  audit_result?: {
    top_issue?: string;
    estimated_revenue_leak?: string;
  };
};

type GrowthLoopLog = {
  stages?: Array<{
    stage: string;
    items_processed?: number;
    result?: {
      detected?: number;
      scored?: number;
      stores_processed?: number;
    };
  }>;
};

type AbandoDashboardOutput = {
  revenue_opportunity: string;
  store_score: {
    domain: string | null;
    checkout_score: number;
  };
  benchmark_comparison: {
    your_store_conversion: string;
    shopify_median: string;
  };
  top_opportunities: Array<{
    domain: string;
    top_issue: string;
    estimated_revenue_leak: string;
  }>;
  growth_activity: {
    discovered: number;
    scored: number;
    prioritized: number;
    audited: number;
  };
  autopilot?: {
    status: string;
    benchmark_gap: string;
    top_opportunity_area: string;
  };
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "dashboard", "abando_dashboard_output.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function stageResult(log: GrowthLoopLog, stageName: string) {
  return (Array.isArray(log?.stages) ? log.stages : []).find((stage) => stage.stage === stageName) || null;
}

function benchmarkGapText(yourStoreConversion: string, shopifyMedian: string) {
  const current = Number.parseFloat(String(yourStoreConversion).replace("%", ""));
  const median = Number.parseFloat(String(shopifyMedian).replace("%", ""));
  const gap = Math.max(0, median - current);
  return `${gap.toFixed(1)} pts below median`;
}

export default function AbandoDashboard() {
  const rootDir = findCanonicalRoot();
  const scorecard = readJson<ScorecardsOutput>(
    join(rootDir, "staffordos", "scorecards", "scorecards_output.json"),
    {
      store: "example.myshopify.com",
      checkout_score: 0,
      estimated_revenue_leak: "$0/month",
      top_leak: "checkout_friction",
      industry_benchmark: "Below average checkout performance",
      benchmark_comparison: {
        your_store_conversion: "0.0%",
        shopify_median: "2.6%",
      },
    },
  );
  const storeScores = readJson<{ stores: StoreScore[] }>(
    join(rootDir, "staffordos", "discovery", "store_scores.json"),
    { stores: [] },
  );
  const auditOutput = readJson<{ runs: AuditRun[] }>(
    join(rootDir, "staffordos", "audit", "audit_factory_output.json"),
    { runs: [] },
  );
  const growthLog = readJson<GrowthLoopLog>(
    join(rootDir, "staffordos", "orchestrator", "growth_loop_log.json"),
    { stages: [] },
  );
  const dashboardOutput = readJson<AbandoDashboardOutput>(
    join(rootDir, "staffordos", "dashboard", "abando_dashboard_output.json"),
    {
      revenue_opportunity: scorecard.estimated_revenue_leak,
      store_score: {
        domain: scorecard.store,
        checkout_score: scorecard.checkout_score,
      },
      benchmark_comparison: {
        your_store_conversion: scorecard.benchmark_comparison?.your_store_conversion || "0.0%",
        shopify_median: scorecard.benchmark_comparison?.shopify_median || "2.6%",
      },
      top_opportunities: [],
      growth_activity: {
        discovered: 0,
        scored: 0,
        prioritized: 0,
        audited: 0,
      },
      autopilot: {
        status: "Autopilot Off",
        benchmark_gap: benchmarkGapText(
          scorecard.benchmark_comparison?.your_store_conversion || "0.0%",
          scorecard.benchmark_comparison?.shopify_median || "2.6%",
        ),
        top_opportunity_area: scorecard.top_leak,
      },
    },
  );

  const topStores = [...storeScores.stores]
    .sort((left, right) => Number(right.opportunity_score || 0) - Number(left.opportunity_score || 0))
    .slice(0, 5);

  const topAuditOpportunities = [...auditOutput.runs]
    .filter((run) => run.audit_result)
    .slice(-3)
    .reverse();

  const discovered = Number(stageResult(growthLog, "discovery")?.result?.detected ?? 0);
  const scored = Number(stageResult(growthLog, "scoring")?.result?.scored ?? 0);
  const prioritized = Number(stageResult(growthLog, "prioritization")?.items_processed ?? 0);
  const audited = Number(stageResult(growthLog, "audit_factory")?.result?.stores_processed ?? 0);
  const autopilotBenchmarkGap =
    dashboardOutput.autopilot?.benchmark_gap ||
    benchmarkGapText(
      dashboardOutput.benchmark_comparison?.your_store_conversion || "0.0%",
      dashboardOutput.benchmark_comparison?.shopify_median || "2.6%",
    );
  const topOpportunityArea =
    dashboardOutput.autopilot?.top_opportunity_area ||
    dashboardOutput.top_opportunities?.[0]?.top_issue ||
    scorecard.top_leak;

  return (
    <div className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">Abando</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Abando Merchant Dashboard</h1>
          <p className="max-w-3xl text-base leading-7 text-slate-400">
            Revenue opportunity, benchmark position, audit output, and growth loop activity in one product surface.
          </p>
        </header>

        <AutopilotCard
          revenueOpportunity={dashboardOutput.revenue_opportunity}
          benchmarkGap={autopilotBenchmarkGap}
          topOpportunityArea={topOpportunityArea}
        />

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Revenue Opportunity</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-white">{dashboardOutput.revenue_opportunity}</p>
            <p className="mt-4 text-sm text-slate-400">
              Conversion vs Shopify Median: {dashboardOutput.benchmark_comparison?.your_store_conversion} vs{" "}
              {dashboardOutput.benchmark_comparison?.shopify_median}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Store Performance Score</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-white">{dashboardOutput.store_score.checkout_score}</p>
            <p className="mt-4 text-sm text-slate-400">{scorecard.industry_benchmark}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Top Store Opportunities</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topStores.map((store) => (
              <div key={store.domain} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-sm font-medium text-white">{store.domain}</p>
                <p className="mt-3 text-2xl font-semibold text-cyan-200">{store.opportunity_score}</p>
                <p className="mt-2 text-sm text-slate-400">Band: {store.score_band}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Recovery Opportunities</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {topAuditOpportunities.map((run, index) => (
              <RecoveryOpportunityCard
                key={`${run.domain || run.store_domain}-${index}`}
                domain={run.domain || run.store_domain || "unknown-store"}
                topIssue={run.audit_result?.top_issue || "audit opportunity"}
                estimatedRevenueLeak={run.audit_result?.estimated_revenue_leak || "$0/month"}
              />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Growth Loop Activity</p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {[
              ["Stores discovered", discovered],
              ["Stores scored", scored],
              ["Stores prioritized", prioritized],
              ["Stores audited", audited],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
