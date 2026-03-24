import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import CenteredContainer from "@/components/layout/CenteredContainer";

const plans = [
  {
    name: "Starter",
    price: "$49/month",
    cta: "/install/shopify?plan=starter",
    ctaLabel: "Start free trial",
    featured: false,
    features: [
      "Checkout audit + scorecard",
      "Guided advisor insights",
      "Basic recovery tracking (after install)",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "$149/month",
    cta: "/install/shopify?plan=growth",
    ctaLabel: "Start free trial",
    featured: true,
    features: [
      "Everything in Starter",
      "Advanced checkout tracking",
      "Recovery opportunity insights",
      "Priority support",
    ],
  },
  {
    name: "Custom",
    price: "Custom pricing",
    cta: "mailto:support@abando.ai?subject=Abando%20Custom%20Plan",
    ctaLabel: "Contact us",
    featured: false,
    features: [
      "High-volume stores",
      "Custom integrations",
      "Dedicated support",
    ],
  },
];

export default function PricingPage() {
  return (
    <CenteredContainer>
      <header className="flex items-center justify-between">
        <BrandLogo width={148} height={24} />
        <Link href="/run-audit" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
          Run your audit
        </Link>
      </header>

      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          Pricing for Shopify stores looking to recover lost revenue
        </h1>
        <p className="text-base leading-7 text-slate-300">
          Start with a free audit. Upgrade to track real checkout behavior and recovery opportunities.
        </p>
      </section>

      <div className="grid gap-4">
        {plans.map((plan) => (
          <section
            key={plan.name}
            className={[
              "rounded-xl border p-5",
              plan.featured
                ? "border-cyan-400/40 bg-[#0f172a] shadow-[0_0_0_1px_rgba(34,211,238,0.08)]"
                : "border-white/10 bg-[#0f172a]",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-white">{plan.name}</h2>
                  {plan.featured ? (
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                      Recommended
                    </span>
                  ) : null}
                </div>
                <p className="text-3xl font-semibold tracking-tight text-white">{plan.price}</p>
              </div>
              <Link
                href={plan.cta}
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
              >
                {plan.ctaLabel}
              </Link>
            </div>

            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <p className="mt-4 text-sm text-slate-400">No commitment required to run the audit.</p>
          </section>
        ))}
      </div>

      <section className="rounded-xl bg-[#0f172a] p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-white">How this works</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
          <div>1. Run a free audit (no signup)</div>
          <div>2. Connect your Shopify store</div>
          <div>3. Abando tracks real checkout behavior</div>
          <div>4. See where revenue is actually being lost and recovered</div>
        </div>
        <p className="mt-4 text-sm leading-7 text-cyan-100">
          The audit you see before install is a benchmark-based estimate — real tracking begins after connecting your store.
        </p>
      </section>

      <section className="rounded-xl bg-[#0f172a] p-5 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Start with the audit, then decide</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          You do not need to commit on this page to understand whether Abando is relevant for your store.
        </p>
        <div className="mt-5 flex justify-center">
          <Link
            href="/run-audit"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
          >
            Run your audit
          </Link>
        </div>
      </section>
    </CenteredContainer>
  );
}
