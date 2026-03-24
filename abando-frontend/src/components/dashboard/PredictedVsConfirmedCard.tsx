import type { PredictedVsConfirmed } from "@/components/dashboard/types";

function formatCurrency(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Not available yet";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PredictedVsConfirmedCard({
  evidence,
  embedded = false,
}: {
  evidence: PredictedVsConfirmed;
  embedded?: boolean;
}) {
  return (
    <section
      id="primary-insight"
      className={`rounded-3xl p-6 sm:p-8 ${
        embedded
          ? "border border-slate-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.08)]"
          : "border border-cyan-400/20 bg-[#0f172a]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Evidence view</p>
          <h2 className={`mt-2 text-3xl font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-white"}`}>
            Predicted vs confirmed
          </h2>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            embedded
              ? "border-cyan-200 bg-cyan-50 text-cyan-800"
              : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
          }`}
        >
          {evidence.confidenceLabel}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className={`rounded-2xl p-5 ${embedded ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-slate-950/50"}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Predicted before install</p>
          <h3 className={`mt-3 text-xl font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-white"}`}>
            {evidence.predictedIssuePlainEnglish}
          </h3>
          <div className="mt-4 space-y-3 text-sm leading-7">
            <p className={embedded ? "text-slate-600" : "text-slate-300"}>
              <span className={embedded ? "font-semibold text-slate-950" : "font-semibold text-white"}>Predicted issue:</span>{" "}
              {evidence.predictedIssueLabel}
            </p>
            <p className={embedded ? "text-slate-600" : "text-slate-300"}>
              <span className={embedded ? "font-semibold text-slate-950" : "font-semibold text-white"}>Predicted step:</span>{" "}
              {evidence.predictedStepLabel}
            </p>
            <p className={embedded ? "text-slate-600" : "text-slate-300"}>
              <span className={embedded ? "font-semibold text-slate-950" : "font-semibold text-white"}>Predicted revenue at risk:</span>{" "}
              {formatCurrency(evidence.predictedRevenueAtRisk)}
            </p>
            <p className={embedded ? "text-slate-600" : "text-slate-300"}>
              <span className={embedded ? "font-semibold text-slate-950" : "font-semibold text-white"}>Benchmark position:</span>{" "}
              {evidence.predictedBenchmarkPosition !== null ? `${evidence.predictedBenchmarkPosition}% relative to similar stores` : "Below similar stores"}
            </p>
          </div>
          <p className={`mt-4 text-sm leading-7 ${embedded ? "text-slate-500" : "text-slate-400"}`}>
            This was the original scorecard estimate. It pointed to the strongest place shoppers may be slowing down before Abando had live checkout data.
          </p>
        </section>

        <section className={`rounded-2xl p-5 ${embedded ? "border border-cyan-200 bg-cyan-50" : "border border-cyan-400/20 bg-cyan-400/5"}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Confirmed after install</p>
          <h3 className={`mt-3 text-xl font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-white"}`}>
            {evidence.confirmationStatusLabel}
          </h3>
          <p className={`mt-4 text-sm leading-7 ${embedded ? "text-slate-700" : "text-slate-200"}`}>{evidence.confirmationSummary}</p>
          <div className="mt-4 space-y-3 text-sm leading-7">
            <p className={embedded ? "text-slate-700" : "text-slate-200"}>
              <span className={embedded ? "font-semibold text-slate-950" : "font-semibold text-white"}>What live checkout behavior is showing:</span>{" "}
              {evidence.observedSummary}
            </p>
            <p className={embedded ? "text-slate-700" : "text-slate-200"}>
              <span className={embedded ? "font-semibold text-slate-950" : "font-semibold text-white"}>Current confirmation status:</span>{" "}
              {evidence.confirmedSignalLabel || "Still being measured"}
            </p>
            <p className={embedded ? "text-slate-700" : "text-slate-200"}>
              <span className={embedded ? "font-semibold text-slate-950" : "font-semibold text-white"}>Evidence confidence:</span>{" "}
              {evidence.confidenceLabel}
            </p>
            <p className={embedded ? "text-slate-700" : "text-slate-200"}>
              <span className={embedded ? "font-semibold text-slate-950" : "font-semibold text-white"}>Sample size / window:</span>{" "}
              {evidence.sampleSize} tracked session{evidence.sampleSize === 1 ? "" : "s"} across {evidence.measurementWindowLabel}
            </p>
            <p className={embedded ? "text-slate-700" : "text-slate-200"}>
              <span className={embedded ? "font-semibold text-slate-950" : "font-semibold text-white"}>Confirmed revenue impact:</span>{" "}
              {formatCurrency(evidence.confirmedRevenueImpact)}
            </p>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className={`rounded-2xl p-5 ${embedded ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-slate-950/50"}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Still being measured</p>
          <ul className={`mt-4 space-y-2 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
            {evidence.stillMeasuring.map((entry) => (
              <li key={entry} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                <span>{entry}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={`rounded-2xl p-5 ${embedded ? "border border-slate-200 bg-white" : "border border-white/10 bg-slate-950/60"}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Recommended next action</p>
          <p className={`mt-4 text-base leading-8 ${embedded ? "text-slate-700" : "text-slate-200"}`}>
            {evidence.recommendedNextAction}
          </p>
          <p className={`mt-3 text-sm ${embedded ? "text-slate-500" : "text-slate-400"}`}>{evidence.lastUpdatedLabel}</p>
        </section>
      </div>
    </section>
  );
}
