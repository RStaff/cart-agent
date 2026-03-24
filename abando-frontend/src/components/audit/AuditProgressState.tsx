"use client";

const STAGES = [
  { title: "Processing", description: "Analyzing checkout flow..." },
  { title: "Benchmarking", description: "Comparing your store against similar stores..." },
  { title: "Finalizing", description: "Generating your audit result..." },
];

export default function AuditProgressState({ elapsedMs }: { elapsedMs: number }) {
  const stageIndex = Math.min(Math.floor(elapsedMs / 900), STAGES.length - 1);
  const active = STAGES[stageIndex];

  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/30">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">Audit In Progress</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{active.title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">{active.description}</p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {STAGES.map((stage, index) => {
          const complete = index < stageIndex;
          const current = index === stageIndex;

          return (
            <div
              key={stage.title}
              className={`rounded-2xl border p-4 ${
                current
                  ? "border-cyan-500 bg-cyan-500/10"
                  : complete
                    ? "border-emerald-700 bg-emerald-500/10"
                    : "border-slate-800 bg-slate-950/60"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{stage.title}</p>
              <p className="mt-2 text-sm text-slate-300">{stage.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
