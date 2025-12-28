export default function BoutiqueMarketingPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <section className="w-full max-w-4xl mx-auto py-12 px-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-pink-400 mb-3">
          FOR WOMEN’S BOUTIQUE APPAREL
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-4">
          Turn “saved to cart” into paid orders.
        </h1>
        <p className="text-slate-300 mb-6 max-w-2xl">
          Abando watches how shoppers browse outfits, add items, and drop off.
          Then it sends on-brand, boutique-ready nudges that feel like your
          stylist, not a robot.
        </p>

        <div className="flex flex-wrap gap-3 mb-10">
          <a
            href="/marketing/women-boutique/playbook"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-pink-500 text-black font-semibold hover:bg-pink-400"
          >
            See boutique recovery playbook
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
