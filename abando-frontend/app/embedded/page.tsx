import fs from "fs";
import path from "path";
import { Suspense } from "react";
import { EmbeddedAdminTitleBar } from "../../src/components/EmbeddedAdminTitleBar";
import { EmbeddedUpgradeButton } from "../../src/components/EmbeddedUpgradeButton";

type ControlSnapshot = {
  audit_views?: number;
  audit_runs?: number;
  install_clicks?: number;
  installs?: number;
  operator_signal?: "green" | "yellow" | "red";
  latest_intelligence_event?: string;
};

type BenchmarkData = {
  segments?: Array<{
    segment?: string;
    store_count?: number;
    average_estimated_monthly_revenue_loss?: number;
    average_benchmark_recovery_rate?: number;
  }>;
};

type IntelligenceFeed = {
  events?: Array<{
    timestamp?: string;
    message?: string;
  }>;
};

type AuditReport = {
  store_domain?: string;
  detected_issue?: string;
  estimated_revenue_leak?: string;
  recommendation?: string;
  audit_score?: number;
};

function readJson<T>(segments: string[], fallback: T): T {
  const filePath = path.join(process.cwd(), "..", ...segments);

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (_error) {
    return fallback;
  }
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number") {
    return "Not available yet";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getLatestIntelligenceEvent(feed: IntelligenceFeed, fallback?: string) {
  const events = Array.isArray(feed.events) ? feed.events.slice() : [];

  events.sort((left, right) => {
    const leftTime = new Date(left.timestamp || 0).getTime();
    const rightTime = new Date(right.timestamp || 0).getTime();
    return rightTime - leftTime;
  });

  return events[0]?.message || fallback || "No intelligence event recorded.";
}

function getTopSegment(benchmarks: BenchmarkData) {
  const segments = Array.isArray(benchmarks.segments) ? benchmarks.segments.slice() : [];

  segments.sort((left, right) => {
    if ((right.store_count || 0) !== (left.store_count || 0)) {
      return (right.store_count || 0) - (left.store_count || 0);
    }

    return String(left.segment || "").localeCompare(String(right.segment || ""));
  });

  return segments[0] || null;
}

function getTopDetectedIssue(reports: AuditReport[]) {
  const counts = new Map<string, number>();

  for (const report of reports) {
    const issue = report.detected_issue || "";
    if (!issue) {
      continue;
    }

    counts.set(issue, (counts.get(issue) || 0) + 1);
  }

  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return ranked[0]?.[0] || "No issue detected yet";
}

function SignalPill({ signal }: { signal: "green" | "yellow" | "red" }) {
  const styles = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    yellow: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${styles[signal]}`}>
      {signal}
    </span>
  );
}

function SectionCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-3 text-sm leading-6 text-slate-500">{helper}</p> : null}
    </div>
  );
}

export default function EmbeddedDashboard() {
  const controlSnapshot = readJson<ControlSnapshot>(
    ["staffordos", "control_panel", "abando_control_snapshot.json"],
    {},
  );
  const benchmarks = readJson<BenchmarkData>(
    ["staffordos", "benchmark", "segment_benchmarks.json"],
    { segments: [] },
  );
  const analytics = readJson<{ events?: Array<{ event_type?: string }> }>(
    ["staffordos", "analytics", "install_events.json"],
    { events: [] },
  );
  const intelligence = readJson<IntelligenceFeed>(
    ["staffordos", "intelligence", "intelligence_feed.json"],
    { events: [] },
  );
  const auditReports = readJson<AuditReport[]>(
    ["staffordos", "audit", "audit_reports.json"],
    [],
  );

  const topSegment = getTopSegment(benchmarks);
  const topIssue = getTopDetectedIssue(Array.isArray(auditReports) ? auditReports : []);
  const topReport = Array.isArray(auditReports) ? auditReports[0] : null;
  const operatorSignal = controlSnapshot.operator_signal || "yellow";
  const auditRuns = controlSnapshot.audit_runs || 0;
  const installClicks = controlSnapshot.install_clicks || 0;
  const installs = controlSnapshot.installs || 0;
  const revenueAtRisk = topSegment?.average_estimated_monthly_revenue_loss;
  const benchmarkRecoveryRate = topSegment?.average_benchmark_recovery_rate;
  const latestEvent = getLatestIntelligenceEvent(intelligence, controlSnapshot.latest_intelligence_event);
  const auditViews = Array.isArray(analytics.events)
    ? analytics.events.filter((event) => event?.event_type === "audit_view").length
    : 0;

  return (
    <>
      <EmbeddedAdminTitleBar />
      <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f6f2_0%,_#efece3_100%)] text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
          <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Abando Audit Console
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                  Abando Audit Console
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                  Find hidden revenue leaks in your Shopify store.
                </p>
              </div>
              <SignalPill signal={operatorSignal} />
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <SectionCard
              title="Revenue at Risk"
              value={formatCurrency(revenueAtRisk)}
              helper={topSegment ? `Estimated from the ${topSegment.segment} benchmark baseline.` : "Revenue-at-risk signal will populate when benchmark data is available."}
            />

            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Pricing</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">Free</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Audit summary, benchmark snapshot, and product status visibility.</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                  <p className="text-sm font-semibold text-white">Pro</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-50/90">Continuous monitoring, prioritized fixes, and upgrade-ready billing flow.</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-300">Shopify-managed billing note: plan upgrades should continue through the existing Shopify billing approval flow.</p>
              <Suspense fallback={<p className="mt-5 text-sm leading-6 text-slate-300">Upgrade actions load when the Shopify shop context is available.</p>}>
                <EmbeddedUpgradeButton />
              </Suspense>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <SectionCard
              title="Top Detected Issue"
              value={topIssue}
              helper={topReport?.recommendation || "Issue detail will improve as more audit reports land."}
            />
            <SectionCard
              title="Benchmark Comparison"
              value={benchmarkRecoveryRate ? `~${Math.round(benchmarkRecoveryRate * 100)}% recovery potential` : "Awaiting benchmark data"}
              helper={benchmarkRecoveryRate ? `Stores like yours recover ~${Math.round(benchmarkRecoveryRate * 100)}% of abandoned carts when optimized.` : "No benchmark comparison available yet."}
            />
            <SectionCard
              title="Latest Audit Signal"
              value={latestEvent}
              helper="Latest audit-side signal available from current StaffordOS data."
            />
            <SectionCard
              title="Audit Status"
              value={`${auditRuns} audits run`}
              helper={`${auditViews} audit views, ${installClicks} install clicks, ${installs} installs.`}
            />
            <SectionCard
              title="Product Status"
              value={operatorSignal === "green" ? "Healthy" : operatorSignal === "yellow" ? "Needs attention" : "At risk"}
              helper="Derived from the current Abando control snapshot."
            />
            <SectionCard
              title="Audit Summary"
              value={topReport?.estimated_revenue_leak || "No audit summary yet"}
              helper={topReport?.store_domain ? `Latest audit proof available for ${topReport.store_domain}.` : "Run or generate an audit summary to populate this panel."}
            />
          </section>
        </div>
      </main>
    </>
  );
}
