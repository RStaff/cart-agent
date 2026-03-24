import { prisma } from "../clients/prisma.js";

function normalizeDecisionTrigger(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "unknown";
  if (raw === "idle_45s" || raw === "idle") return "idle";
  if (raw === "beforeunload") return "before_unload";
  if (raw === "manual_override") return "manual_override";
  if (raw === "visibility_hidden") return "visibility_hidden";
  if (raw === "pagehide") return "pagehide";
  return raw.replace(/[^a-z0-9_]+/g, "_");
}

function toDateOrNow(value) {
  const candidate = value ? new Date(value) : new Date();
  return Number.isNaN(candidate.getTime()) ? new Date() : candidate;
}

function normalizeOutcome(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "unknown";
  if (["shown", "dismissed", "continued", "not_shown", "unknown"].includes(raw)) {
    return raw;
  }
  return "unknown";
}

function deriveInterventionType(decision) {
  return String(decision || "").trim().toLowerCase() === "show_intercept"
    ? "checkout_exit_intercept"
    : "none";
}

export async function createDecisionLog(input) {
  return prisma.decisionLog.create({
    data: {
      shopDomain: input.shopDomain,
      cartToken: input.cartToken ?? null,
      trigger: normalizeDecisionTrigger(input.trigger),
      decision: input.decision,
      decisionReason: input.decisionReason,
      interventionType: input.interventionType || deriveInterventionType(input.decision),
      outcome: normalizeOutcome(input.outcome),
      decisionTimestamp: toDateOrNow(input.decisionTimestamp),
      outcomeTimestamp: input.outcomeTimestamp ? toDateOrNow(input.outcomeTimestamp) : null,
      cartValueCents: Number.isFinite(Number(input.cartValueCents)) ? Number(input.cartValueCents) : null,
      sessionMarker: input.sessionMarker ? String(input.sessionMarker) : null,
      validationMode: Boolean(input.validationMode),
      relatedEventId: input.relatedEventId ? String(input.relatedEventId) : null,
    },
  });
}

export async function updateDecisionOutcome(input) {
  return prisma.decisionLog.update({
    where: { id: String(input.decisionId) },
    data: {
      outcome: normalizeOutcome(input.outcome),
      outcomeTimestamp: input.outcomeTimestamp ? toDateOrNow(input.outcomeTimestamp) : new Date(),
      sessionMarker: input.sessionMarker ? String(input.sessionMarker) : undefined,
    },
  });
}

export { normalizeDecisionTrigger, deriveInterventionType };
