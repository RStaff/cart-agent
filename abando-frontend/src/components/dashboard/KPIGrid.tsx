function formatCurrency(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "Awaiting scorecard context";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function KPIGrid({
  issueTitle,
  estimatedAtRisk,
  trackingLabel,
  evidenceConfidence,
  sampleWindowLabel,
  embedded = false,
}: {
  issueTitle: string;
  estimatedAtRisk: number | null;
  trackingLabel: string;
  evidenceConfidence: string;
  sampleWindowLabel: string;
  embedded?: boolean;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <KpiCard label="Current priority" value={issueTitle} embedded={embedded} />
      <KpiCard label="Estimated revenue at risk" value={formatCurrency(estimatedAtRisk)} valueClassName={embedded ? "text-cyan-700" : "text-cyan-200"} embedded={embedded} />
      <KpiCard label="Confirmation status" value={trackingLabel} helper={`${evidenceConfidence} across ${sampleWindowLabel}.`} embedded={embedded} />
    </section>
  );
}

function KpiCard({
  label,
  value,
  valueClassName,
  helper,
  embedded = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  helper?: string;
  embedded?: boolean;
}) {
  return (
    <section className={`rounded-2xl p-5 ${embedded ? "border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]" : "border border-white/10 bg-[#0f172a]"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
      <p className={`mt-3 text-xl font-semibold ${embedded ? "text-slate-950" : "text-white"} ${valueClassName ?? ""}`}>{value}</p>
      {helper ? <p className={`mt-2 text-sm leading-6 ${embedded ? "text-slate-500" : "text-slate-400"}`}>{helper}</p> : null}
    </section>
  );
}
