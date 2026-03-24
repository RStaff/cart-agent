"use client";

type TopActiveSignal = {
  signal_id: string;
  signal_type: string;
  title: string;
  summary: string;
  status?: string;
  score: number;
  priority: string;
  recommended_action: string;
  created_at: string;
} | null;

export default function SignalSummaryCard({ topActiveSignal }: { topActiveSignal: TopActiveSignal }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Signals</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Highest-priority active intelligence from the canonical signal registry.
        </p>
      </div>
      {topActiveSignal ? (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-100">{topActiveSignal.title}</p>
            <div className="rounded-full border border-cyan-800 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-200">
              {topActiveSignal.priority} · {topActiveSignal.score}
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-300">{topActiveSignal.summary}</p>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Recommended action</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{topActiveSignal.recommended_action}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-400">
          No active high-priority signals.
        </div>
      )}
    </section>
  );
}
