"use client";

import TaskCard from "./TaskCard";

type RegistryTask = {
  task_id: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
};

export default function TaskQueuePanel({
  tasks,
  helperText,
  queuedCount,
}: {
  tasks: RegistryTask[];
  helperText: string;
  queuedCount: number;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Task Queue</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{helperText}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Queued tasks</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">{queuedCount}</p>
        </div>
      </div>
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-400">
          No tasks currently queued.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard key={task.task_id} task={task} />
          ))}
        </div>
      )}
    </section>
  );
}
