"use client";

type RegistryTask = {
  task_id: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
};

function statusLabel(status: string) {
  if (status === "leased" || status === "in_progress") {
    return "running";
  }
  if (status === "failed") {
    return "blocked";
  }
  return status;
}

function statusClasses(status: string) {
  const normalized = statusLabel(status);

  if (normalized === "queued") {
    return "border-amber-700 bg-amber-950/40 text-amber-100";
  }
  if (normalized === "running") {
    return "border-cyan-700 bg-cyan-950/40 text-cyan-100";
  }
  if (normalized === "blocked") {
    return "border-rose-700 bg-rose-950/40 text-rose-100";
  }
  return "border-slate-700 bg-slate-900 text-slate-200";
}

function priorityClasses(priority: string) {
  if (priority === "high") {
    return "text-indigo-200";
  }
  if (priority === "medium") {
    return "text-cyan-200";
  }
  return "text-slate-300";
}

export default function TaskCard({ task }: { task: RegistryTask }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-100">{task.title}</h3>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{task.type}</p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${statusClasses(task.status)}`}>
          {statusLabel(task.status)}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Priority</p>
          <p className={`mt-2 text-sm font-semibold uppercase tracking-[0.18em] ${priorityClasses(task.priority)}`}>
            {task.priority}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Created</p>
          <p className="mt-2 text-sm text-slate-300">{task.created_at}</p>
        </div>
      </div>
    </article>
  );
}
