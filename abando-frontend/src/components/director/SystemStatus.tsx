"use client";

type DirectorSnapshot = {
  generated_at: string;
  queued_tasks: number;
  completed_tasks_today: number;
  failed_tasks_today: number;
  last_task_type: string;
  last_task_status: string;
  top_blocker: string;
  operator_mode: string;
};

function MetricCard({
  label,
  value,
  tone = "text-white",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export default function SystemStatus({ snapshot }: { snapshot: DirectorSnapshot }) {
  const statusTone =
    snapshot.last_task_status === "failed"
      ? "text-rose-300"
      : snapshot.last_task_status === "completed"
      ? "text-emerald-300"
      : "text-amber-300";

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">System Status</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Operator runtime and queue health</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Director-mode visibility into runtime execution, queue pressure, and the latest blocker.
          </p>
        </div>
        <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
          {snapshot.operator_mode || "director"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Queued tasks" value={snapshot.queued_tasks} />
        <MetricCard label="Completed today" value={snapshot.completed_tasks_today} />
        <MetricCard label="Failed today" value={snapshot.failed_tasks_today} />
        <MetricCard label="Last task type" value={snapshot.last_task_type || "none"} />
        <MetricCard label="Runtime status" value={snapshot.last_task_status || "idle"} tone={statusTone} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Top blocker</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">{snapshot.top_blocker || "No blocker recorded."}</p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-slate-600">
          Generated {snapshot.generated_at || "not yet generated"}
        </p>
      </div>
    </section>
  );
}
