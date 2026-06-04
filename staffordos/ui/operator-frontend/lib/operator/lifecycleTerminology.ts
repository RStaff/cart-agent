type AnyRecord = Record<string, any>;

function text(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || "";
}

function phaseForCanonicalStage(stage: string) {
  const normalized = stage.toLowerCase();

  if (
    [
      "real store",
      "qualified target",
      "contact discovery",
      "contact research",
      "outreach draft",
      "approved outreach",
      "conversation",
    ].includes(normalized)
  ) {
    return "Acquisition";
  }

  if (["audit", "issue evidence", "proposed fix", "checkout link", "payment", "packet created"].includes(normalized)) {
    return "Conversion";
  }

  if (
    [
      "packet",
      "scope",
      "merchant approval",
      "implementation",
      "qa",
      "after-state evidence",
      "proof package",
    ].includes(normalized)
  ) {
    return "Fulfillment";
  }

  if (["merchant review", "testimonial", "referral", "next sprint"].includes(normalized)) {
    return "Merchant Success";
  }

  if (["paused", "lost", "stopped"].includes(normalized)) {
    return "Operator Control";
  }

  return "Operator Control";
}

const LEAD_STAGE_MAP: Record<string, string> = {
  cold: "Real Store",
  contact_needed: "Contact Discovery",
  message_ready: "Outreach Draft",
  pending_approval: "Approved Outreach",
  approved: "Approved Outreach",
  ledgered: "Conversation",
  dry_run_ready: "Conversation",
  sent: "Conversation",
  followup_sent: "Conversation",
  engaged: "Conversation",
  qualified: "Qualified Target",
  customer: "Merchant Success",
  stopped: "Stopped",
};

const CLIENT_STAGE_MAP: Record<string, string> = {
  lead: "Qualified Target",
  qualified: "Qualified Target",
  product_routed: "Qualified Target",
  audit_requested: "Audit",
  audit_completed: "Audit",
  proposal_sent: "Proposed Fix",
  deal_won: "Payment",
  payment_pending: "Payment",
  payment_received: "Payment",
  fix_in_progress: "Implementation",
  fix_completed: "After-State Evidence",
  abando_installed: "Proof Package",
  revenue_active: "Merchant Success",
  paused: "Paused",
  lost: "Lost",
};

function canonicalStageFromMap(stage: unknown, map: Record<string, string>, fallback: string) {
  const normalized = text(stage).toLowerCase();
  return map[normalized] || fallback || text(stage) || "Unknown";
}

export function canonicalLeadLifecycleStage(record: AnyRecord) {
  return canonicalStageFromMap(
    record.lifecycle_stage || record.lifecycle?.stage || record.status?.current_stage,
    LEAD_STAGE_MAP,
    "Contact Discovery"
  );
}

export function canonicalClientLifecycleStage(record: AnyRecord) {
  return canonicalStageFromMap(
    record.lifecycle_stage || record.lifecycle?.stage || record.status?.current_stage,
    CLIENT_STAGE_MAP,
    text(record.lifecycle_stage || record.lifecycle?.stage || record.status?.current_stage) || "Qualified Target"
  );
}

export function canonicalLifecyclePhase(record: AnyRecord, surface: "lead" | "client") {
  const stage = surface === "lead" ? canonicalLeadLifecycleStage(record) : canonicalClientLifecycleStage(record);
  return phaseForCanonicalStage(stage);
}

export function canonicalLifecycleRecord(record: AnyRecord, surface: "lead" | "client") {
  const canonical_lifecycle_stage =
    surface === "lead"
      ? canonicalLeadLifecycleStage(record)
      : canonicalClientLifecycleStage(record);

  return {
    canonical_lifecycle_stage,
    canonical_phase: canonicalLifecyclePhase(record, surface),
  };
}

export function canonicalNextActionLabel(action: unknown) {
  return text(action) || "Review merchant";
}

export function canonicalActionContext(context: Array<string | null | undefined>) {
  return context.map(text).filter(Boolean);
}

export function humanizeOperatorReason(reason: unknown) {
  const normalized = text(reason).toLowerCase();

  switch (normalized) {
    case "proof_or_revenue_gap":
    case "proof_or_revenue_gaps":
      return "Proof or revenue work remains before this merchant can move forward.";
    case "audits_needed":
      return "One or more client audits still need to be completed.";
    case "contact_blocked_leads":
      return "Some leads still need contact details before outreach can continue.";
    case "highest_priority_client_next_action":
      return "This is the highest-priority client next step.";
    case "blocked_high_priority_client":
      return "This client has a blocker that should be cleared first.";
    case "client_registry_unavailable":
      return "Client registry data is not available.";
    case "empty_sources":
      return "No business-core next action is available yet.";
    default:
      return text(reason) || "Review merchant";
  }
}
