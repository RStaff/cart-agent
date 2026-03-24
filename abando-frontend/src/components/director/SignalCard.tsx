"use client";

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

function priorityClasses(priority: string) {
  if (priority === "high") {
    return "border-amber-700 bg-amber-950/40 text-amber-100";
  }
  if (priority === "medium") {
    return "border-cyan-800 bg-cyan-950/40 text-cyan-100";
  }
  return "border-slate-700 bg-slate-900 text-slate-200";
}

export default function SignalCard({ signal }: { signal: DirectorSignal }) {
  return (
    <article
      className={`rounded-xl border p-5 shadow ${
        signal.isTopPriority
          ? "border-indigo-500/60 bg-gradient-to-br from-slate-900 to-indigo-950/40 ring-1 ring-indigo-500/30"
          : "border-slate-800 bg-slate-950"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          {signal.isTopPriority ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-indigo-300">
              Current System Priority
            </div>
          ) : null}
          <h3 className="text-base font-semibold text-slate-100">{signal.title}</h3>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{signal.signal_type}</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Score</div>
          <div className="mt-1 text-3xl font-bold text-slate-100">{signal.score}</div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{signal.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${priorityClasses(signal.priority)}`}>
          {signal.priority} priority
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${
            signal.installBlocking
              ? "border-rose-700 bg-rose-950/40 text-rose-100"
              : "border-emerald-700 bg-emerald-950/40 text-emerald-100"
          }`}
        >
          {signal.installBlocking ? "Install-blocking" : "Non-blocking"}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Recommended action</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">{signal.recommended_action}</p>
      </div>
    </article>
  );
}
