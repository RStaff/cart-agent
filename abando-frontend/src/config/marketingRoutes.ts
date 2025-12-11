// Central routing config for Abando marketing & vertical pages.
// This is the single source of truth for ICP-specific routes.

export const marketingRoutes = {
  marketing: {
    boutique: {
      label: "Women’s Boutique Apparel",
      landing: "/marketing/women-boutique",
      playbook: "/marketing/women-boutique/playbook",
    },
    supplements: {
      label: "DTC Supplements & Wellness",
      landing: "/marketing/supplements",
      playbook: "/marketing/supplements/playbook",
    },
  },
  verticals: {
    boutique: "/verticals/women-boutique",
    supplements: "/verticals/supplements",
  },
  demo: {
    playground: "/demo/playground",
  },
  // Where “cold traffic” (Shopify listing, ads, organic) should land by default.
  // You can change this to "supplements" later if the numbers say so.
  coldTraffic: {
    defaultVertical: "boutique",
  },
} as const;

export type VerticalKey = keyof typeof marketingRoutes.verticals;

export function getVerticalLanding(v: VerticalKey): string {
  return marketingRoutes.marketing[v].landing;
}

export function getVerticalPlaybook(v: VerticalKey): string {
  return marketingRoutes.marketing[v].playbook;
}

export function getVerticalEngine(v: VerticalKey): string {
  return marketingRoutes.verticals[v];
}

export function getDefaultColdLanding(): string {
  const v = marketingRoutes.coldTraffic.defaultVertical as VerticalKey;
  return getVerticalLanding(v);
}
