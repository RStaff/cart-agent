export const dynamic = "force-dynamic";

export default function MarketingHome() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          New • 14-day free trial
        </div>

        <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
          Recover more checkouts with your AI Shopping Copilot
        </h1>

        <p className="mt-4 text-base text-white/70">
          Abando answers questions, handles objections, and guides buyers through checkout—so
          abandonment turns into orders.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="/pricing"
            className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
          >
            Start free trial
          </a>
          <a
            href="/marketing/demo/playground"
            className="rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Try the demo
          </a>
        </div>
      </div>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Why it converts</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>Answers that convert (shipping, sizing, returns)</li>
            <li>Guided checkout with minimal friction</li>
            <li>Proven playbooks (discount, urgency, FAQ)</li>
            <li>Analytics that show recovered revenue</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">How Abando works</h2>
          <ol className="mt-3 space-y-2 text-sm text-white/70">
            <li>Install in Shopify and pick a plan</li>
            <li>Choose tone + offer strategy (stay on-brand)</li>
            <li>Abando follows up and you monitor recoveries</li>
          </ol>
        </div>
      </section>

      <div className="mt-10 text-sm text-white/60">
        Want vertical examples?{" "}
        <a className="underline underline-offset-4 hover:text-white" href="/marketing/women-boutique">
          Women’s boutique
        </a>
        {" "}•{" "}
        <a className="underline underline-offset-4 hover:text-white" href="/marketing/supplements">
          Supplements
        </a>
      </div>
    </main>
  );
}