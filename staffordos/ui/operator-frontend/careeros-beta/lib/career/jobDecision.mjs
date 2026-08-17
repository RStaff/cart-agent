export const CAREEROS_OPPORTUNITY_DECISIONS = Object.freeze(["CONSIDERING", "PURSUE", "PASS"]);
export const CAREEROS_OPPORTUNITY_DECISION_LABELS = Object.freeze({ CONSIDERING: "Considering", PURSUE: "Pursue", PASS: "Pass" });

export function normalizeOpportunityDecision(value) {
  const decision = String(value || "").trim().toUpperCase();
  if (!CAREEROS_OPPORTUNITY_DECISIONS.includes(decision)) throw Object.assign(new Error("INVALID_OPPORTUNITY_DECISION"), { code: "INVALID_OPPORTUNITY_DECISION" });
  return decision;
}
