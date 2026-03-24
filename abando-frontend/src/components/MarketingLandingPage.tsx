import Link from "next/link";
import PublicHeader from "@/components/brand/PublicHeader";
import CenteredContainer from "@/components/layout/CenteredContainer";

export function MarketingLandingPage() {
  return (
    <CenteredContainer>
      <PublicHeader />

      <section className="rounded-2xl border border-cyan-400/15 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(135deg,_#0f172a_0%,_#0b1f2d_55%,_#10283a_100%)] p-6">
        <div className="inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
          Checkout Decision Engine for Shopify
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
          Understand where your checkout may be losing conversions before you install anything.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Run a free 30-second checkout audit, then decide whether to confirm it with real tracking after install.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/run-audit"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
          >
            Run your free audit
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 bg-[#020617] px-5 font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            See pricing
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">No signup. No install. No risk.</p>
      </section>

      <section className="rounded-xl bg-[#0f172a] p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-white">How Abando works</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
          <div>1. Run a 30-second audit to see estimated checkout opportunity.</div>
          <div>2. Review the strongest place shoppers may be slowing down on your public scorecard.</div>
          <div>3. Connect Shopify to confirm what is actually happening with real tracked behavior.</div>
        </div>
      </section>

      <section className="rounded-xl bg-[#0f172a] p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Why merchants use it</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          The goal is not to make a benchmark estimate look bigger than it is. The goal is to show whether a real checkout issue may be worth confirming.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Tracked results begin after install. The public audit is there to make the problem legible before you commit to deeper setup.
        </p>
      </section>
    </CenteredContainer>
  );
}
