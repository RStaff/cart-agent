function normalizeConfidence(opportunity = {}, scoreResult = {}) {
  if (typeof opportunity?.confidenceScore === "number") return opportunity.confidenceScore;
  if (typeof scoreResult?.subscores?.confidence === "number") return scoreResult.subscores.confidence;
  const label = String(opportunity?.confidence || "").toLowerCase();
  if (label === "high") return 5;
  if (label === "medium") return 3;
  if (label === "low") return 1;
  return 3;
}

function normalizeEffort(opportunity = {}) {
  const effort = opportunity?.effortRequired ?? opportunity?.effortLevel ?? opportunity?.effort_size ?? "medium";
  if (typeof effort === "number") {
    if (effort <= 1) return "low";
    if (effort >= 3) return "high";
    return "medium";
  }

  const value = String(effort || "").trim().toLowerCase();
  if (value === "low" || value === "small") return "low";
  if (value === "high" || value === "large") return "high";
  return "medium";
}

export function resolveExecutionMode(opportunity = {}, scoreResult = {}) {
  const score = Number(scoreResult?.score) || 0;
  const confidence = normalizeConfidence(opportunity, scoreResult);
  const effortRequired = normalizeEffort(opportunity);
  const reasons = [];

  if (score < 10) {
    reasons.push("Score is below the automation threshold.");
    return {
      decision: "IGNORE",
      executionMode: "AUTO",
      reasons,
    };
  }

  if (score < 18) {
    reasons.push("Score is within the direct automation range.");
    return {
      decision: "AUTOMATE",
      executionMode: "AUTO",
      reasons,
    };
  }

  if (confidence >= 4 && effortRequired === "low") {
    reasons.push("High score, high confidence, and low effort support hybrid automation.");
    return {
      decision: "AUTOMATE",
      executionMode: "HYBRID",
      reasons,
    };
  }

  reasons.push("High score requires human execution because confidence is not high enough or effort is not low.");
  return {
    decision: "ESCALATE",
    executionMode: "HUMAN_REQUIRED",
    reasons,
  };
}
