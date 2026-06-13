import fs from "node:fs";
import path from "node:path";
import { resolveRelationshipById, resolveRelationships } from "./relationshipResolver";

type ActionStatus = "ready" | "blocked" | "done" | "stale";
type ActionCategory = "revenue" | "fulfillment" | "trust" | "outcome";

export type ActionCandidate = {
  action_id: string;
  relationship_id: string;
  action_type: string;
  title: string;
  why_it_matters: string;
  expected_revenue_impact: number;
  trust_impact: number;
  delivery_impact: number;
  urgency: number;
  confidence: number;
  status: ActionStatus;
  blocker: string | null;
};

type ActionCandidateWithMeta = ActionCandidate & {
  category: ActionCategory;
  rank_score: number;
  rank_reason: string;
  resolver_state: string;
  conflict_types: string[];
  unresolved_relationship: boolean;
  stage_conflict: boolean;
  origin: string;
};

type DashboardSnapshot = {
  generated_at?: string;
  primary_focus?: {
    client_id?: string;
    merchant_shop?: string;
    reason?: string;
    action?: string;
    priority_total?: number;
    blocked?: boolean;
    next_action?: {
      type?: string;
      owner?: string;
      due_at?: string | null;
      instructions?: string;
      auto_executable?: boolean;
      updated_at?: string;
    };
  };
  revenue_gaps?: Array<{
    client_id?: string;
    merchant_shop?: string;
    merchant_revenue?: number;
    stafford_revenue?: number;
    gap?: number;
    action?: string;
  }>;
  next_actions?: Array<{
    client_id?: string;
    owner?: string;
    type?: string;
    instructions?: string;
    auto_executable?: boolean;
    priority_total?: number;
    close_engine?: {
      followup_ready?: boolean;
      suggested_message?: string;
      urgency?: string;
    } | null;
  }>;
};

type RevenueTruth = {
  current_bottleneck?: string;
  next_actions?: Array<{
    priority?: number;
    action?: string;
    expected_outcome?: string;
  }>;
};

type MerchantLifecycleRegistry = {
  records?: Array<Record<string, any>>;
};

type FulfillmentTruth = {
  items?: Array<Record<string, any>>;
};

type ExecutionLog = {
  events?: Array<Record<string, any>>;
};

type OutcomeTruth = {
  events?: Array<Record<string, any>>;
};

type ActionResolverReport = {
  total_actions: number;
  unresolved_action_count: number;
  conflict_action_count: number;
  by_category: Record<ActionCategory, number>;
  top_10: ActionCandidate[];
  ranking_rationale: Array<{ action_id: string; rank_score: number; reason: string }>;
  validation: {
    ok: boolean;
    errors: string[];
  };
};

