type AutopilotCardProps = {
  revenueOpportunity: string;
  benchmarkGap: string;
  topOpportunityArea: string;
};

export default function AutopilotCard({
  revenueOpportunity,
  benchmarkGap,
  topOpportunityArea,
}: AutopilotCardProps) {
  return (
    <section className="rounded-3xl border border-cyan-900/40 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_24px_80px_rgba(8,145,178,0.12)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Autopilot</p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">Turn revenue recovery on</h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-300">
            Abando can automatically recover revenue from checkout friction, cart abandonment, and upsell gaps.
          </p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
          Autopilot Off
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Revenue Opportunity</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{revenueOpportunity}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Benchmark Gap</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{benchmarkGap}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Top Opportunity Area</p>
          <p className="mt-3 text-xl font-semibold tracking-tight text-white">{topOpportunityArea}</p>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Turn on Autopilot
        </button>
      </div>
    </section>
  );
}
