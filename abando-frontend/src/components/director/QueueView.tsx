"use client";

type QueueTask = {
  task_id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
};

function formatTimestamp(value: string) {
  if (!value) {
    return "n/a";
  }

  return value.replace("T", " ").replace(".000Z", "Z");
}

export default function QueueView({ tasks }: { tasks: QueueTask[] }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">Queue</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Queued and historical task state</h2>
        </div>
        <div className="rounded-full border border-slate-700 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">
          {tasks.length} tasks
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-left">
          <thead className="bg-slate-950/70">
            <tr className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              <th className="px-4 py-3 font-semibold">Task ID</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/30">
            {tasks.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-400" colSpan={4}>
                  No tasks found in the queue.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.task_id} className="text-sm text-slate-300">
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{task.task_id}</div>
                    <div className="mt-1 text-xs text-slate-500">{task.title}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-400">{task.type}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-500">{formatTimestamp(task.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
