"use strict";

/**
 * Debug classifier: NEVER calls OpenAI.
 * Returns a simple label based only on value.
 */
async function classifyCartEvent(event) {
  const value = Number(event.value || 0);

  let segment = "low_value";
  if (value >= 150) segment = "vip";
  else if (value >= 75) segment = "high_value";

  let urgency = "normal";
  if (value >= 150) urgency = "hot";
  else if (value >= 75) urgency = "elevated";

  const risk = value >= 150 ? "churn_risk" : "standard";

  return {
    segment,
    urgency,
    risk,
    value,
    reason: "debug rule-based labeler (no OpenAI)",
  };
}

module.exports = { classifyCartEvent };
