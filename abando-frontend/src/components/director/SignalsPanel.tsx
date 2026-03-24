"use client";

import SignalCard from "./SignalCard";

type DirectorSignal = {
  signal_id: string;
  signal_type: string;
  title: string;
  summary: string;
  status: string;
  score: number;
  priority: string;
  recommended_action: string;
  created_at: string;
  installBlocking?: boolean;
  isTopPriority?: boolean;
};

export default function SignalsPanel({
  signals,
  helperText,
}: {
  signals: DirectorSignal[];
  helperText: string;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Signals</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Prioritized active signals from the canonical registry, ordered to expose the biggest install bottleneck first.
        </p>
        <p className="mt-3 text-sm font-medium text-indigo-200">{helperText}</p>
      </div>
      {signals.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-400">
          No active signals. System currently has no urgent bottleneck recorded.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {signals.map((signal) => (
            <SignalCard key={signal.signal_id} signal={signal} />
          ))}
        </div>
      )}
    </section>
  );
}
