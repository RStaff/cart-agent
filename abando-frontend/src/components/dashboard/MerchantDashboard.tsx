"use client";

import * as React from "react";
import AuditSummaryCard from "./AuditSummaryCard";
import BenchmarkCard from "./BenchmarkCard";
import LatestSignalCard from "./LatestSignalCard";
import RecommendedActionCard from "./RecommendedActionCard";
import TopIssueCard from "./TopIssueCard";

type MerchantSnapshot = {
  store_domain: string;
  audit_score: number;
  estimated_revenue_leak: string;
  confidence: string;
  top_issue: string;
  benchmark_summary: string;
  recommended_action: string;
  latest_signal: {
    title: string;
    timestamp: string;
    summary: string;
  };
  updated_at: string;
};

export default function MerchantDashboard({ snapshot }: { snapshot: MerchantSnapshot }) {
  const [signal, setSignal] = React.useState(snapshot.latest_signal);

  React.useEffect(() => {
    let cancelled = false;

    async function loadSignal() {
      try {
        const response = await fetch("/api/signals/top", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          top_signals?: Array<{
            title?: string;
            summary?: string;
            created_at?: string;
          }>;
        };
        const topSignal = Array.isArray(data.top_signals) ? data.top_signals[0] : null;

        if (!cancelled && topSignal?.title && topSignal?.summary) {
          setSignal({
            title: topSignal.title,
            summary: topSignal.summary,
            timestamp: topSignal.created_at || snapshot.latest_signal.timestamp,
          });
        }
      } catch {
        // Keep the merchant snapshot fallback signal when the API is unavailable.
      }
    }

    void loadSignal();

    return () => {
      cancelled = true;
    };
  }, [snapshot.latest_signal]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.94))] p-8 shadow-2xl shadow-black/30">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">Merchant View</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Abando Merchant Dashboard</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            Turn checkout friction into recovered revenue with audit intelligence and action guidance.
          </p>
          <p className="mt-6 text-sm text-slate-500">Snapshot updated {snapshot.updated_at}</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Revenue At Risk"
            value={snapshot.estimated_revenue_leak}
            helper="Estimated checkout revenue currently at risk."
          />
          <TopIssueCard issue={snapshot.top_issue} />
          <BenchmarkCard summary={snapshot.benchmark_summary} />
          <RecommendedActionCard action={snapshot.recommended_action} />
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr,0.8fr]">
          <LatestSignalCard signal={signal} />
          <AuditSummaryCard snapshot={snapshot} />
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold leading-tight text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{helper}</p>
    </div>
  );
}
