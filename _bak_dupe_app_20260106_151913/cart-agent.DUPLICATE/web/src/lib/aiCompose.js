import { renderAbandonedEmail } from "./renderAbandonedEmail.js";

/**
 * Lightweight AI-ish composer with tone control.
 * Swap the heuristics for an LLM call later without changing this API.
 */
export function composeAbandonEmail({ items = [], tone = "friendly", brand = "Your Store", resumeUrl }) {
  const first = items?.[0];
  const name = (brand || "Your Store").trim();
  const itemLabel = first?.sku ? ` ${first.sku}` : "";

  // Subject heuristics by tone
const subjects = {
  friendly: [
    "Forgot something?",
    `We saved your cart${itemLabel} for you`,
    "Want to finish checking out?"
  ],
  persuasive: [
    `${name} — unlock your saved items`,
    `Still available: your cart${itemLabel}`,
    "Claim your cart before it’s gone"
  ],
  playful: [
    `👀 Still eyeing${itemLabel}?`,
    "Psst… your cart misses you",
    "We kept your picks warm"
  ],
  urgent: [
    "Last chance to grab it",
    "Your cart will expire soon",
    "Don’t lose your picks"
  ],
  kevin_hart: [
    "Look, don’t play—finish the checkout",
    "Quit stalling. Your cart is calling 😂",
    "You were THIS close. Tap to wrap it up"
  ]
};

  const pool = subjects[tone] || subjects.friendly;
  const subject = pool[Math.floor(Math.random() * pool.length)];

  // HTML body via your renderer (uses cid image for real sends)
  const html = renderAbandonedEmail({ items, resumeUrl });

  // Text alt
  const lines = [];
  lines.push("Still thinking it over?");
  lines.push("You left a few items in your cart:");
  for (const i of (items || [])) lines.push(`• ${i.sku} x${i.qty}`);
  lines.push(`Return to your cart: ${resumeUrl || "#"}`);
  const text = lines.join("\n");

  return { subject, html, text };
}
