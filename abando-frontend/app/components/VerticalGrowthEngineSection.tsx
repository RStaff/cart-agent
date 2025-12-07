"use client";

import Link from "next/link";

type Variant = "women-boutique" | "supplements";

type VariantCopy = {
  label: string;
  headline: string;
  subheadline: string;
  painPoints: string[];
  promise: string;
  proofPoints: string[];
  ctaPrimary: string;
  ctaSecondary: string;
};

const VARIANT_COPY: Record<Variant, VariantCopy> = {
  "women-boutique": {
    label: "Women’s Boutique Apparel",
    headline: "Turn 'just browsing' into repeat boutique customers.",
    subheadline:
      "Abando’s Vertical Growth Engine watches every abandoned cart, learns which outfits convert, and nudges shoppers back with on-brand reminders — without you babysitting ads or email flows.",
    painPoints: [
      "Shoppers add outfits to cart on their phone and never come back.",
      "You run discounts, but aren’t sure which offers actually move inventory.",
      "You don’t have time to babysit Meta Ads, email flows, and popups.",
    ],
    promise:
      "Abando quietly sits between your checkout and your marketing tools, learning which SKUs, bundles, and offers work best for your boutique — then re-engaging shoppers automatically.",
    proofPoints: [
      "Cart-level analytics tuned for small curated catalogs.",
      "Segment suggestions like 'First-time dress browsers' or 'Loyal basics buyers'.",
      "Simple weekly report: 'Here’s what drove recovered revenue this week.'",
    ],
    ctaPrimary: "See Abando for Boutiques",
    ctaSecondary: "View sample recovery report",
  },
  supplements: {
    label: "Supplements & Wellness E-commerce",
    headline: "Recover abandoned carts while building real customer lifetime value.",
    subheadline:
      "Abando’s Vertical Growth Engine helps you recover revenue from abandoned stacks and subscriptions — while staying focused on compliance, trust, and long-term retention.",
    painPoints: [
      "Cart abandonment on high-margin stacks and bundles hurts every launch.",
      "You don’t have clear visibility into which SKUs drive true LTV.",
      "You’re cautious about aggressive discounts or spammy reminders.",
    ],
    promise:
      "Abando learns which offers, bundles, and reminder timings work for your supplement shoppers — then feeds clean segments into your email/SMS tools, not a black-box AI promise.",
    proofPoints: [
      "SKU + bundle-level recovery insight (not just 'revenue up').",
      "Segments like 'First-time stack shoppers' or 'At-risk subscribers'.",
      "Weekly 'no-BS' report you can share with your ops/finance team.",
    ],
    ctaPrimary: "See Abando for Supplements",
    ctaSecondary: "View sample retention cohorts",
  },
};

export function VerticalGrowthEngineSection({
  variant = "women-boutique",
}: {
  variant?: Variant;
}) {
  const copy = VARIANT_COPY[variant];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-neutral-500 mb-3">
        Abando Vertical Growth Engine
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mb-3">
        {copy.headline}
      </h1>
      <p className="text-base sm:text-lg text-neutral-700 mb-8 max-w-2xl">
        {copy.subheadline}
      </p>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
            Who this is for
          </h2>
          <p className="text-sm text-neutral-700">{copy.label}</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
            What’s hurting you now
          </h2>
          <ul className="space-y-2 text-sm text-neutral-700">
            {copy.painPoints.map((p) => (
              <li key={p} className="flex gap-2">
                <span>•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
            How Abando helps
          </h2>
          <p className="text-sm text-neutral-700">{copy.promise}</p>
          <ul className="space-y-2 text-sm text-neutral-700">
            {copy.proofPoints.map((p) => (
              <li key={p} className="flex gap-2">
                <span>✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/demo/playground"
          className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium bg-black text-white hover:bg-neutral-800 transition"
        >
          {copy.ctaPrimary}
        </Link>
        <Link
          href="/demo/playground"
          className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium border border-neutral-300 text-neutral-800 hover:bg-neutral-50 transition"
        >
          {copy.ctaSecondary}
        </Link>
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        Today, these pages run on sample data. As we finalize your Shopify
        integration, these same views will be backed by live Abando cart
        telemetry.
      </p>
    </section>
  );
}
