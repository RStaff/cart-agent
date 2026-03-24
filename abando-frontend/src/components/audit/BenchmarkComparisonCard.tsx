type BenchmarkComparisonCardProps = {
  storeConversion: string;
  shopifyMedianConversion: string;
  revenueOpportunity: string;
};

export default function BenchmarkComparisonCard({
  storeConversion,
  shopifyMedianConversion,
  revenueOpportunity,
}: BenchmarkComparisonCardProps) {
  return (
    <div className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.24)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Benchmark Comparison</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">A directional comparison against a Shopify median conversion estimate.</p>
        </div>
        <p className="text-sm font-medium text-cyan-200">Revenue opportunity: {revenueOpportunity}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[22px] border border-cyan-900/40 bg-slate-950/75 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Your Store Conversion</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{storeConversion}</p>
        </div>
        <div className="rounded-[22px] border border-slate-800 bg-slate-950/75 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Shopify Median Conversion</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{shopifyMedianConversion}</p>
        </div>
      </div>
    </div>
  );
}
