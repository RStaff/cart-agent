"use client";

type VerticalVariant = "boutique" | "supplements";

interface Props {
  variant: VerticalVariant;
}

const copyByVariant: Record<VerticalVariant, {
  label: string;
  headline: string;
  subheadline: string;
  bullets: string[];
}> = {
  boutique: {
    label: "WOMEN’S BOUTIQUE APPAREL",
    headline: "Turn fitting-room interest into checkout revenue.",
    subheadline:
      "Abando watches your shoppers’ real behavior and nudges them back with on-brand, boutique-ready flows.",
    bullets: [
      "Recover carts from Instagram, TikTok, and email traffic",
      "Show “complete the look” bundles instead of random upsells",
      "Use SMS and email that sound like your brand, not a chatbot"
    ],
  },
  supplements: {
    label: "DTC SUPPLEMENTS & WELLNESS",
    headline: "Recover more checkouts without breaking compliance.",
    subheadline:
      "Abando’s AI segments shoppers and nudges them back using language that stays inside your approved claims.",
    bullets: [
      "Recover abandoned checkouts from ad traffic and email",
      "Nudge trial buyers into subscriptions with the right timing",
      "Guardrails so AI never promises “cures” or unsafe claims"
    ],
  },
};

export function VerticalGrowthEngineSection({ variant }: Props) {
  const copy = copyByVariant[variant];

  return (
    <section className="w-full max-w-4xl mx-auto py-12 px-4">
      <p className="text-xs font-semibold tracking-[0.2em] text-pink-400 mb-3">
        {copy.label}
      </p>
      <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
        {copy.headline}
      </h1>
      <p className="text-slate-300 mb-8 max-w-2xl">
        {copy.subheadline}
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {copy.bullets.map((b, i) => (
          <div
            key={i}
            className="bg-slate-900/40 border border-slate-700 rounded-xl p-4 text-sm text-slate-200"
          >
            {b}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="/marketing/demo/playground"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-pink-500 text-black font-semibold hover:bg-pink-400"
        >
          View live demo
        </a>
        <a
          href="/marketing/verticals"
          className="inline-flex items-center px-4 py-3 rounded-lg border border-slate-600 text-slate-100 hover:bg-slate-900/60 text-sm"
        >
          Explore other verticals
        </a>
      </div>
    </section>
  );
}
