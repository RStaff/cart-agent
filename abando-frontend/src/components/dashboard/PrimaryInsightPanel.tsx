import type { DashboardIssue } from "@/components/dashboard/types";

function stageLabel(stage: string) {
  if (stage === "cart_checkout") return "Cart → Checkout";
  return stage.replace(/_/g, " ");
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PrimaryInsightPanel({
  issue,
  estimatedAtRisk,
  embedded = false,
}: {
  issue: DashboardIssue;
  estimatedAtRisk: number;
  embedded?: boolean;
}) {
  return (
    <section id="primary-insight" className={`rounded-3xl p-6 sm:p-8 ${embedded ? "border border-slate-200 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.08)]" : "border border-cyan-400/20 bg-[#0f172a]"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Primary issue</p>
      <h2 className={`mt-3 text-3xl font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-white"}`}>
        Main checkout issue Abando is tracking
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className={`rounded-2xl p-4 ${embedded ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-slate-950/50"}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>What Abando is seeing</p>
          <p className={`mt-3 text-lg font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-cyan-100"}`}>{issue.summary}</p>
        </div>
        <div className={`rounded-2xl p-4 ${embedded ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-slate-950/50"}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Why that matters</p>
          <p className={`mt-3 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
            If fewer shoppers make it cleanly into checkout, fewer purchases get completed downstream.
          </p>
        </div>
        <div className={`rounded-2xl p-4 ${embedded ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-slate-950/50"}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>What to check first</p>
          <p className={`mt-3 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
            Checkout button visibility, mobile page speed, and whether shipping costs appear too late.
          </p>
        </div>
        <div className={`rounded-2xl p-4 ${embedded ? "border border-cyan-200 bg-cyan-50" : "border border-cyan-400/20 bg-cyan-400/5"}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-cyan-700" : "text-cyan-300"}`}>Estimated revenue at risk at this step</p>
          <p className={`mt-3 text-lg font-semibold ${embedded ? "text-cyan-900" : "text-cyan-100"}`}>{formatCurrency(estimatedAtRisk)}</p>
          <p className={`mt-2 text-sm leading-7 ${embedded ? "text-slate-600" : "text-slate-300"}`}>
            This is an early tracked signal paired with benchmark context. It may sharpen as more checkout activity arrives.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetaPill label="Confidence" value={titleCase(issue.confidence)} embedded={embedded} />
        <MetaPill label="Stage" value={stageLabel(issue.stage)} embedded={embedded} />
        <MetaPill label="Device" value={titleCase(issue.device)} embedded={embedded} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="#install-comparison"
          className={`inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${
            embedded
              ? "border-slate-300 bg-slate-50 text-slate-800 hover:border-slate-400"
              : "border-white/10 bg-slate-900 text-slate-100 hover:border-cyan-300 hover:text-cyan-200"
          }`}
        >
          See why Abando thinks this
        </a>
        <a
          href="#activity-feed"
          className={`inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${
            embedded
              ? "border-cyan-200 bg-cyan-50 text-cyan-800 hover:border-cyan-300"
              : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:border-cyan-300"
          }`}
        >
          View tracked behavior
        </a>
      </div>
    </section>
  );
}

function MetaPill({ label, value, embedded = false }: { label: string; value: string; embedded?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${embedded ? "border border-slate-200 bg-slate-50" : "border border-white/10 bg-slate-950/50"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
      <p className={`mt-2 text-sm font-medium ${embedded ? "text-slate-900" : "text-white"}`}>{value}</p>
    </div>
  );
}
