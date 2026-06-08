import { existsSync, readFileSync, writeFileSync } from "node:fs";

const now = new Date().toISOString();
const PRIMARY_ACTION_SNAPSHOT_PATH = "staffordos/snapshots/primary_action_snapshot_v1.json";
const EXECUTION_STATE_FIELDS = [
  "execution_status",
  "last_execution_result",
  "last_execution_reason",
  "last_execution_recommendation",
  "last_launched_at",
  "last_completed_at",
  "last_failed_at",
  "last_execution_event_id",
  "last_execution_artifacts",
];

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
const existingSnapshot = readJson(PRIMARY_ACTION_SNAPSHOT_PATH, {});

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
  const score_components = [];

  function add(points, component, reason, source_field) {
    score += points;
    reasons.push(reason);
    score_components.push({
      component,
      points,
      reason,
      source_file: "staffordos/snapshots/unit_work_snapshot_v1.json",
      source_field,
    });
  }

  if (actionType === "revenue_close") {
    add(45, "revenue_capture_potential", "Active proposal has direct revenue capture potential.", "open_work[].type + open_work[].stage");
  }

  if (actionType === "revenue_followup") {
    add(35, "revenue_followup", "Follow-up action can move an active opportunity toward payment.", "open_work[].type + open_work[].next_action");
  }

  if (actionType === "payment_waiting") {
    add(25, "payment_waiting", "Delivery is blocked until payment is captured.", "open_work[].type + open_work[].status");
  }

  if (unit.domain_id === "shopifixer") {
    add(18, "domain_priority", "ShopiFixer is the current immediate one-time revenue path.", "open_work[].domain_id");
  }

  if (unit.domain_id === "abando") {
    add(14, "domain_priority", "Abando supports recurring revenue.", "open_work[].domain_id");
  }

  if (unit.domain_id === "internal_dev") {
    add(6, "domain_priority", "Internal dev improves system capability but is not immediate cash capture.", "open_work[].domain_id");
  }

  if (unit.owner === "ross") {
    add(10, "owner_executability", "Ross-owned action can be advanced immediately.", "open_work[].owner");
  }

  if (String(unit.next_action || "").toLowerCase().includes("close payment")) {
    add(20, "payment_closure_language", "Next action explicitly targets payment close.", "open_work[].next_action");
  }

  if (String(unit.next_action || "").toLowerCase().includes("follow up")) {
    add(12, "followup_bottleneck", "Follow-up is the active bottleneck after offer send.", "open_work[].next_action");
  }

  if (unit.status === "open") {
    add(5, "open_work_status", "Open work is actionable.", "open_work[].status");
  }
  if (unit.status === "waiting_for_payment") {
    add(8, "payment_waiting_status", "Work is waiting for payment.", "open_work[].status");
  }

  return {
    unit,
    action_type: actionType,
    raw_score: score,
    priority_score: Math.min(score, 100),
    score_components,
    reasons,
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
  raw_score: item.raw_score,
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

function actionIdentity(action) {
  return [
    action?.action_label,
    action?.action_type,
    action?.domain_id,
    action?.next_step,
  ].map((value) => String(value || "")).join("::");
}

function preservedExecutionState(nextAction) {
  const previous = existingSnapshot?.primary_action || {};
  if (actionIdentity(previous) !== actionIdentity(nextAction)) {
    return {};
  }

  const preserved = {};
  if (previous.action_id) {
    preserved.action_id = previous.action_id;
  }

  for (const field of EXECUTION_STATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(previous, field)) {
      preserved[field] = previous[field];
    }
  }

  return preserved;
}

function decisionCandidate(item, rank) {
  return {
    rank,
    selected: item === winner,
    unit_id: item.unit.unit_id || null,
    action_type: item.action_type,
    domain_id: item.unit.domain_id || null,
    owner: item.unit.owner || null,
    status: item.unit.status || null,
    stage: item.unit.stage || null,
    next_action: item.unit.next_action || null,
    raw_score: item.raw_score,
    priority_score: item.priority_score,
    score_components: item.score_components,
  };
}

const decisionTrace = {
  engine: "resolve_primary_action_v1",
  generated_at: now,
  candidate_source: "staffordos/snapshots/unit_work_snapshot_v1.json: open_work[]",
  source_fields_read: [
    "staffordos/snapshots/unit_work_snapshot_v1.json: open_work[].unit_id",
    "staffordos/snapshots/unit_work_snapshot_v1.json: open_work[].type",
    "staffordos/snapshots/unit_work_snapshot_v1.json: open_work[].stage",
    "staffordos/snapshots/unit_work_snapshot_v1.json: open_work[].status",
    "staffordos/snapshots/unit_work_snapshot_v1.json: open_work[].domain_id",
    "staffordos/snapshots/unit_work_snapshot_v1.json: open_work[].owner",
    "staffordos/snapshots/unit_work_snapshot_v1.json: open_work[].next_action",
    "staffordos/clients/client_registry_v1.json: clients[] for matching client context",
    "staffordos/clients/operator_dashboard_snapshot_v1.json: primary_focus and revenue_gaps[] for context",
    "staffordos/gates/confidence_gate_v1.json: thresholds.auto_fix_allowed_min_confidence for risk wording",
    "staffordos/ux_audit/output/operator_command_center_ux_integrity_v1.json: score.ux for evidence",
  ],
  score_cap: 100,
  sort_order: "descending priority_score; first candidate wins",
  tie_behavior: "Equal capped scores keep the earlier candidate order produced by Array.sort in this runtime.",
  candidates: scored.map((item, index) => decisionCandidate(item, index + 1)),
  selected_unit_id: winner?.unit?.unit_id || null,
  selected_reason: winner
    ? "Highest scored open work candidate after resolver scoring."
    : "No open work candidates were available.",
  alternatives_considered: alternatives,
};

const basePrimaryAction = winner ? {
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
  decision_trace: decisionTrace,
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
  decision_trace: decisionTrace,
  generated_at: now
};

const primaryAction = {
  ...basePrimaryAction,
  ...preservedExecutionState(basePrimaryAction),
};

const rootExecutionState = {};
for (const field of EXECUTION_STATE_FIELDS) {
  if (Object.prototype.hasOwnProperty.call(primaryAction, field)) {
    rootExecutionState[field] = primaryAction[field];
  }
}

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
  decision_trace: decisionTrace,
  context: {
    revenue_gap: revenueGap,
    merchant_revenue_recovered: merchantRevenue,
    stafford_revenue_captured: staffordRevenue,
    ux_integrity_score: uxReport?.score?.ux ?? null,
    architecture_score: uxReport?.score?.architecture ?? null
  },
  ...rootExecutionState
};

writeFileSync(PRIMARY_ACTION_SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + "\n");

console.log(JSON.stringify({
  ok: true,
  engine: "resolve_primary_action_v1",
  primary_action: snapshot.primary_action,
  alternatives_considered: snapshot.alternatives_considered.length
}, null, 2));
