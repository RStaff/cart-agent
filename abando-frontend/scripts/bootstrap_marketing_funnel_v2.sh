#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Bootstrapping Abando marketing funnel (v2)..."

# 1) Ensure directories exist
cd "$(dirname "$0")/.."

mkdir -p \
  app/components \
  app/verticals \
  app/verticals/women-boutique \
  app/verticals/supplements \
  app/marketing \
  app/marketing/women-boutique \
  app/marketing/supplements \
  app/marketing/women-boutique/playbook \
  app/marketing/supplements/playbook \
  app/marketing/demo/playground \
  app/marketing/verticals/women-boutique \
  src/config

#############################################
# 2) VerticalGrowthEngineSection component
#############################################
cat << 'TSX' > app/components/VerticalGrowthEngineSection.tsx
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
TSX

#############################################
# 3) /verticals index (Vertical Growth Engine)
#############################################
cat << 'TSX' > app/verticals/page.tsx
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
TSX

#############################################
# 4) Vertical detail pages
#############################################
# /verticals/women-boutique
cat << 'TSX' > app/verticals/women-boutique/page.tsx
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
TSX

# /verticals/supplements
cat << 'TSX' > app/verticals/supplements/page.tsx
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
TSX

#############################################
# 5) Marketing landing pages (ICP-specific)
#############################################
# /marketing/women-boutique
cat << 'TSX' > app/marketing/women-boutique/page.tsx
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
TSX

# /marketing/supplements
cat << 'TSX' > app/marketing/supplements/page.tsx
export default function SupplementsMarketingPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <section className="w-full max-w-4xl mx-auto py-12 px-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-emerald-400 mb-3">
          FOR DTC SUPPLEMENTS & WELLNESS
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-4">
          Recover more checkouts without promising miracles.
        </h1>
        <p className="text-slate-300 mb-6 max-w-2xl">
          Abando segments shoppers by behavior and sends nudges that stay within
          your compliance guardrails—no risky “cure” language, just clear,
          on-brand reminders.
        </p>

        <div className="flex flex-wrap gap-3 mb-10">
          <a
            href="/marketing/supplements/playbook"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-emerald-400 text-black font-semibold hover:bg-emerald-300"
          >
            See supplements recovery playbook
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
TSX

#############################################
# 6) Vertical playbook pages
#############################################
# /marketing/women-boutique/playbook
cat << 'TSX' > app/marketing/women-boutique/playbook/page.tsx
export default function BoutiquePlaybookPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <section className="w-full max-w-4xl mx-auto py-12 px-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-pink-400 mb-3">
          PLAYBOOK · WOMEN’S BOUTIQUE APPAREL
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">
          3 plays to recover boutique revenue with Abando.
        </h1>

        <p className="text-sm text-slate-300 mb-8">
          These are the starter flows we use with boutique merchants. You can
          rename, edit tone, or turn plays on/off once Abando is live in your
          store.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-pink-400 mb-1">PLAY 1 · FIT CHECK</h4>
            <h3 className="font-semibold mb-2">Abandoned “try-on” cart</h3>
            <p className="text-xs text-slate-300">
              Nudge shoppers who added multiple sizes/colors but never
              checked out.
            </p>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-pink-400 mb-1">PLAY 2 · COMPLETE THE LOOK</h4>
            <h3 className="font-semibold mb-2">Outfit completion</h3>
            <p className="text-xs text-slate-300">
              Recommend items that match what was left in the cart—top, bottom,
              accessories.
            </p>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-pink-400 mb-1">PLAY 3 · LAUNCH DROP SAVE</h4>
            <h3 className="font-semibold mb-2">Drop launch follow-up</h3>
            <p className="text-xs text-slate-300">
              For limited drops, follow up with “your size is still here”
              messaging.
            </p>
          </div>
        </div>

        <section className="mt-8 p-6 bg-slate-900/40 border border-slate-700 rounded-xl">
          <h3 className="font-semibold mb-3">How this connects inside Abando</h3>
          <p className="text-sm text-slate-300 mb-4">
            Each play becomes a configurable flow in Abando. You choose tone,
            channels (email/SMS), and when each play fires.
          </p>

          <a
            href="/marketing/demo/playground"
            className="inline-block bg-pink-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-pink-400"
          >
            View live demo
          </a>
        </section>
      </section>
    </main>
  );
}
TSX

