import type { PredictedVsConfirmed } from "@/components/dashboard/types";

export default function HeroStatusStrip({
  shop,
  evidence,
  embedded = false,
}: {
  shop: string;
  evidence: PredictedVsConfirmed;
  embedded?: boolean;
}) {
  const shopLabel = shop || "Connected store";

  return (
    <section
      className={
        embedded
          ? "rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_32px_rgba(15,23,42,0.08)] sm:p-8"
          : "rounded-3xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 sm:p-8"
      }
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Post-install dashboard</p>
          <h1 className={`text-3xl font-semibold tracking-tight sm:text-4xl ${embedded ? "text-slate-950" : "text-white"}`}>
            Shopify connected to Abando™
          </h1>
          <p className={`max-w-3xl text-base leading-8 ${embedded ? "text-slate-600" : "text-slate-200"}`}>
            Abando is now comparing the original scorecard prediction with live checkout behavior from {shopLabel}.
          </p>
        </div>

        <a
          href="#primary-insight"
          className={`inline-flex h-12 items-center justify-center rounded-lg px-5 font-semibold transition-transform duration-150 active:scale-[0.98] ${
            embedded
              ? "bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
              : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_14px_40px_rgba(59,130,246,0.28)]"
          }`}
        >
          Review prediction status
        </a>
      </div>

      <div className={`mt-6 grid gap-3 rounded-2xl p-4 sm:grid-cols-2 xl:grid-cols-4 ${embedded ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-slate-950/40"}`}>
        <StatusItem label="Store" value={shopLabel} embedded={embedded} />
        <StatusItem
          label="Predicted before install"
          value={evidence.predictedIssuePlainEnglish}
          embedded={embedded}
        />
        <StatusItem
          label="Current confirmation status"
          value={`Status: ${evidence.confirmationStatusLabel}`}
          embedded={embedded}
        />
        <StatusItem
          label="Recommended next step"
          value={`Next: ${evidence.recommendedNextAction}`}
          embedded={embedded}
        />
      </div>
    </section>
  );
}

function StatusItem({ label, value, embedded = false }: { label: string; value: string; embedded?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${embedded ? "border border-slate-200 bg-white" : "border border-white/10 bg-slate-950/45"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
      <p className={`mt-2 text-sm font-medium ${embedded ? "text-slate-950" : "text-white"}`}>{value}</p>
    </div>
  );
}
