import BenchmarkBadge from "./BenchmarkBadge";
import BenchmarkComparisonCard from "./BenchmarkComparisonCard";
import HeroMetricCard from "./HeroMetricCard";
import InstallCtaBar from "./InstallCtaBar";
import PrimaryIssueCard from "./PrimaryIssueCard";
import RevenueOpportunityMap from "./RevenueOpportunityMap";
import StoreIdentityBar from "./StoreIdentityBar";

type AuditPreviewData = {
  store_id: string;
  store_domain: string;
  estimated_revenue_leak: string;
  primary_issue: string;
  benchmark_label: string;
  confidence: string;
  install_cta_label: string;
  created_at: string;
};

function parseRevenueAmount(value: string) {
  const digits = String(value || "").replace(/[^0-9]/g, "");
  return Number.parseInt(digits || "0", 10);
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US")} / year`;
}

function buildBenchmarkMetrics(totalOpportunity: number) {
  const basisPoints = Math.floor(totalOpportunity / 20000);
  const storeBasis = Math.max(16, Math.min(22, 16 + basisPoints));
  const medianBasis = Math.max(storeBasis + 5, Math.min(32, storeBasis + 8));

  return {
    storeConversion: `${(storeBasis / 10).toFixed(1)}%`,
    shopifyMedianConversion: `${(medianBasis / 10).toFixed(1)}%`,
  };
}

function buildOpportunityRows(totalOpportunity: number) {
  const checkoutFriction = Math.round(totalOpportunity * 0.38);
  const cartAbandonment = Math.round(totalOpportunity * 0.31);
  const trustSignals = Math.round(totalOpportunity * 0.18);
  const emailRecoveryGap = Math.max(totalOpportunity - checkoutFriction - cartAbandonment - trustSignals, 0);

  return [
    {
      label: "Checkout friction",
      amount: formatCurrency(checkoutFriction),
      accent: "cyan" as const,
    },
    {
      label: "Cart abandonment",
      amount: formatCurrency(cartAbandonment),
      accent: "amber" as const,
    },
    {
      label: "Trust signals",
      amount: formatCurrency(trustSignals),
      accent: "violet" as const,
    },
    {
      label: "Email recovery gap",
      amount: formatCurrency(emailRecoveryGap),
      accent: "emerald" as const,
    },
  ];
}

export default function AuditPreviewCard({
  preview,
  screenshotMode = false,
}: {
  preview: AuditPreviewData;
  screenshotMode?: boolean;
}) {
  const totalOpportunity = parseRevenueAmount(preview.estimated_revenue_leak);
  const opportunityRows = buildOpportunityRows(totalOpportunity);
  const benchmarkMetrics = buildBenchmarkMetrics(totalOpportunity);

  return (
    <section className="rounded-[36px] border border-slate-800/90 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.38)] md:p-10">
      <StoreIdentityBar storeDomain={preview.store_domain} />

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300">Abando</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">Checkout Revenue Opportunity Detected</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-400">{preview.confidence}</span>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <HeroMetricCard value={preview.estimated_revenue_leak} />
        <div className="flex flex-wrap items-center gap-4">
          <BenchmarkBadge label={preview.benchmark_label} />
        </div>
      </div>

      <div className="mt-8">
        <BenchmarkComparisonCard
          storeConversion={benchmarkMetrics.storeConversion}
          shopifyMedianConversion={benchmarkMetrics.shopifyMedianConversion}
          revenueOpportunity={preview.estimated_revenue_leak}
        />
      </div>

      <div className="mt-8">
        <RevenueOpportunityMap rows={opportunityRows} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
        <PrimaryIssueCard issue={preview.primary_issue} confidence={preview.confidence} />
        <div className="rounded-[28px] border border-slate-800 bg-slate-950/70 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Revenue opportunity</p>
          <p className="mt-4 text-base leading-7 text-slate-300">
            This preview highlights a likely checkout revenue opportunity, not a guaranteed outcome. Install Abando to
            validate, monitor, and act on the issue over time.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <InstallCtaBar label={preview.install_cta_label} screenshotMode={screenshotMode} />
      </div>
    </section>
  );
}