# /marketing/supplements/playbook
cat << 'TSX' > app/marketing/supplements/playbook/page.tsx
export default function SupplementsPlaybookPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <section className="w-full max-w-4xl mx-auto py-12 px-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-emerald-400 mb-3">
          PLAYBOOK · SUPPLEMENTS & WELLNESS
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">
          3 plays to recover supplement revenue, safely.
        </h1>

        <p className="text-sm text-slate-300 mb-8">
          These plays are designed to recover more orders while staying aligned
          to your approved claims. Messaging is always editable and can be
          locked to your compliance rules.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-emerald-400 mb-1">PLAY 1 · FIRST ORDER SAVE</h4>
            <h3 className="font-semibold mb-2">Abandoned first purchase</h3>
            <p className="text-xs text-slate-300">
              Nudge shoppers who added a product but bounced before their first
              order.
            </p>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-emerald-400 mb-1">PLAY 2 · SUBSCRIPTION NUDGE</h4>
            <h3 className="font-semibold mb-2">From one-time to subscription</h3>
            <p className="text-xs text-slate-300">
              Encourage one-time buyers to start a subscription with clear,
              non-medical benefits language.
            </p>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700">
            <h4 className="text-xs text-emerald-400 mb-1">PLAY 3 · BUNDLE COMPLETION</h4>
            <h3 className="font-semibold mb-2">Routine completion</h3>
            <p className="text-xs text-slate-300">
              Suggest complementary products to complete a daily routine without
              over-promising results.
            </p>
          </div>
        </div>

        <section className="mt-8 p-6 bg-slate-900/40 border border-slate-700 rounded-xl">
          <h3 className="font-semibold mb-3">How this connects inside Abando</h3>
          <p className="text-sm text-slate-300 mb-4">
            Each play corresponds to a configurable flow in Abando. You can
            limit wording, channels, and targeting to match your compliance
            playbook.
          </p>

          <a
            href="/marketing/demo/playground"
            className="inline-block bg-emerald-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-emerald-300"
          >
            View live demo
          </a>
        </section>
      </section>
    </main>
  );
}
TSX

#############################################
# 7) Legacy marketing redirects
#############################################
# /marketing/demo/playground → /demo/playground
cat << 'TSX' > app/marketing/demo/playground/page.tsx
import { redirect } from "next/navigation";

export default function LegacyMarketingDemoPlaygroundRedirect() {
  redirect("/demo/playground");
}
TSX

# /marketing/verticals/women-boutique → /verticals/women-boutique
cat << 'TSX' > app/marketing/verticals/women-boutique/page.tsx
import { redirect } from "next/navigation";

export default function LegacyMarketingBoutiqueVerticalRedirect() {
  redirect("/verticals/women-boutique");
}
TSX

#############################################
# 8) marketingRoutes config
#############################################
cat << 'TS' > src/config/marketingRoutes.ts
export type VerticalKey = "boutique" | "supplements";

export const marketingRoutes = {
  marketing: {
    boutique: {
      landing: "/marketing/women-boutique",
      playbook: "/marketing/women-boutique/playbook",
    },
    supplements: {
      landing: "/marketing/supplements",
      playbook: "/marketing/supplements/playbook",
    },
  },
  verticals: {
    boutique: "/verticals/women-boutique",
    supplements: "/verticals/supplements",
  },
  coldTraffic: {
    defaultVertical: "boutique" as VerticalKey,
  },
} as const;

export function getVerticalLanding(v: VerticalKey): string {
  return marketingRoutes.marketing[v].landing;
}

export function getVerticalPlaybook(v: VerticalKey): string {
  return marketingRoutes.marketing[v].playbook;
}

export function getVerticalEngine(v: VerticalKey): string {
  return marketingRoutes.verticals[v];
}
TS

echo "✅ Abando marketing funnel (v2) bootstrapped."
echo "   Routes:"
echo "     • /verticals"
echo "     • /verticals/women-boutique"
echo "     • /verticals/supplements"
echo "     • /marketing/women-boutique"
echo "     • /marketing/supplements"
echo "     • /marketing/women-boutique/playbook"
echo "     • /marketing/supplements/playbook"
echo "     • /marketing/demo/playground (→ /demo/playground)"
echo "     • /marketing/verticals/women-boutique (→ /verticals/women-boutique)"
echo
echo "Next:"
echo "  1) npm run dev"
echo "  2) Visit the routes above and confirm flow."
