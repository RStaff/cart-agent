import { VerticalGrowthEngineSection } from "../components/VerticalGrowthEngineSection";

export default function VerticalEnginePage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <VerticalGrowthEngineSection variant="boutique" />

      <section className="w-full max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-lg font-semibold mb-4">
          Abando Vertical Growth Engine
        </h2>
        <p className="text-sm text-slate-300 mb-4">
          Start with one best-fit vertical, then layer in additional segments as
          you see results. Abando reuses the same AI brain, tuned to your
          industry.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <a
            href="/marketing/verticals/women-boutique"
            className="block bg-slate-900/60 border border-slate-700 rounded-xl p-4 hover:bg-slate-900"
          >
            <p className="text-xs text-pink-400 mb-1">VERTICAL · LIVE</p>
            <h3 className="font-semibold mb-1">Women’s boutique apparel</h3>
            <p className="text-xs text-slate-300">
              Recover carts for multi-SKU outfits, seasonal drops, and social
              traffic.
            </p>
          </a>

          <a
            href="/verticals/supplements"
            className="block bg-slate-900/60 border border-slate-700 rounded-xl p-4 hover:bg-slate-900"
          >
            <p className="text-xs text-emerald-400 mb-1">VERTICAL · BETA</p>
            <h3 className="font-semibold mb-1">Supplements & wellness</h3>
            <p className="text-xs text-slate-300">
              Recover checkouts for subscriptions while staying within your
              compliance guidelines.
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