function resolveRepoRoot() {
  const cwd = process.cwd();
  const candidates = [cwd, path.resolve(cwd, "../../.."), path.resolve(cwd, "../..")];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "staffordos/revenue/revenue_truth_v1.json"))) return candidate;
  }
  return path.resolve(cwd, "../../..");
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function text(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function lower(value: unknown) {
  return text(value).toLowerCase();
}

function normalizeActionKey(value?: string | null) {
  return text(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .replace(/[^a-z0-9.@_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeId(value?: string | null, prefix = "act") {
  const normalized = normalizeActionKey(value);
  return normalized ? `${prefix}_${normalized}` : `${prefix}_unknown`;
}

function readInputs() {
  const repoRoot = resolveRepoRoot();
  const dashboard = readJson<DashboardSnapshot>(
    path.join(repoRoot, "staffordos/clients/operator_dashboard_snapshot_v1.json"),
    {}
  );
  const revenueTruth = readJson<RevenueTruth>(
    path.join(repoRoot, "staffordos/revenue/revenue_truth_v1.json"),
    {}
  );
  const fulfillmentTruth = readJson<FulfillmentTruth>(
    path.join(repoRoot, "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json"),
    { items: [] }
  );
  const executionLog = readJson<ExecutionLog>(
    path.join(repoRoot, "staffordos/execution/execution_log_v1.json"),
    { events: [] }
  );
  const outcomeTruth = readJson<OutcomeTruth>(
    path.join(repoRoot, "staffordos/execution/outcome_events_v1.json"),
    { events: [] }
  );
  return {
    repoRoot,
    dashboard,
    revenueTruth,
    fulfillmentTruth,
    executionLog,
    outcomeTruth,
    relationships: resolveRelationships(),
  };
}

function byRelationshipId(relationshipId: string) {
  return resolveRelationshipById(relationshipId);
}

function relationshipForKey(value?: string | null) {
  if (!text(value)) return null;
  const normalized = normalizeActionKey(value);
  const candidates = [
    value,
    normalized,
    normalized ? normalized.replace(/^lead_/, "") : null,
    normalized ? `lead_${normalized}` : null,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const resolved = byRelationshipId(candidate);
    if (resolved) return resolved;
  }
  return null;
}

function relationshipConfidencePenalty(relationship: ReturnType<typeof byRelationshipId> | null) {
  if (!relationship) return 0.45;
  if (relationship.resolver_state === "lead_only") return 0.35;
  if (relationship.resolver_state === "contact_unknown") return 0.25;
  if (relationship.resolver_state === "unresolved_identity") return 0.5;
  if (relationship.resolver_state === "operational_conflict") return 0.15;
  return 0;
}

function hasStageConflict(relationship: ReturnType<typeof byRelationshipId> | null) {
  return Boolean(relationship?.relationship_core.conflict_types?.includes("stage_conflict"));
}

function blockedForRelationship(relationship: ReturnType<typeof byRelationshipId> | null) {
  if (!relationship) return "Unresolved relationship identity.";
  if (relationship.resolver_state === "unresolved_identity") return "Relationship identity cannot be resolved yet.";
  if (relationship.resolver_state === "lead_only") return "Relationship exists only as lead truth.";
  if (relationship.resolver_state === "contact_unknown") return "No reachable contact email exists in source truth.";
  return null;
}

function scoreCandidate(input: {
  category: ActionCategory;
  status: ActionStatus;
  expected_revenue_impact: number;
  trust_impact: number;
  delivery_impact: number;
  urgency: number;
  confidence: number;
  relationship: ReturnType<typeof byRelationshipId> | null;
}) {
  const categoryWeight: Record<ActionCategory, number> = {
    revenue: 1,
    trust: 0.9,
    fulfillment: 0.85,
    outcome: 0.45,
  };

  const relationship = input.relationship;
  const relationshipBoost = relationship
    ? relationship.resolver_state === "resolved"
      ? 15
      : relationship.resolver_state === "contact_unknown"
        ? -10
        : relationship.resolver_state === "lead_only"
          ? -12
          : relationship.resolver_state === "operational_conflict"
            ? -8
            : -15
    : -20;

  const statusBoost: Record<ActionStatus, number> = {
    ready: 20,
    blocked: -10,
    done: -35,
    stale: -20,
  };

  const conflictPenalty = hasStageConflict(relationship) ? 8 : 0;
  const unresolvedPenalty = blockedForRelationship(relationship) ? 10 : 0;

  const raw =
    input.expected_revenue_impact * 0.5 * categoryWeight[input.category] +
    input.trust_impact * 0.2 +
    input.delivery_impact * 0.18 +
    input.urgency * 0.12 +
    input.confidence * 100 * 0.1 +
    relationshipBoost +
    statusBoost[input.status] -
    conflictPenalty -
    unresolvedPenalty;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

function baseConfidence(relationship: ReturnType<typeof byRelationshipId> | null) {
  if (!relationship) return 0.25;
  return Math.max(0.1, Math.min(0.98, relationship.provenance.confidence - relationshipConfidencePenalty(relationship)));
}

function addCandidate(
  map: Map<string, ActionCandidateWithMeta>,
  candidate: ActionCandidateWithMeta
) {
  const existing = map.get(candidate.action_id);
  if (!existing || candidate.rank_score > existing.rank_score) {
    map.set(candidate.action_id, candidate);
  }
}

function makeActionCandidate(params: {
  category: ActionCategory;
  action_type: string;
  relationship: ReturnType<typeof byRelationshipId> | null;
  title: string;
  why_it_matters: string;
  expected_revenue_impact: number;
  trust_impact: number;
  delivery_impact: number;
  urgency: number;
  confidence: number;
  status: ActionStatus;
  blocker: string | null;
  origin: string;
}) {
  const relationshipId = params.relationship?.relationship_id || normalizeId(params.origin || params.title);
  const actionId = normalizeId(`${relationshipId}_${params.action_type}_${params.origin}`);
  const rank_score = scoreCandidate({
    category: params.category,
    status: params.status,
    expected_revenue_impact: params.expected_revenue_impact,
    trust_impact: params.trust_impact,
    delivery_impact: params.delivery_impact,
    urgency: params.urgency,
    confidence: params.confidence,
    relationship: params.relationship,
  });

  const conflictTypes = params.relationship?.relationship_core.conflict_types || [];
  const unresolvedRelationship = Boolean(
    !params.relationship ||
    params.relationship.resolver_state === "lead_only" ||
    params.relationship.resolver_state === "contact_unknown" ||
    params.relationship.resolver_state === "unresolved_identity"
  );

  const rank_reason_parts = [
    `${params.category} action`,
    `status=${params.status}`,
    `urgency=${params.urgency}`,
    `confidence=${params.confidence.toFixed(2)}`,
  ];
  if (params.expected_revenue_impact) rank_reason_parts.push(`revenue=${params.expected_revenue_impact}`);
  if (params.delivery_impact) rank_reason_parts.push(`delivery=${params.delivery_impact}`);
  if (params.trust_impact) rank_reason_parts.push(`trust=${params.trust_impact}`);
  if (params.blocker) rank_reason_parts.push(`blocker=${params.blocker}`);
  if (unresolvedRelationship) rank_reason_parts.push(`relationship=${params.relationship?.resolver_state || "unresolved"}`);
  if (conflictTypes.length) rank_reason_parts.push(`conflicts=${conflictTypes.join(",")}`);

  return {
    action_id: actionId,
    relationship_id: relationshipId,
    action_type: params.action_type,
    title: params.title,
    why_it_matters: params.why_it_matters,
    expected_revenue_impact: params.expected_revenue_impact,
    trust_impact: params.trust_impact,
    delivery_impact: params.delivery_impact,
    urgency: params.urgency,
    confidence: Number(params.confidence.toFixed(2)),
    status: params.status,
    blocker: params.blocker,
    category: params.category,
    rank_score,
    rank_reason: rank_reason_parts.join("; "),
    resolver_state: params.relationship?.resolver_state || "unresolved_identity",
    conflict_types: conflictTypes,
    unresolved_relationship: unresolvedRelationship,
    stage_conflict: conflictTypes.includes("stage_conflict"),
    origin: params.origin,
  } satisfies ActionCandidateWithMeta;
}

function revenueImpactFromMerchantLifecycle(relationshipId: string, repoRoot: string) {
  const merchantLifecycle = readJson<{ records?: Array<Record<string, any>> }>(
    path.join(repoRoot, "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json"),
    { records: [] }
  );
  const record = Array.isArray(merchantLifecycle.records)
    ? merchantLifecycle.records.find((item) =>
        [item.client_id, item.merchant_id, item.merchant_shop, item.store_domain]
          .map((value) => normalizeActionKey(value))
          .includes(normalizeActionKey(relationshipId))
      ) || null
    : null;

  return {
    offer_price: Number(record?.offer_price) || 0,
    payment_status: text(record?.payment_status) || null,
    next_required_action: text(record?.next_required_action) || null,
  };
}

function deriveCandidates() {
  const { repoRoot, dashboard, revenueTruth, fulfillmentTruth, executionLog, outcomeTruth, relationships } = readInputs();
  const candidates = new Map<string, ActionCandidateWithMeta>();

  const relationshipById = new Map(relationships.map((relationship) => [relationship.relationship_id, relationship]));

  const revenueGap = Array.isArray(dashboard.revenue_gaps) ? dashboard.revenue_gaps[0] : null;
  const primaryFocus = dashboard.primary_focus || {};
  const cartAgent = relationshipForKey(primaryFocus.client_id || primaryFocus.merchant_shop || revenueGap?.merchant_shop);

  if (cartAgent) {
    const lifecycleInfo = revenueImpactFromMerchantLifecycle(cartAgent.relationship_id, repoRoot);
    addCandidate(
      candidates,
      makeActionCandidate({
        category: "revenue",
        action_type: "revenue_close",
        relationship: cartAgent,
        title: text(primaryFocus.next_action?.instructions || primaryFocus.action || "Follow up on real ShopiFixer offer and close payment."),
        why_it_matters: text(primaryFocus.reason || "Merchant value has been proven and Stafford revenue is still uncaptured."),
        expected_revenue_impact: lifecycleInfo.offer_price || Number(revenueGap?.gap) || 0,
        trust_impact: 50,
        delivery_impact: 0,
        urgency: Number(primaryFocus.priority_total) || 95,
        confidence: Math.max(0.1, cartAgent.provenance.confidence),
        status: "ready",
        blocker: blockedForRelationship(cartAgent),
        origin: "dashboard.primary_focus",
      })
    );

    addCandidate(
      candidates,
      makeActionCandidate({
        category: "trust",
        action_type: "payment_followup_pending",
        relationship: cartAgent,
        title: "Follow up on payment to keep the offer warm.",
        why_it_matters: "The latest outcome says payment follow-up is pending, which preserves trust and keeps the offer moving.",
        expected_revenue_impact: lifecycleInfo.offer_price || Number(revenueGap?.gap) || 0,
        trust_impact: 90,
        delivery_impact: 0,
        urgency: 90,
        confidence: Math.max(0.1, cartAgent.provenance.confidence - 0.05),
        status: "ready",
        blocker: blockedForRelationship(cartAgent),
        origin: "execution.outcome_followup_pending",
      })
    );

    const fulfillmentItem = Array.isArray(fulfillmentTruth.items)
      ? fulfillmentTruth.items.find((item) =>
          [item.client_id, item.store_domain, item.fulfillment_id, item.delivery_unit_ref]
            .map((value) => normalizeActionKey(value))
            .includes(normalizeActionKey(cartAgent.identity.client_id || cartAgent.identity.merchant_shop))
        ) || fulfillmentTruth.items[0]
      : null;

    if (fulfillmentItem) {
      addCandidate(
        candidates,
        makeActionCandidate({
          category: "fulfillment",
          action_type: "fulfillment_waiting_payment",
          relationship: cartAgent,
          title: text(fulfillmentItem.recommended_next_watch_item || fulfillmentItem.risk_or_limitation || "Wait for payment or follow up before starting fix delivery."),
          why_it_matters: "Delivery cannot begin until payment is captured and verified.",
          expected_revenue_impact: lifecycleInfo.offer_price || Number(revenueGap?.gap) || 0,
          trust_impact: 80,
          delivery_impact: 95,
          urgency: 95,
          confidence: Math.max(0.1, cartAgent.provenance.confidence - 0.02),
          status: "blocked",
          blocker: "Payment is still waiting_for_payment.",
          origin: "fulfillment.waiting_for_payment",
        })
      );
    }

    const offerSentEvent = Array.isArray(executionLog.events)
      ? executionLog.events.find((event) => lower(event.action_type) === "offer_sent" && normalizeActionKey(event.customer) === normalizeActionKey(cartAgent.identity.client_id))
      : null;
    const offerOutcome = Array.isArray(outcomeTruth.events)
      ? outcomeTruth.events.find((event) => lower(event.new_state) === "offer_sent" && normalizeActionKey(event.customer) === normalizeActionKey(cartAgent.identity.client_id))
      : null;

    if (offerSentEvent || offerOutcome) {
      addCandidate(
        candidates,
        makeActionCandidate({
          category: "outcome",
          action_type: "offer_sent",
          relationship: cartAgent,
          title: "Offer sent successfully.",
          why_it_matters: "This is the audit trail for the original offer action and anchors the follow-up sequence.",
          expected_revenue_impact: 0,
          trust_impact: 25,
          delivery_impact: 0,
          urgency: 10,
          confidence: 0.98,
          status: "done",
          blocker: null,
          origin: "execution.offer_sent",
        })
      );
    }
  }

  const leadActions = Array.isArray(dashboard.next_actions) ? dashboard.next_actions : [];
  for (const nextAction of leadActions) {
    const relationship = relationshipForKey(nextAction.client_id);
    if (!relationship || relationship.relationship_id === cartAgent?.relationship_id) continue;

    const stageConflict = relationship.relationship_core.conflict_types.includes("stage_conflict");
    const blocker = blockedForRelationship(relationship);
    const status: ActionStatus = blocker ? "blocked" : "ready";
    const confidence = baseConfidence(relationship);
    const actionType = relationship.relationship_type === "lead" ? "revenue_outreach" : "revenue_followup";

    addCandidate(
      candidates,
      makeActionCandidate({
        category: "revenue",
        action_type: actionType,
        relationship,
        title: text(nextAction.instructions || nextAction.type || relationship.facets.client.next_action || relationship.facets.lead.next_action || "Review lead"),
        why_it_matters: text(
          relationship.relationship_type === "lead"
            ? "This lead already has an existing outreach path in the current truth."
            : "This client is already promoted and still needs a next business action."
        ),
        expected_revenue_impact: 0,
        trust_impact: stageConflict ? 30 : 10,
        delivery_impact: 0,
        urgency: Number(nextAction.priority_total) || (nextAction.owner === "ross" ? 70 : 45),
        confidence,
        status,
        blocker,
        origin: `dashboard.next_actions.${text(nextAction.client_id)}`,
      })
    );
  }

  const leadOnlyCandidates = relationships.filter(
    (relationship) =>
      relationship.relationship_type === "lead" ||
      relationship.resolver_state === "lead_only" ||
      relationship.resolver_state === "contact_unknown"
  );

  for (const relationship of leadOnlyCandidates) {
    const leadNextAction = relationship.facets.lead.next_action || "Review lead";
    const blocker = blockedForRelationship(relationship);
    const status: ActionStatus = blocker ? "blocked" : "ready";
    if (relationship.relationship_id === cartAgent?.relationship_id) continue;
    const hasExistingCandidate = Array.from(candidates.values()).some((candidate) => candidate.relationship_id === relationship.relationship_id);
    if (hasExistingCandidate) continue;

    addCandidate(
      candidates,
      makeActionCandidate({
        category: "revenue",
        action_type: "revenue_outreach",
        relationship,
        title: leadNextAction,
        why_it_matters: relationship.resolver_state === "contact_unknown"
          ? "No reachable contact exists yet, so outreach cannot become a live revenue motion."
          : "This lead already exists in source truth and can move only if the lead path is cleaned up.",
        expected_revenue_impact: 0,
        trust_impact: 10,
        delivery_impact: 0,
        urgency: relationship.resolver_state === "contact_unknown" ? 40 : 55,
        confidence: baseConfidence(relationship),
        status,
        blocker,
        origin: `lead.${relationship.relationship_id}`,
      })
    );
  }

  const all = Array.from(candidates.values()).sort((a, b) => {
    if (b.rank_score !== a.rank_score) return b.rank_score - a.rank_score;
    return a.action_id.localeCompare(b.action_id);
  });

  const validation = validateResolvedActionCandidates(all);
  const byCategory = all.reduce<Record<ActionCategory, number>>(
    (acc, item) => {
      acc[item.category] += 1;
      return acc;
    },
    { revenue: 0, fulfillment: 0, trust: 0, outcome: 0 }
  );

  const unresolvedActionCount = all.filter((item) => item.unresolved_relationship).length;
  const conflictActionCount = all.filter((item) => item.stage_conflict).length;

  const top10 = all.slice(0, 10).map(({ category, rank_score, rank_reason, resolver_state, conflict_types, unresolved_relationship, stage_conflict, origin, ...candidate }) => candidate);
  const rankingRationale = all.slice(0, 10).map((item) => ({
    action_id: item.action_id,
    rank_score: item.rank_score,
    reason: item.rank_reason,
  }));

  return {
    candidates: all.map(({ category, rank_score, rank_reason, resolver_state, conflict_types, unresolved_relationship, stage_conflict, origin, ...candidate }) => candidate),
    full_candidates: all,
    report: {
      total_actions: all.length,
      unresolved_action_count: unresolvedActionCount,
      conflict_action_count: conflictActionCount,
      by_category: byCategory,
      top_10: top10,
      ranking_rationale: rankingRationale,
      validation,
    },
  };
}

export function resolveActionCandidates() {
  return deriveCandidates().candidates;
}

export function resolveActionCandidateById(id: string) {
  return resolveActionCandidates().find((candidate) => candidate.action_id === id) || null;
}

export function validateResolvedActionCandidates(actions: ActionCandidate[]): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const action of actions) {
    if (!action.action_id) errors.push("Missing action_id");
    if (!action.relationship_id) errors.push(`Missing relationship_id for ${action.action_id || "unknown"}`);
    if (seen.has(action.action_id)) errors.push(`Duplicate action_id: ${action.action_id}`);
    seen.add(action.action_id);
    if (!["ready", "blocked", "done", "stale"].includes(action.status)) {
      errors.push(`Invalid action status: ${action.action_id}`);
    }
    if (typeof action.expected_revenue_impact !== "number" || Number.isNaN(action.expected_revenue_impact)) {
      errors.push(`Invalid expected_revenue_impact: ${action.action_id}`);
    }
    if (typeof action.trust_impact !== "number" || Number.isNaN(action.trust_impact)) {
      errors.push(`Invalid trust_impact: ${action.action_id}`);
    }
    if (typeof action.delivery_impact !== "number" || Number.isNaN(action.delivery_impact)) {
      errors.push(`Invalid delivery_impact: ${action.action_id}`);
    }
    if (typeof action.urgency !== "number" || Number.isNaN(action.urgency)) {
      errors.push(`Invalid urgency: ${action.action_id}`);
    }
    if (typeof action.confidence !== "number" || Number.isNaN(action.confidence)) {
      errors.push(`Invalid confidence: ${action.action_id}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function getActionResolverReport(): ActionResolverReport {
  return deriveCandidates().report;
}

export { normalizeActionKey };
