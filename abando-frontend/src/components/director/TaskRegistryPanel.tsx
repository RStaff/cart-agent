"use client";

type RegistryTask = {
  task_id: string;
  type: string;
  title: string;
  requested_by: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  result_ref: string | null;
  error_ref: string | null;
  payload: Record<string, unknown>;
};

export default function TaskRegistryPanel({ tasks }: { tasks: RegistryTask[] }) {
  const recentTasks = tasks.slice().reverse().slice(0, 6);

  return (
    <div className="space-y-4">
      {recentTasks.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
          No registered tasks yet.
        </div>
      ) : (
        recentTasks.map((task) => (
          <div key={task.task_id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">{task.title}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{task.type}</div>
              </div>
              <div className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                {task.status}
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <span>Requested by: {task.requested_by}</span>
              <span>Created: {task.created_at}</span>
              <span>Completed: {task.completed_at || "Pending"}</span>
              <span>Result ref: {task.result_ref || "None"}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
