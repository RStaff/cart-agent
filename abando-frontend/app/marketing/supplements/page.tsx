export const metadata = {
  title: "Abando for Supplements & Wellness – Recover Carts, Protect LTV",
  description:
    "Abando helps supplements and wellness brands reduce abandoned carts and keep customers on their refill schedule with AI-powered, compliant messaging.",
};

const features = [
  {
    title: "Recover more first-time orders",
    body: "When shoppers bail at checkout, Abando sends a clean, compliant follow-up that reminds them why your product solves their problem today.",
  },
  {
    title: "Protect your refill schedule",
    body: "Use sequences that nudge customers before they run out, so you don’t lose them to Amazon or a cheaper competitor.",
  },
  {
    title: "Stay on-brand and compliant",
    body: "Guardrails keep messaging aligned with your claims and brand voice instead of rogue AI making risky promises.",
  },
];

const metrics = [
  { label: "Abandoned checkouts / month", value: "180" },
  { label: "Recovered by Abando", value: "34" },
  { label: "Extra monthly revenue", value: "$6,720" },
];

export default function SupplementsLanding() {
  return (
    <div
      className="space-y-12"
      data-variant="supplements"
      data-vertical="supplements-wellness"
    >
      {/* Hero */}
      <section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
            For DTC supplements & wellness brands
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl md:text-5xl">
            Plug the leaks in your{" "}
            <span className="text-emerald-300">checkout & refill funnel.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
            Abando watches your funnel in real time and recovers both
            first-time and refill orders with targeted nudges, sent at the
            moment they matter most.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="/demo/playground"
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-300 transition"
            >
              Watch cart recovery demo
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-slate-300 hover:text-emerald-200 underline-offset-4 hover:underline"
            >
              See how it fits your funnel →
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Ideal for brands doing 200–2,000 orders/month on Shopify.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span>Funnel Impact Snapshot</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              Demo data
            </span>
          </div>
          <div className="space-y-3 text-xs">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2"
              >
                <span className="text-slate-300">{m.label}</span>
                <span className="font-semibold text-emerald-200">
                  {m.value}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-snug text-slate-500">
            Use this as a baseline for an experiment: wire Abando into your
            checkout, then compare recovered revenue month over month.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
          Recovery that respects your CAC and your claims.
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-50">
                {f.title}
              </h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Experiment pitch */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
        <div className="space-y-3 text-sm text-slate-300">
          <h2 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
            Treat Abando like a 60-day experiment.
          </h2>
          <p>
            Instead of debating in the abstract, we hook Abando into your
            checkout, track recovered revenue separately, and compare against
            your existing benchmarks.
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Run a simple A/B on your abandoned checkout flow.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                Compare recovered revenue and refill rates before/after.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                If it doesn&apos;t move the needle, you turn it off. No lock-in.
              </span>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-xs text-emerald-100">
          <p className="font-semibold text-emerald-200">
            “We care about LTV and claims. We can&apos;t afford rogue AI.”
          </p>
          <p className="mt-2 text-xs text-emerald-100/80">
            Abando is built for operators who live in their numbers. You&apos;ll
            know exactly how much revenue it adds, and you control what it can
            say about your products.
          </p>
          <p className="mt-3 text-[11px] text-emerald-200/80">
            Start with the demo, then we&apos;ll design a measured experiment
            for your funnel—no big rebuild required.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-50">
            Ready to see what Abando can recover?
          </h3>
          <p className="mt-1 text-xs text-slate-300">
            Watch the demo, then we&apos;ll outline a 60-day test tailored to
            your funnel and compliance needs.
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 sm:mt-0">
          <a
            href="/demo/playground"
            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-300 transition"
          >
            Watch the cart recovery demo
          </a>
        </div>
      </section>
    </div>
  );
}
