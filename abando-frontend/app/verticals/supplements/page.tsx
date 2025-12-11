import { VerticalGrowthEngineSection } from "../../components/VerticalGrowthEngineSection";

export default function SupplementsVerticalPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <VerticalGrowthEngineSection variant="supplements" />

      <section className="w-full max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-lg font-semibold mb-4">
          Recover more checkouts without compliance anxiety.
        </h2>
        <p className="text-sm text-slate-300 mb-4">
          Abando helps DTC supplement brands recover abandoned carts with
          flows that stay aligned to your approved claims and brand guidelines.
        </p>
      </section>
    </main>
  );
}
