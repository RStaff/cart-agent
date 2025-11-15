import StatusPanel from "./StatusPanel";

export const metadata = {
  title: "Abando Command Center",
  description:
    "Live status view for Abando — marketing, embedded app shell, and checkout API health in one place.",
};

export default function CommandCenterPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 text-slate-50">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Abando · Command Center
        </p>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          See your Abando stack at a glance.
        </h1>
        <p className="max-w-2xl text-sm text-slate-300">
          This page watches the real endpoints that power Abando — the
          marketing site, the embedded Shopify app, and the checkout API on
          Render. It&apos;s designed for founders, not SRE dashboards: quick
          red/green health so you know when it&apos;s safe to sell.
        </p>
      </header>

      <StatusPanel />

      <section className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <h2 className="text-sm font-semibold text-slate-50">
          What this unlocks next
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Command Center is the base layer. Next up, we can plug in:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          <li>• AI alerts when conversion or health drops.</li>
          <li>
            • Automatic incident notes and suggested fixes when a region or
            endpoint degrades.
          </li>
          <li>
            • Abandoned-cart cohorts tied directly to your Shopify store and
            Abando agent transcripts.
          </li>
        </ul>
        <p className="mt-3 text-[11px] text-slate-500">
          For now, this page proves the stack is real and stable — something you
          can show merchants, partners, or investors.
        </p>
      </section>
    </main>
  );
}
