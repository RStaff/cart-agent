import { VerticalGrowthEngineSection } from "../../components/VerticalGrowthEngineSection";

export default function WomenBoutiqueVerticalPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <VerticalGrowthEngineSection variant="boutique" />

      <section className="w-full max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-lg font-semibold mb-4">
          Built for boutique owners, not growth hackers.
        </h2>
        <p className="text-sm text-slate-300 mb-4">
          Abando plugs into your Shopify data and uses behavior-based nudges to
          recover lost revenue from social and email traffic, while keeping the
          tone and look of your brand.
        </p>
      </section>
    </main>
  );
}
