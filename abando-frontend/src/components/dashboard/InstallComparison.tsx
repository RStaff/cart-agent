export default function InstallComparison({ embedded = false }: { embedded?: boolean }) {
  return (
    <section id="install-comparison" className={`rounded-2xl p-5 ${embedded ? "border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]" : "border border-white/10 bg-[#0f172a]"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Install comparison</p>
      <h3 className={`mt-2 text-2xl font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-white"}`}>What changed after install</h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className={`rounded-xl p-4 ${embedded ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-slate-950/50"}`}>
          <p className={`text-sm font-semibold ${embedded ? "text-slate-900" : "text-slate-100"}`}>Before install</p>
          <ul className={`mt-3 space-y-2 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
            <li>Benchmark-based prediction</li>
            <li>No confirmed live checkout behavior yet</li>
          </ul>
        </div>

        <div className={`rounded-xl border p-4 ${embedded ? "border-cyan-200 bg-cyan-50" : "border-cyan-400/20 bg-cyan-400/5"}`}>
          <p className={`text-sm font-semibold ${embedded ? "text-cyan-800" : "text-cyan-100"}`}>After install</p>
          <ul className={`mt-3 space-y-2 text-sm leading-7 ${embedded ? "text-slate-700" : "text-slate-200"}`}>
            <li>Live checkout behavior can be measured</li>
            <li>The original prediction can be confirmed or ruled out over time</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
