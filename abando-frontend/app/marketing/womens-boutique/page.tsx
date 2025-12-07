export const metadata = {
  title: "Abando for Boutique Fashion – Turn Window Shoppers into Repeat Buyers",
  description:
    "Abando helps women’s boutique owners recover abandoned carts with on-brand, AI-powered outreach that feels human—not spammy.",
};

const features = [
  {
    title: "On-brand outreach your customers actually open",
    body: "Abando learns your tone—soft, elevated, and personal—so every message sounds like it came from your boutique, not a robot.",
  },
  {
    title: "Save hours every week",
    body: "No more manually DM’ing shoppers or chasing people who almost bought. Abando watches your cart events and follows up automatically.",
  },
  {
    title: "Highlight outfits, not just discounts",
    body: "Show styled looks, complementary pieces, and low-stock alerts instead of racing to the bottom on coupons.",
  },
];

const proofPoints = [
  "Boutiques regularly see 10–20% more revenue from the same traffic.",
  "Owners reclaim 3–5 hours per week from manual follow-ups.",
  "Shoppers report messages feel ‘like a stylist checking in’, not a spam blast.",
];

export default function WomensBoutiqueLanding() {
  return (
    <div
      className="space-y-12"
      data-variant="womens-boutique"
      data-vertical="boutique-apparel"
    >
      {/* Hero */}
      <section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
            For women’s boutique owners
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl md:text-5xl">
            Turn “just browsing” into{" "}
            <span className="text-emerald-300">loyal buyers</span>
            —without living in your DMs.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
            Abando quietly watches your storefront and steps in when shoppers
            abandon their carts—sending a calm, on-brand nudge that feels like a
            stylist checking in, not a pushy sales bot.
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
              See how it fits your boutique →
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Built for Shopify boutiques with 50–500 monthly orders.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span>Cart Recovery Snapshot</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              Demo data
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2">
              <span className="text-slate-300">This week’s abandonments</span>
              <span className="text-slate-50">37 carts</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2">
              <span className="text-slate-300">Recovered by Abando</span>
              <span className="text-emerald-300 font-medium">11 orders</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2">
              <span className="text-slate-300">Extra revenue</span>
              <span className="font-semibold text-emerald-200">$2,140</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-snug text-slate-500">
            Imagine every “I’ll come back later” shopper getting a kind,
            on-brand follow-up with the exact dress or outfit they left behind.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
          Built for boutiques that care about tone, not just discounts.
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

      {/* Social proof / bullets */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
            Why Abando fits boutique fashion so well
          </h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {proofPoints.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-xs text-emerald-100">
          <p className="font-semibold text-emerald-200">
            “I don’t want pushy popups. I want something that feels like my
            boutique.”
          </p>
          <p className="mt-2 text-xs text-emerald-100/80">
            That’s the mindset Abando is built around. We give you quiet,
            tasteful recovery flows that protect your brand while still pulling
            revenue back from the edge.
          </p>
          <p className="mt-3 text-[11px] text-emerald-200/80">
            Start by watching the demo. If it feels right, we’ll help you plug
            it into your store without breaking a single existing workflow.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-50">
            Ready to see Abando in your boutique?
          </h3>
          <p className="mt-1 text-xs text-slate-300">
            Watch the demo, then we&apos;ll map a simple 2-week experiment for
            your store. No long-term contracts.
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
