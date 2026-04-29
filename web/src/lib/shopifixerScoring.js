export function computeShopifixerScore(events = [], lead = {}) {
  const types = new Set(events.map((event) => event.event_type));

  let score = 0;

  if (types.has("shopifixer_lead_created")) score += 5;
  if (types.has("shopifixer_lead_updated")) score += 5;
  if (types.has("audit_result_viewed")) score += 20;
  if (types.has("pricing_viewed")) score += 30;
  if (types.has("onboarding_started")) score += 40;
  if (types.has("payment_completed")) score += 70;

  if (lead.contact?.email || lead.email || lead.execution?.send_target) score += 10;
  if (lead.engagement?.audit_viewed) score += 10;
  if (lead.engagement?.experience_viewed) score += 10;

  return Math.min(score, 100);
}

export function classifyShopifixerTemperature(score = 0) {
  if (score >= 70) return "hot";
  if (score >= 30) return "warm";
  return "cold";
}
