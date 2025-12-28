export default function SupplementsMarketingPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <section className="w-full max-w-4xl mx-auto py-12 px-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-emerald-400 mb-3">
          FOR DTC SUPPLEMENTS & WELLNESS
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-4">
          Recover more checkouts without promising miracles.
        </h1>
        <p className="text-slate-300 mb-6 max-w-2xl">
          Abando segments shoppers by behavior and sends nudges that stay within
          your compliance guardrails—no risky “cure” language, just clear,
          on-brand reminders.
        </p>

        <div className="flex flex-wrap gap-3 mb-10">
          <a
            href="/marketing/supplements/playbook"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-emerald-400 text-black font-semibold hover:bg-emerald-300"
          >
            See supplements recovery playbook
          </a>
          <a
            href="/marketing/demo/playground"
            className="inline-flex items-center px-4 py-3 rounded-lg border border-slate-600 text-slate-100 hover:bg-slate-900/60 text-sm"
          >
            View live demo
          </a>
        </div>
      </section>
    </main>
  );
}
