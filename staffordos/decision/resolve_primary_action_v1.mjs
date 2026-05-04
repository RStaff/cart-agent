import { existsSync, readFileSync, writeFileSync } from "node:fs";

const now = new Date().toISOString();

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function money(value) {
  return Number(value || 0);
}

const unitSnapshot = readJson("staffordos/snapshots/unit_work_snapshot_v1.json", { open_work: [], summary: {} });
const dashboardSnapshot = readJson("staffordos/clients/operator_dashboard_snapshot_v1.json", {});
const clientRegistry = readJson("staffordos/clients/client_registry_v1.json", { clients: [] });
const confidenceGate = readJson("staffordos/gates/confidence_gate_v1.json", {});
const uxReport = readJson("staffordos/ux_audit/output/operator_command_center_ux_integrity_v1.json", { score: {} });

const clients = Array.isArray(clientRegistry.clients) ? clientRegistry.clients : [];
const openUnits = Array.isArray(unitSnapshot.open_work) ? unitSnapshot.open_work : [];
const primaryFocus = dashboardSnapshot.primary_focus || null;

function classifyAction(unit) {
  if (unit.type === "opportunity" && String(unit.stage || "").includes("proposal")) {
    return "revenue_close";
  }

  if (unit.type === "action" && String(unit.next_action || "").toLowerCase().includes("follow up")) {
    return "revenue_followup";
  }

  if (unit.type === "delivery" && unit.status === "waiting_for_payment") {
    return "payment_waiting";
  }

  if (unit.domain_id === "internal_dev") {
    return "internal_dev";
  }

  return unit.type || "unknown";
}

function scoreUnit(unit) {
  const actionType = classifyAction(unit);
  let score = 0;
  const reasons = [];

  if (actionType === "revenue_close") {
    score += 45;
    reasons.push("Active proposal has direct revenue capture potential.");
  }

  if (actionType === "revenue_followup") {
    score += 35;
    reasons.push("Follow-up action can move an active opportunity toward payment.");
  }

  if (actionType === "payment_waiting") {
    score += 25;
    reasons.push("Delivery is blocked until payment is captured.");
  }

  if (unit.domain_id === "shopifixer") {
    score += 18;
    reasons.push("ShopiFixer is the current immediate one-time revenue path.");
  }

  if (unit.domain_id === "abando") {
    score += 14;
    reasons.push("Abando supports recurring revenue.");
  }

  if (unit.domain_id === "internal_dev") {
    score += 6;
    reasons.push("Internal dev improves system capability but is not immediate cash capture.");
  }

  if (unit.owner === "ross") {
    score += 10;
    reasons.push("Ross-owned action can be advanced immediately.");
  }

  if (String(unit.next_action || "").toLowerCase().includes("close payment")) {
    score += 20;
    reasons.push("Next action explicitly targets payment close.");
  }

  if (String(unit.next_action || "").toLowerCase().includes("follow up")) {
    score += 12;
    reasons.push("Follow-up is the active bottleneck after offer send.");
  }

  if (unit.status === "open") score += 5;
  if (unit.status === "waiting_for_payment") score += 8;

  return {
    unit,
    action_type: actionType,
    priority_score: Math.min(score, 100),
    reasons
  };
}

const scored = openUnits
  .map(scoreUnit)
  .sort((a, b) => b.priority_score - a.priority_score);

const winner = scored[0] || null;
const alternatives = scored.slice(1, 5).map((item) => ({
  unit_id: item.unit.unit_id,
  action_type: item.action_type,
  domain_id: item.unit.domain_id,
  priority_score: item.priority_score,
  next_action: item.unit.next_action,
  why_not_primary: item.priority_score < (winner?.priority_score || 0)
    ? "Lower combined revenue/urgency score than primary action."
    : "Comparable priority but not selected."
}));

const matchingClient =
  clients.find((client) =>
    winner?.unit?.unit_id?.includes(client.client_id) ||
    winner?.unit?.next_action === client.next_action?.instructions
  ) || null;

const merchantRevenue = money(matchingClient?.abando?.merchant_revenue_recovered);
const staffordRevenue = money(matchingClient?.revenue?.total_lifetime_value);
const revenueGap = Math.max(merchantRevenue - staffordRevenue, 0);

