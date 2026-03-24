"use client";

import * as React from "react";

type DailyBriefing = {
  generated_at: string;
  headline: string;
  summary: string;
  top_metrics: {
    audit_runs: number;
    install_clicks: number;
    installs: number;
  };
  top_opportunity: string;
  top_blocker: string;
  recommended_next_action: string;
};

async function postJson<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function MorningBriefingPanel({
  briefing,
  onMutate,
}: {
  briefing: DailyBriefing;
  onMutate: () => Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");

  async function generateFreshBriefing() {
    setBusy(true);
    setMessage("Generating fresh briefing...");

    try {
      await postJson("/api/director/enqueue", {
        title: "generate fresh briefing",
        type: "generate_daily_briefing",
        payload: {},
      });
      await postJson("/api/director/runBatch", { limit: 1 });
      await onMutate();
      setMessage("Fresh briefing generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to generate briefing.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">Morning Briefing</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{briefing.headline}</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">{briefing.summary}</p>
        </div>
        <button
          className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-400 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
          onClick={generateFreshBriefing}
          type="button"
        >
          Generate Fresh Briefing
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Audit Runs" value={briefing.top_metrics.audit_runs} />
        <MetricCard label="Install Clicks" value={briefing.top_metrics.install_clicks} />
        <MetricCard label="Installs" value={briefing.top_metrics.installs} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Top Opportunity</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{briefing.top_opportunity || "No opportunity recorded."}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Top Blocker</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{briefing.top_blocker || "No blocker recorded."}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Recommended Next Action</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {briefing.recommended_next_action || "Generate the daily briefing to get a recommended action."}
        </p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-slate-600">
          Generated {briefing.generated_at || "not yet generated"}
        </p>
      </div>

      {message ? <div className="mt-4 text-sm text-slate-400">{message}</div> : null}
    </section>
  );
}
