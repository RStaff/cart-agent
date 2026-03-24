export default function ActivityFeed({ activity, embedded = false }: { activity: string[]; embedded?: boolean }) {
  return (
    <section id="activity-feed" className={`rounded-2xl p-5 ${embedded ? "border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]" : "border border-white/10 bg-[#0f172a]"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Activity</p>
      <h3 className={`mt-2 text-2xl font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-white"}`}>Recent tracking activity</h3>
      <p className={`mt-3 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
        These are the latest setup and measurement updates Abando has recorded for this store.
      </p>
      <div className="mt-5 space-y-3">
        {activity.map((entry, index) => (
          <div key={entry} className={`flex gap-3 rounded-xl px-4 py-3 ${embedded ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-slate-950/50"}`}>
            <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400" />
            <div>
              <p className={`text-sm ${embedded ? "text-slate-900" : "text-white"}`}>{entry}</p>
              <p className={`mt-1 text-xs uppercase tracking-[0.22em] ${embedded ? "text-slate-500" : "text-slate-500"}`}>Event {index + 1}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
