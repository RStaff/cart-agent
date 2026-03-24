"use client";

import * as React from "react";

type StartDaySummary = {
  morning_brief_status: string;
  marketing_verification_status: string;
  embedded_verification_status: string;
  outreach_status: string;
  experiment_status: string;
  top_blocker: string;
  recommended_next_action: string;
  headline: string;
};

type StartDayPanelProps = {
  summary: StartDaySummary;
  onMutate: () => Promise<void>;
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm leading-6 text-slate-200">{value || "No status recorded."}</p>
    </div>
  );
}

export default function StartDayPanel({ summary, onMutate }: StartDayPanelProps) {
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("Kick off the standard daily operating loop.");

  async function startDay() {
    setBusy(true);
    setMessage("Starting day sequence...");

    try {
      const result = await postJson<{
        enqueued: Array<{ task_id: string }>;
        batch?: { completed_count?: number; failed_count?: number };
      }>("/api/director/startDay", { autorun: true });
      setMessage(
        `Start Day queued ${result.enqueued.length} tasks. Batch completed ${result.batch?.completed_count ?? 0}, failed ${result.batch?.failed_count ?? 0}.`,
      );
      await onMutate();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to start day.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">Start Day Mode</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Run the standard operating loop</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Generate the morning brief, verify both product surfaces, run outreach, and execute approved experiments from one director action.
          </p>
        </div>
        <button
          className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-400 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
          onClick={startDay}
          type="button"
        >
          Start Day
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryItem label="Morning Brief Status" value={summary.morning_brief_status} />
        <SummaryItem label="Marketing Verification Status" value={summary.marketing_verification_status} />
        <SummaryItem label="Embedded Verification Status" value={summary.embedded_verification_status} />
        <SummaryItem label="Outreach Status" value={summary.outreach_status} />
        <SummaryItem label="Experiment Status" value={summary.experiment_status} />
        <SummaryItem label="Top Blocker" value={summary.top_blocker} />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Recommended Next Action</p>
        <p className="mt-3 text-sm leading-6 text-slate-200">{summary.recommended_next_action}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">{message}</div>
    </section>
  );
}
