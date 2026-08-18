export const OPPORTUNITY_LIFECYCLE_STATES = [
  "NEW", "CONSIDERING", "PURSUE", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "WITHDRAWN", "CLOSED",
];

export const OPPORTUNITY_LIFECYCLE_LABELS = {
  NEW: "New", CONSIDERING: "Considering", PURSUE: "Pursue", APPLIED: "Applied",
  INTERVIEWING: "Interviewing", OFFER: "Offer", REJECTED: "Rejected", WITHDRAWN: "Withdrawn", CLOSED: "Closed",
};

export const ALLOWED_LIFECYCLE_TRANSITIONS = {
  NEW: ["CONSIDERING", "CLOSED"],
  CONSIDERING: ["PURSUE", "WITHDRAWN", "CLOSED"],
  PURSUE: ["APPLIED", "WITHDRAWN", "CLOSED"],
  APPLIED: ["INTERVIEWING", "REJECTED", "WITHDRAWN", "CLOSED"],
  INTERVIEWING: ["OFFER", "REJECTED", "WITHDRAWN", "CLOSED"],
  OFFER: ["WITHDRAWN", "CLOSED"],
  REJECTED: ["CLOSED"], WITHDRAWN: ["CLOSED"], CLOSED: [],
};

export function normalizeLifecycleState(value) {
  const state = String(value || "").trim().toUpperCase();
  if (!OPPORTUNITY_LIFECYCLE_STATES.includes(state)) throw Object.assign(new Error("INVALID_LIFECYCLE_STATE"), { code: "INVALID_LIFECYCLE_STATE" });
  return state;
}

export function canTransition(from, to) {
  const current = normalizeLifecycleState(from); const next = normalizeLifecycleState(to);
  return current === next || ALLOWED_LIFECYCLE_TRANSITIONS[current].includes(next);
}

export function nextOpportunityAction({ decisionState, lifecycleState }) {
  const lifecycle = normalizeLifecycleState(lifecycleState || "NEW");
  if (lifecycle === "APPLIED") return "Waiting for a response";
  if (lifecycle === "INTERVIEWING") return "Prepare for the interview";
  if (lifecycle === "OFFER") return "Review the offer";
  if (["REJECTED", "WITHDRAWN", "CLOSED"].includes(lifecycle)) return "No action required";
  if (decisionState === "PURSUE") return "Prepare and submit the application";
  if (decisionState === "PASS") return "No action required";
  return "Review the match and decide whether to pursue this opportunity";
}

export function lifecycleEventFor(state) {
  return ({ APPLIED: "APPLICATION_MARKED_APPLIED", INTERVIEWING: "INTERVIEW_MARKED", OFFER: "OFFER_MARKED", REJECTED: "OPPORTUNITY_REJECTED", WITHDRAWN: "OPPORTUNITY_WITHDRAWN", CLOSED: "OPPORTUNITY_CLOSED" })[state] || "OPPORTUNITY_LIFECYCLE_UPDATED";
}

export function triageBucket({ lifecycleState }) {
  const state = normalizeLifecycleState(lifecycleState || "NEW");
  if (state === "NEW") return "NEW";
  if (state === "CONSIDERING") return "CONSIDERING";
  if (state === "PURSUE") return "PURSUE";
  if (state === "APPLIED") return "APPLIED";
  if (state === "INTERVIEWING") return "INTERVIEWING";
  return "CLOSED";
}
