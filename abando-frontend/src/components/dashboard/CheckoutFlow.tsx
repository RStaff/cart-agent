import type { PredictedVsConfirmed } from "@/components/dashboard/types";

function formatCurrency(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Not available yet";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CheckoutFlow({
  evidence,
  embedded = false,
}: {
  evidence: PredictedVsConfirmed;
  embedded?: boolean;
}) {
  const steps = [
    { label: "Cart", active: true },
    { label: "Checkout", active: true },
    { label: "Payment", active: false },
    { label: "Purchase", active: false },
  ];

  return (
    <section className={`rounded-2xl p-6 ${embedded ? "border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]" : "border border-white/10 bg-[#0f172a]"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Checkout flow</p>
          <h3 className={`mt-2 text-2xl font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-white"}`}>Where shoppers may be slowing down</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${embedded ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"}`}>
          {evidence.confirmationStatus === "not_started" ? "Predicted slowdown" : "Predicted / live comparison"}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-3">
            <div
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                step.active
                  ? embedded
                    ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                    : "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                  : embedded
                    ? "border-slate-200 bg-slate-50 text-slate-600"
                    : "border-white/10 bg-slate-950/50 text-slate-300"
              }`}
            >
              {step.label}
            </div>
            {index < steps.length - 1 ? <span className="hidden text-slate-500 md:inline">→</span> : null}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`rounded-2xl border px-4 py-4 ${embedded ? "border-cyan-200 bg-cyan-50" : "border-cyan-400/20 bg-cyan-400/5"}`}>
          <p className={`text-sm font-medium ${embedded ? "text-cyan-800" : "text-cyan-100"}`}>Predicted step: {evidence.predictedStepLabel}</p>
          <p className={`mt-2 text-sm leading-7 ${embedded ? "text-slate-700" : "text-slate-200"}`}>
            This is the place where shoppers may be slowing down.
          </p>
          <p className={`mt-3 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
            If fewer shoppers reach payment, fewer purchases get completed.
          </p>
          <p className={`mt-3 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
            {evidence.observedStepLabel
              ? `Live checkout behavior is currently showing the strongest slowdown around ${evidence.observedStepLabel}.`
              : "Abando is still measuring live checkout behavior before naming a strongest slowdown step."}
          </p>
        </div>

        <div className={`rounded-2xl border px-4 py-4 ${embedded ? "border-slate-200 bg-slate-50" : "border-white/10 bg-slate-950/50"}`}>
          <p className={`text-sm font-medium ${embedded ? "text-slate-950" : "text-white"}`}>Estimated revenue at risk at this step</p>
          <p className={`mt-2 text-lg font-semibold ${embedded ? "text-cyan-800" : "text-cyan-100"}`}>
            {formatCurrency(evidence.predictedRevenueAtRisk)}
          </p>
          <p className={`mt-3 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
            Abando originally estimated that {formatCurrency(evidence.predictedRevenueAtRisk)} may be at risk around this step.
          </p>
          <p className={`mt-3 text-sm leading-7 ${embedded ? "text-slate-500" : "text-slate-400"}`}>
            {evidence.confirmationStatus === "confirmed"
              ? "This pattern is now being confirmed by live checkout behavior."
              : "This amount is still a pre-install estimate until live checkout behavior confirms it."}
          </p>
        </div>
      </div>
    </section>
  );
}
