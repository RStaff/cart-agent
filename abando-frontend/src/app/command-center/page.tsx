import StatusPanel from "./StatusPanel";

export const metadata = {
  title: "Abando Command Center",
};

export default function CommandCenterPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
            Abando™ for Shopify
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold">
            Live Recovery Command Center
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            This is the home base for your AI-powered recovery engine. Every
            card, segment, and event below will eventually be powered by real
            Shopify abandoned-cart data through the cart-agent backend.
          </p>
        </header>

        <StatusPanel />
      </div>
    </main>
  );
}