const confidence =
  winner?.action_type === "revenue_close" ? 0.82 :
  winner?.action_type === "revenue_followup" ? 0.76 :
  winner?.action_type === "payment_waiting" ? 0.72 :
  0.62;

const urgency =
  winner?.action_type === "revenue_close" ? "high" :
  winner?.action_type === "revenue_followup" ? "high" :
  winner?.action_type === "payment_waiting" ? "medium" :
  "medium";

const primaryAction = winner ? {
  action_id: `primary_${Date.now()}`,
  action_label: winner.unit.next_action || primaryFocus?.action || "Review active work.",
  action_type: winner.action_type,
  domain_id: winner.unit.domain_id,
  product_id: winner.unit.domain_id === "shopifixer" ? "shopifixer" : winner.unit.domain_id,
  linked_units: [winner.unit.unit_id],
  owner: winner.unit.owner || "ross",
  priority_score: winner.priority_score,
  urgency,
  confidence,
  confidence_band:
    confidence >= 0.9 ? "high_auto_allowed" :
    confidence >= 0.75 ? "medium_high_human_validated" :
    confidence >= 0.55 ? "medium_requires_review" :
    "low_blocked",
  evidence: [
    ...winner.reasons,
    revenueGap > 0 ? `Merchant value proven: $${revenueGap} gap between recovered value and Stafford revenue captured.` : null,
    uxReport?.score?.ux ? `Current UX integrity score is ${uxReport.score.ux}; decision layer needed before further UI polish.` : null
  ].filter(Boolean),
  risk: [
    "Do not start delivery work before payment is captured.",
    "Do not treat merchant recovered value as Stafford revenue.",
    confidence < (confidenceGate?.thresholds?.auto_fix_allowed_min_confidence || 0.9)
      ? "Human judgment required before executing irreversible actions."
      : null
  ].filter(Boolean),
  next_step: winner.unit.next_action,
  expected_outcome:
    winner.action_type === "revenue_close" || winner.action_type === "revenue_followup"
      ? "Move active ShopiFixer proposal toward paid client status."
      : "Advance highest-priority unit of work.",
  source_snapshots: [
    "staffordos/snapshots/unit_work_snapshot_v1.json",
    "staffordos/clients/operator_dashboard_snapshot_v1.json",
    "staffordos/clients/client_registry_v1.json",
    "staffordos/gates/confidence_gate_v1.json",
    "staffordos/ux_audit/output/operator_command_center_ux_integrity_v1.json"
  ],
  generated_at: now
} : {
  action_id: `primary_${Date.now()}`,
  action_label: "No active unit of work found.",
  action_type: "none",
  domain_id: "system",
  product_id: null,
  linked_units: [],
  owner: "system",
  priority_score: 0,
  urgency: "low",
  confidence: 0,
  confidence_band: "none",
  evidence: [],
  risk: ["No open work was found in unit_work_snapshot_v1."],
  next_step: "Create or sync work units.",
  expected_outcome: "Restore actionable operating state.",
  source_snapshots: ["staffordos/snapshots/unit_work_snapshot_v1.json"],
  generated_at: now
};

const snapshot = {
  schema: "staffordos.primary_action_snapshot.v1",
  generated_at: now,
  purpose: "Single canonical answer to: What should Ross do next?",
  decision_model: {
    engine: "resolve_primary_action_v1",
    scoring_inputs: [
      "revenue_capture_potential",
      "domain_priority",
      "owner_executability",
      "payment_closure_language",
      "followup_bottleneck",
      "system_risk"
    ],
    rule: "UI must consume this snapshot for the top primary action. React components must not invent primary priority locally."
  },
  primary_action: primaryAction,
  alternatives_considered: alternatives,
  context: {
    revenue_gap: revenueGap,
    merchant_revenue_recovered: merchantRevenue,
    stafford_revenue_captured: staffordRevenue,
    ux_integrity_score: uxReport?.score?.ux ?? null,
    architecture_score: uxReport?.score?.architecture ?? null
  }
};

writeFileSync("staffordos/snapshots/primary_action_snapshot_v1.json", JSON.stringify(snapshot, null, 2) + "\n");

console.log(JSON.stringify({
  ok: true,
  engine: "resolve_primary_action_v1",
  primary_action: snapshot.primary_action,
  alternatives_considered: snapshot.alternatives_considered.length
}, null, 2));
