#!/usr/bin/env bash
set -euo pipefail

# Run from repo root
cd "$(dirname "$0")/.."

echo "🔧 Creating src/config/marketingRoutes.ts ..."

mkdir -p src/config

cat << 'TS' > src/config/marketingRoutes.ts
// src/config/marketingRoutes.ts
// Single source of truth for Abando marketing + vertical routes.

export type VerticalKey = "boutique" | "supplements";

export const marketingRoutes = {
  demo: {
    playground: "/demo/playground",
    legacyMarketingPlayground: "/marketing/demo/playground",
  },

  verticals: {
    index: "/verticals",
    boutique: "/verticals/women-boutique",
    supplements: "/verticals/supplements",
  },

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

  // Canonical “home” for cold traffic (can be updated as strategy evolves)
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

echo "✅ marketingRoutes.ts written to src/config/marketingRoutes.ts"
echo
echo "Next steps:"
echo "  1) npm run dev"
echo "  2) Import routes where needed, e.g.:"
echo "       import { marketingRoutes } from \"@/config/marketingRoutes\""
