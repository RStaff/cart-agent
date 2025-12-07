import Link from "next/link";

const VERTICALS = [
  {
    slug: "women-boutique",
    label: "Women’s Boutique Apparel",
    teaser: "Small curated shops that live or die on repeat customers and merchandising.",
  },
  {
    slug: "supplements",
    label: "Supplements & Wellness E-commerce",
    teaser: "DTC brands selling stacks, subscriptions, and high-margin bundles.",
  },
];

export default function VerticalsIndexPage() {
  return (
    <main className="min-h-screen w-full bg-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500 mb-3">
          Abando Vertical Growth Engine
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mb-4">
          Choose your growth lane.
        </h1>
        <p className="text-base text-neutral-700 mb-10 max-w-2xl">
          Abando starts with a deep focus on a few specific merchant types.
          Each vertical gets language, segments, and reports tuned to how money
          actually moves in that business.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {VERTICALS.map((v) => (
            <Link
              key={v.slug}
              href={`/verticals/${v.slug}`}
              className="block rounded-2xl border border-neutral-200 hover:border-neutral-400 hover:shadow-sm transition p-5"
            >
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                {v.label}
              </h2>
              <p className="text-sm text-neutral-700 mb-3">{v.teaser}</p>
              <p className="text-xs text-neutral-500">
                View the Vertical Growth Engine for this segment →
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-xs text-neutral-500">
          Over time, we can add more verticals here — but we start narrow so you
          can win one lane at a time.
        </p>
      </div>
    </main>
  );
}
