import type { VerticalKey } from "@/config/marketingRoutes";

export type PsychDriver =
  | "price_sensitivity"
  | "reassurance_seeking"
  | "exploration"
  | "social_proof";

export type DemoShopper = {
  id: string;
  label: string;
  vertical: VerticalKey;
  behaviorSummary: string;
  segmentLabel: string;
  psychDriver: PsychDriver;
  abandoResponse: string;
};

export const demoShoppers: DemoShopper[] = [
  {
    id: "boutique_price_sensitive_outfit",
    label: "Boutique Shopper",
    vertical: "boutique",
    behaviorSummary: "Viewed 3 dresses → added 1 to cart → hesitated on shipping cost.",
    segmentLabel: "Price-Sensitive Outfit Completer",
    psychDriver: "price_sensitivity",
    abandoResponse:
      "Style pairing suggestion + small free-shipping unlock cue instead of a blanket discount.",
  },
  {
    id: "supplements_research_seeker",
    label: "Supplements Shopper",
    vertical: "supplements",
    behaviorSummary: "Compared ingredient labels → added 1 item → stalled at checkout.",
    segmentLabel: "Research-Driven Health Seeker",
    psychDriver: "reassurance_seeking",
    abandoResponse:
      "Science-backed reassurance message that sticks to approved claims and clarifies benefits.",
  },
  {
    id: "returning_high_intent",
    label: "Returning Visitor",
    vertical: "boutique",
    behaviorSummary: "Viewed product again → scrolled reviews → added to cart → left.",
    segmentLabel: "High-Intent Hesitator",
    psychDriver: "social_proof",
    abandoResponse:
      "Subtle reminder plus social-proof nudge (reviews, UGC) instead of pure urgency.",
  },
];
