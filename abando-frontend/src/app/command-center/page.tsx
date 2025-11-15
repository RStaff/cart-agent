import Link from "next/link";

export const metadata = {
  title: "Command Center — Abando",
  description:
    "See everything your AI Shopping Copilot is doing: recovered revenue, live experiments, and objection-handling playbooks.",
};

export default function CommandCenterPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 text-slate-100 md:pt-14">
      {/* Hero */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
          Command Center
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          One place to see, tune, and trust your AI cart recovery.
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
          Abando&apos;s Command Center shows you what your AI Shopping Copilot
          is doing in real time: which objections it&apos;s handling, which
          offers are firing, and how much revenue it&apos;s recovering across
          your funnels.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/demo/playground"
            className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-300"
          >
            Try the copy demo
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900"
          >
            View pricing tiers
          </Link>
        </div>
      </section>

      {/* Live status tiles */}
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Live status
          </p>
          <p className="mt-2 text-sm font-medium">Stack health</p>
          <p className="mt-1 text-xs text-slate-400">
            Frontend + checkout API heartbeat. Wired to{" "}
            <code className="rounded bg-slate-900 px-1 py-0.5 text-[10px]">
              /api/health
            </code>{" "}
            for self-healing and alerts.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-300">
            <li>• Marketing site: monitoring redirects + uptime</li>
            <li>• Embedded app shell: Shopify install surface</li>
            <li>• Checkout API: pay.abando.ai & Render origin</li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            AI playbooks
          </p>
          <p className="mt-2 text-sm font-medium">Objection handling engine</p>
          <p className="mt-1 text-xs text-slate-400">
            Layered prompts and guardrails that translate your policies into
            checkout-ready answers — without sounding like a robot.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-300">
            <li>• Shipping, sizing, returns, and refunds</li>
            <li>• Discount + urgency frameworks that don&apos;t feel pushy</li>
            <li>• Brand-safe tone with store-specific examples</li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Experiments
          </p>
          <p className="mt-2 text-sm font-medium">Variant testing queue</p>
          <p className="mt-1 text-xs text-slate-400">
            Plan the next wave of experiments: copy variants, incentive types,
            and flows for high-risk carts.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-300">
            <li>• A/B/C message variants per objection</li>
            <li>• Channel-aware prompts (email, SMS, on-site)</li>
            <li>• Guardrails for discount ceilings + margins</li>
          </ul>
        </div>
      </section>

      {/* Deeper feature rows */}
      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-50">
            Buyer-intent aware AI, not just generic chat.
          </h2>
          <p className="text-xs leading-relaxed text-slate-300">
            Abando listens for high-intent signals — cart value, page history,
            time to purchase — and adjusts how aggressive it should be with
            offers and follow-ups.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            <li>• Different playbooks for cold vs. warm vs. hot carts</li>
            <li>• Opt-in for &quot;do not discount unless at risk&quot;</li>
            <li>• Explanation-first answers, offer-second — so it feels human</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-50">
            Built with governance from day one.
          </h2>
          <p className="text-xs leading-relaxed text-slate-300">
            Every message the AI sends is anchored in your policies and
            templates, with a clear audit trail — so your brand, legal, and
            support teams can trust what&apos;s going out.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            <li>• Policy-first prompting, not model-first guesswork</li>
            <li>• &quot;Never say&quot; guardrails for risky claims</li>
            <li>• Clear separation between experimentation and live traffic</li>
          </ul>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mt-12 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
              Ready when you are
            </p>
            <p className="mt-1 text-sm font-medium text-slate-50">
              Switch on Abando for your store, then watch this page light up.
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Command Center is designed to plug into your Shopify metrics and
              Abando&apos;s own telemetry — so you always know what your AI is
              doing with your carts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/demo/playground"
              className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-300"
            >
              Run a sample session
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
