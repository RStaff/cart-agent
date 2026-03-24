import type { PublicScorecard } from "@/lib/scorecardTypes";
import { revenueRiskTieIn } from "@/lib/scorecardPresentation";

export default function CheckoutFlowDiagram({ scorecard }: { scorecard: PublicScorecard }) {
  return (
    <section className="rounded-xl bg-[#0f172a] p-5">
      <h2 className="text-2xl font-semibold tracking-tight text-white">Where customers may be hesitating</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Abando is pointing to the move from cart into checkout as the most likely place where momentum is being lost.
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1.2fr_auto_1fr_auto_1fr] md:items-center">
          <StepCard label="Cart" />
          <Arrow />
          <StepCard
            label="Checkout"
            highlighted
            badge="Customers may hesitate here"
          />
          <Arrow />
          <StepCard label="Payment" />
          <Arrow />
          <StepCard label="Purchase" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <p className="text-sm font-medium text-cyan-100">What Abando sees</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            Shoppers may be slowing down before they reach checkout, especially on the move from cart into checkout.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
          <p className="text-sm font-medium text-white">Why that matters</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            If fewer shoppers make it from cart to checkout, fewer of them ever reach payment.
          </p>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
          <p className="text-sm font-medium text-amber-100">Estimated revenue at risk at this step</p>
          <p className="mt-2 text-sm leading-7 text-slate-200">{revenueRiskTieIn(scorecard)}</p>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  label,
  highlighted = false,
  badge,
}: {
  label: string;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlighted
          ? "border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"
          : "border-white/10 bg-slate-950/60"
      }`}
    >
      <div className={`font-medium ${highlighted ? "text-white" : "text-white"}`}>{label}</div>
      {badge ? <p className="mt-3 text-sm text-cyan-100">{badge}</p> : null}
    </div>
  );
}

function Arrow() {
  return <div className="hidden text-center text-slate-500 md:block">→</div>;
}
