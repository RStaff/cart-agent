export default function RecommendedActionCard({ action }: { action: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Recommended Action</p>
      <p className="mt-4 text-xl font-semibold leading-tight text-white">{action}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">Highest-leverage next move based on current signals.</p>
    </div>
  );
}
