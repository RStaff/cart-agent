type HeroMetricCardProps = {
  value: string;
};

export default function HeroMetricCard({ value }: HeroMetricCardProps) {
  return (
    <div className="rounded-[32px] border border-cyan-900/50 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_42%),linear-gradient(180deg,rgba(8,47,73,0.26),rgba(15,23,42,0.74))] p-[1px] shadow-[0_0_0_1px_rgba(34,211,238,0.06),0_24px_80px_rgba(8,145,178,0.14)]">
      <div className="rounded-[31px] border border-slate-800/80 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.99))] px-8 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/85">Estimated Lost Revenue</p>
        <p className="mt-4 text-5xl font-semibold tracking-tight text-white md:text-7xl">{value}</p>
        <p className="mt-4 text-sm leading-6 text-slate-400">Estimated revenue leak based on traffic and conversion</p>
      </div>
    </div>
  );
}
