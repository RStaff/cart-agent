// api/lib/aiLabeler.js
// Abando AI Labeler v0.1
// --------------------------------------
// Lightweight heuristic classifier that
// we can later upgrade to call a real LLM.
// For now, it gives structured labels so
// your Command Center + analytics have a
// consistent shape to work with.

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function basicHeuristics(event) {
  const value = numberOrZero(event.value);
  const eventType = (event.eventType || "").toLowerCase();
  const source = (event.eventSource || "").toLowerCase();
  const note =
    (event.metadata &&
      (event.metadata.note ||
        event.metadata.message ||
        event.metadata.reason ||
        ""))?.toLowerCase() || "";

  // --- Segment ---
  // Rough segmentation based on cart value + context
  let segment = "browsing";
  if (value >= 200) segment = "vip_high_value";
  else if (value >= 80) segment = "high_value";
  else if (value >= 30) segment = "mid_value";

  // --- Urgency ---
  let urgency = "medium";
  if (value < 20) urgency = "low";
  if (eventType.includes("checkout") || eventType.includes("payment")) {
    urgency = "high";
  }
  if (note.includes("error") || note.includes("failed")) {
    urgency = "high";
  }

  // --- Risk ---
  let risk = "churn_risk";
  if (eventType.includes("recovered")) risk = "recovered";
  if (eventType.includes("test")) risk = "none";
  if (source.includes("internal") || source.includes("system")) {
    risk = "none";
  }

  // --- Channel Hint ---
  let channelHint = "email";
  if (value >= 200) channelHint = "concierge";
  else if (value < 30) channelHint = "ads_retarket";
  if (note.includes("sms") || note.includes("text")) channelHint = "sms";

  return {
    engine: "abando-basic-v0.1",
    segment,
    urgency,
    risk,
    channelHint,
  };
}

async function classifyCartEvent(event) {
  // In the future, this is where we might:
  // - Call OpenAI / Anthropic / custom LLM
  // - Use a trained in-house classifier
  // For now, it's pure JS heuristics.
  try {
    const base = basicHeuristics(event);
    return {
      ...base,
      // Keep room for future model metadata
      version: "0.1.0",
      ts: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[aiLabeler] failed to classify event:", err);
    return {
      engine: "abando-basic-v0.1",
      segment: "unknown",
      urgency: "medium",
      risk: "unknown",
      channelHint: "email",
      error: String(err && err.message ? err.message : err),
      ts: new Date().toISOString(),
    };
  }
}

module.exports = {
  classifyCartEvent,
};
