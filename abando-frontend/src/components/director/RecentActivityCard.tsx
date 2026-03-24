"use client";

type RecentTask = {
  task_id: string;
  type: string;
  title: string;
  status: string;
  created_at: string;
} | null;

type RecentResult = {
  result_id: string;
  result_type: string;
  status?: string;
  summary: string;
  created_at: string;
} | null;

function ActivityItem({
  label,
  title,
  meta,
  body,
}: {
  label: string;
  title: string;
  meta: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{title}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{meta}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

export default function RecentActivityCard({
  mostRecentTask,
  mostRecentResult,
}: {
  mostRecentTask: RecentTask;
  mostRecentResult: RecentResult;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Recent Activity</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Newest canonical task and result entries by creation time.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {mostRecentTask ? (
          <ActivityItem
            label="Most recent task"
            title={mostRecentTask.title}
            meta={`${mostRecentTask.type} · ${mostRecentTask.status}`}
            body={mostRecentTask.created_at}
          />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-400">
            No recent task recorded in the canonical task registry.
          </div>
        )}
        {mostRecentResult ? (
          <ActivityItem
            label="Most recent result"
            title={mostRecentResult.result_type}
            meta={`${mostRecentResult.status || "registered"} · ${mostRecentResult.created_at}`}
            body={mostRecentResult.summary}
          />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-400">
            No recent result recorded in the canonical result registry.
          </div>
        )}
      </div>
    </section>
  );
}
