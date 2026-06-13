import fs from "node:fs";
import path from "node:path";
import {
  type ActionCandidate,
  normalizeActionKey,
  resolveActionCandidates,
  validateResolvedActionCandidates,
} from "./actionResolver";
import {
  resolveRelationships,
  validateResolvedRelationships,
} from "./relationshipResolver";

type DecisionCategory = "revenue" | "fulfillment" | "relationship" | "outcome";
type RelationshipObject = ReturnType<typeof resolveRelationships>[number];

type TruthRecord = Record<string, any>;

type RevenueTruth = {
  current_bottleneck?: string;
  next_actions?: Array<{
    priority?: number;
    action?: string;
    expected_outcome?: string;
  }>;
};

type FulfillmentTruth = {
  generated_at?: string;
  items?: TruthRecord[];
};

type ExecutionTruth = {
  generated_at?: string;
  events?: TruthRecord[];
};

type OutcomeTruth = {
  generated_at?: string;
  events?: TruthRecord[];
};

type DecisionEngineAction = ActionCandidate & {
  category: DecisionCategory;
  rank_score: number;
  rank_reason: string;
  resolver_state: RelationshipObject["resolver_state"];
  conflict_types: string[];
  unresolved_relationship: boolean;
  stage_conflict: boolean;
  objective_key: string;
  candidate_reason: string;
  relationship_health: RelationshipObject["relationship_core"]["relationship_health"];
  relationship_risk_level: RelationshipObject["relationship_core"]["risk_level"];
};

export type DecisionEngineReport = {
  top_action: DecisionEngineAction | null;
  top_revenue_action: DecisionEngineAction | null;
  top_fulfillment_action: DecisionEngineAction | null;
  top_relationship_action: DecisionEngineAction | null;
  top_outcome_action: DecisionEngineAction | null;
  top_blocker: DecisionEngineAction | null;
  supporting_actions: DecisionEngineAction[];
  suppressed_action_ids: string[];
  arbitration: {
    selection_order: string[];
    why_this_won: string[];
  };
  validation: {
    ok: boolean;
    errors: string[];
  };
  counts: {
    total_actions: number;
    by_category: Record<DecisionCategory, number>;
    unresolved_action_count: number;
    conflict_action_count: number;
    suppressed_action_count: number;
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

function normalizeDecisionKey(value?: string | null) {
  return normalizeActionKey(value);
}

function readTruths() {
  const repoRoot = resolveRepoRoot();
  const revenueTruth = readJson<RevenueTruth>(path.join(repoRoot, "staffordos/revenue/revenue_truth_v1.json"), {});
  const fulfillmentTruth = readJson<FulfillmentTruth>(
    path.join(repoRoot, "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json"),
    { items: [] }
  );
  const executionTruth = readJson<ExecutionTruth>(path.join(repoRoot, "staffordos/execution/execution_log_v1.json"), {
    events: [],
  });
  const outcomeTruth = readJson<OutcomeTruth>(path.join(repoRoot, "staffordos/execution/outcome_events_v1.json"), {
    events: [],
  });
  return {
    repoRoot,
    revenueTruth,
    fulfillmentTruth,
    executionTruth,
    outcomeTruth,
  };
}

function buildRelationshipLookup() {
  const relationships = resolveRelationships();
  const lookup = new Map<string, RelationshipObject>();

  for (const relationship of relationships) {
    lookup.set(normalizeDecisionKey(relationship.relationship_id), relationship);
    lookup.set(normalizeDecisionKey(relationship.identity.client_id), relationship);
    lookup.set(normalizeDecisionKey(relationship.identity.merchant_id), relationship);
    lookup.set(normalizeDecisionKey(relationship.identity.merchant_shop), relationship);
    lookup.set(normalizeDecisionKey(relationship.identity.store_domain), relationship);
    lookup.set(normalizeDecisionKey(relationship.identity.lead_id), relationship);
    lookup.set(normalizeDecisionKey(relationship.identity.domain), relationship);
    lookup.set(normalizeDecisionKey(relationship.identity.email), relationship);
    for (const alias of relationship.identity.aliases) {
      lookup.set(normalizeDecisionKey(alias), relationship);
    }
  }

  return { relationships, lookup };
}

function categoryForActionType(actionType: string): DecisionCategory {
  if (actionType === "fulfillment_waiting_payment") return "fulfillment";
  if (actionType === "payment_followup_pending") return "relationship";
  if (actionType === "offer_sent") return "outcome";
  if (actionType === "revenue_followup" || actionType === "revenue_outreach" || actionType === "revenue_close") return "revenue";
  return "relationship";
}

function objectiveKeyForActionType(actionType: string) {
  switch (actionType) {
    case "revenue_close":
      return "cash_close";
    case "payment_followup_pending":
      return "trust_followup";
    case "fulfillment_waiting_payment":
      return "fulfillment_gate";
    case "offer_sent":
      return "historical_offer";
    case "revenue_followup":
      return "revenue_followup";
    case "revenue_outreach":
      return "lead_outreach";
    default:
      return `objective_${normalizeDecisionKey(actionType) || "unknown"}`;
  }
}

function categoryPriority(category: DecisionCategory) {
  switch (category) {
    case "revenue":
      return 4;
    case "fulfillment":
      return 3;
    case "relationship":
      return 2;
    case "outcome":
      return 1;
  }
}

function relationshipForCandidate(candidate: ActionCandidate, lookup: Map<string, RelationshipObject>) {
  const normalized = normalizeDecisionKey(candidate.relationship_id);
  return lookup.get(normalized) || null;
}

function relationshipScore(relationship: RelationshipObject | null) {
  if (!relationship) return 0;
  if (relationship.resolver_state === "resolved") return 20;
  if (relationship.resolver_state === "contact_unknown") return -6;
  if (relationship.resolver_state === "lead_only") return -10;
  if (relationship.resolver_state === "operational_conflict") return -15;
  return -20;
}

function confidenceScore(confidence: number) {
  return Math.max(0, Math.min(100, Math.round(confidence * 100)));
}

function baseRankScore(candidate: ActionCandidate, relationship: RelationshipObject | null) {
  const raw =
    candidate.expected_revenue_impact * 0.45 +
    candidate.trust_impact * 0.2 +
    candidate.delivery_impact * 0.18 +
    candidate.urgency * 0.12 +
    confidenceScore(candidate.confidence) * 0.1 +
    relationshipScore(relationship);

  return Math.max(0, Math.min(100, Math.round(raw)));
}

function rankReason(candidate: ActionCandidate, relationship: RelationshipObject | null, objectiveKey: string) {
  const reasons = [
    `category=${categoryForActionType(candidate.action_type)}`,
    `objective=${objectiveKey}`,
    `status=${candidate.status}`,
    `urgency=${candidate.urgency}`,
    `confidence=${candidate.confidence.toFixed(2)}`,
  ];
  if (candidate.expected_revenue_impact) reasons.push(`revenue=${candidate.expected_revenue_impact}`);
  if (candidate.trust_impact) reasons.push(`trust=${candidate.trust_impact}`);
  if (candidate.delivery_impact) reasons.push(`delivery=${candidate.delivery_impact}`);
  if (candidate.blocker) reasons.push(`blocker=${candidate.blocker}`);
  if (relationship) {
    reasons.push(`relationship_state=${relationship.resolver_state}`);
    if (relationship.relationship_core.conflict_types.length) {
      reasons.push(`conflicts=${relationship.relationship_core.conflict_types.join(",")}`);
    }
  } else {
    reasons.push("relationship_state=unresolved");
  }
  return reasons.join("; ");
}

function decorateCandidate(candidate: ActionCandidate, lookup: Map<string, RelationshipObject>): DecisionEngineAction {
  const relationship = relationshipForCandidate(candidate, lookup);
  const category = categoryForActionType(candidate.action_type);
  const objectiveKey = objectiveKeyForActionType(candidate.action_type);
  const stageConflict = Boolean(relationship?.relationship_core.conflict_types.includes("stage_conflict"));
  const unresolvedRelationship = Boolean(
    !relationship ||
      relationship.resolver_state === "lead_only" ||
      relationship.resolver_state === "contact_unknown" ||
      relationship.resolver_state === "unresolved_identity"
  );

  return {
    ...candidate,
    category,
    rank_score: baseRankScore(candidate, relationship),
    rank_reason: rankReason(candidate, relationship, objectiveKey),
    resolver_state: relationship?.resolver_state || "unresolved_identity",
    conflict_types: relationship?.relationship_core.conflict_types || [],
    unresolved_relationship: unresolvedRelationship,
    stage_conflict: stageConflict,
    objective_key: objectiveKey,
    candidate_reason: candidate.why_it_matters,
    relationship_health: relationship?.relationship_core.relationship_health || "unknown",
    relationship_risk_level: relationship?.relationship_core.risk_level || "unknown",
  };
}

function isHistorical(candidate: DecisionEngineAction) {
  return candidate.status === "done" || candidate.status === "stale" || candidate.action_type === "offer_sent";
}

function isBlocked(candidate: DecisionEngineAction) {
  return candidate.status === "blocked" || Boolean(candidate.blocker);
}

function isEligibleForTopAction(candidate: DecisionEngineAction) {
  if (isHistorical(candidate)) return false;
  if (isBlocked(candidate)) return false;
  return candidate.resolver_state === "resolved";
}

function isEligibleFallback(candidate: DecisionEngineAction) {
  if (isHistorical(candidate)) return false;
  if (isBlocked(candidate)) return false;
  return candidate.resolver_state === "contact_unknown" || candidate.resolver_state === "lead_only" || candidate.resolver_state === "resolved";
}

function sameBusinessObjective(a: DecisionEngineAction, b: DecisionEngineAction) {
  return a.relationship_id === b.relationship_id && a.objective_key === b.objective_key;
}

function chooseBest(candidates: DecisionEngineAction[], options: { allowBlocked?: boolean; allowUnresolved?: boolean } = {}) {
  const filtered = candidates.filter((candidate) => {
    if (isHistorical(candidate)) return false;
    if (!options.allowBlocked && isBlocked(candidate)) return false;
    if (!options.allowUnresolved && candidate.resolver_state !== "resolved") return false;
    return true;
  });

  return filtered
    .sort((a, b) => {
      if (categoryPriority(b.category) !== categoryPriority(a.category)) {
        return categoryPriority(b.category) - categoryPriority(a.category);
      }
      if (b.rank_score !== a.rank_score) return b.rank_score - a.rank_score;
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.action_id.localeCompare(b.action_id);
    })[0] || null;
}

function chooseCategoryWinner(
  candidates: DecisionEngineAction[],
  category: DecisionCategory,
  options: { allowBlocked?: boolean; allowUnresolved?: boolean } = {}
) {
  const categoryCandidates = candidates.filter((candidate) => candidate.category === category);
  const winner =
    chooseBest(categoryCandidates, options) ||
    chooseBest(categoryCandidates, { ...options, allowBlocked: true, allowUnresolved: true });
  return winner;
}

function topBlocker(candidates: DecisionEngineAction[]) {
  const blocked = candidates.filter((candidate) => isBlocked(candidate) && !isHistorical(candidate));
  return blocked
    .sort((a, b) => {
      const aImpact = a.expected_revenue_impact + a.delivery_impact + a.trust_impact;
      const bImpact = b.expected_revenue_impact + b.delivery_impact + b.trust_impact;
      if (bImpact !== aImpact) return bImpact - aImpact;
      if (b.rank_score !== a.rank_score) return b.rank_score - a.rank_score;
      return a.action_id.localeCompare(b.action_id);
    })[0] || null;
}

function resolveRevenueContext(truths: ReturnType<typeof readTruths>) {
  const nextAction = truths.revenueTruth?.next_actions?.[0] || null;
  return {
    current_bottleneck: text(truths.revenueTruth?.current_bottleneck) || null,
    next_action: nextAction
      ? {
          action: text(nextAction.action) || null,
          expected_outcome: text(nextAction.expected_outcome) || null,
          priority: Number(nextAction.priority) || null,
        }
      : null,
  };
}

function resolveFulfillmentContext(truths: ReturnType<typeof readTruths>) {
  const item = Array.isArray(truths.fulfillmentTruth.items) ? truths.fulfillmentTruth.items[0] || null : null;
  return item
    ? {
        payment_status: text(item.payment_status) || null,
        fulfillment_status: text(item.fulfillment_status) || null,
        proof_status: text(item.proof_status) || null,
        completion_status: text(item.completion_status) || null,
        recommended_next_watch_item: text(item.recommended_next_watch_item) || null,
        risk_or_limitation: text(item.risk_or_limitation) || null,
      }
    : null;
}

function resolveExecutionContext(truths: ReturnType<typeof readTruths>) {
  const events = Array.isArray(truths.executionTruth.events) ? truths.executionTruth.events : [];
  return {
    offer_sent: events.some((event) => lower(event.action_type) === "offer_sent"),
    payment_received: events.some((event) => lower(event.action_type) === "payment_received"),
    fulfillment_started: events.some((event) => lower(event.action_type) === "fulfillment_started"),
    completion_marked: events.some((event) => lower(event.action_type) === "completion_marked"),
  };
}

function resolveOutcomeContext(truths: ReturnType<typeof readTruths>) {
  const events = Array.isArray(truths.outcomeTruth.events) ? truths.outcomeTruth.events : [];
  return {
    offer_sent: events.some((event) => lower(event.new_state) === "offer_sent"),
    referral_requested: events.some((event) => lower(event.new_state) === "referral_requested"),
    referral_received: events.some((event) => lower(event.new_state) === "referral_received"),
    expansion_created: events.some((event) => lower(event.new_state) === "expansion_created"),
    dormant: events.some((event) => lower(event.new_state) === "dormant"),
    at_risk: events.some((event) => lower(event.new_state) === "at_risk"),
  };
}

function validateDecisionEngine(report: DecisionEngineReport) {
  const errors: string[] = [];
  if (!report.top_action) errors.push("Missing top_action");
  if (!report.top_revenue_action) errors.push("Missing top_revenue_action");
  if (!report.top_fulfillment_action) errors.push("Missing top_fulfillment_action");
  if (!report.top_relationship_action) errors.push("Missing top_relationship_action");
  if (report.top_action && isHistorical(report.top_action)) errors.push("top_action cannot be historical");
  if (report.top_action && isBlocked(report.top_action)) errors.push("top_action cannot be blocked");
  if (report.top_blocker && !isBlocked(report.top_blocker)) errors.push("top_blocker must be blocked");
  if (report.top_outcome_action && report.top_outcome_action.status !== "ready") {
    errors.push("top_outcome_action must be ready when present");
  }
  return { ok: errors.length === 0, errors };
}

function buildDecisionEngine() {
  const truths = readTruths();
  const { relationships, lookup: relationshipLookup } = buildRelationshipLookup();
  const relationshipValidation = validateResolvedRelationships(relationships);
  const actionCandidates = resolveActionCandidates();
  const actionValidation = validateResolvedActionCandidates(actionCandidates);
  const decorated = actionCandidates.map((candidate) => decorateCandidate(candidate, relationshipLookup));
  const suppressedActionIds = new Set<string>();
  const selectedActions: DecisionEngineAction[] = [];

  const deduped = new Map<string, DecisionEngineAction>();
  for (const candidate of decorated) {
    const existing = deduped.get(`${candidate.relationship_id}::${candidate.objective_key}`);
    if (!existing) {
      deduped.set(`${candidate.relationship_id}::${candidate.objective_key}`, candidate);
      continue;
    }
    const preferred = [existing, candidate]
      .sort((a, b) => {
        const aPriority = isHistorical(a) ? -100 : isBlocked(a) ? -20 : 0;
        const bPriority = isHistorical(b) ? -100 : isBlocked(b) ? -20 : 0;
        if (bPriority !== aPriority) return bPriority - aPriority;
        if (b.rank_score !== a.rank_score) return b.rank_score - a.rank_score;
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return a.action_id.localeCompare(b.action_id);
      })[0];
    deduped.set(`${candidate.relationship_id}::${candidate.objective_key}`, preferred);
    const loser = preferred.action_id === existing.action_id ? candidate : existing;
    suppressedActionIds.add(loser.action_id);
  }

  for (const candidate of decorated) {
    const preferred = deduped.get(`${candidate.relationship_id}::${candidate.objective_key}`);
    if (preferred && preferred.action_id !== candidate.action_id) {
      suppressedActionIds.add(candidate.action_id);
    }
  }

  const dedupedActions = Array.from(new Map(Array.from(deduped.values()).map((candidate) => [candidate.action_id, candidate])).values()).sort(
    (a, b) => {
      if (b.rank_score !== a.rank_score) return b.rank_score - a.rank_score;
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.action_id.localeCompare(b.action_id);
    }
  );

  const topRevenueAction = chooseCategoryWinner(dedupedActions, "revenue", { allowBlocked: false, allowUnresolved: false }) ||
    chooseCategoryWinner(dedupedActions, "revenue", { allowBlocked: true, allowUnresolved: true });
  const topFulfillmentAction = chooseCategoryWinner(dedupedActions, "fulfillment", { allowBlocked: true, allowUnresolved: false }) ||
    chooseCategoryWinner(dedupedActions, "fulfillment", { allowBlocked: true, allowUnresolved: true });
  const topRelationshipAction = chooseCategoryWinner(dedupedActions, "relationship", { allowBlocked: false, allowUnresolved: true }) ||
    chooseCategoryWinner(dedupedActions, "relationship", { allowBlocked: true, allowUnresolved: true });
  const topOutcomeAction = chooseCategoryWinner(dedupedActions, "outcome", { allowBlocked: false, allowUnresolved: false }) ||
    chooseCategoryWinner(dedupedActions, "outcome", { allowBlocked: true, allowUnresolved: true });

  if (topRevenueAction) selectedActions.push(topRevenueAction);
  if (topFulfillmentAction && topFulfillmentAction.action_id !== topRevenueAction?.action_id) selectedActions.push(topFulfillmentAction);
  if (topRelationshipAction &&
    !selectedActions.some((candidate) => candidate.action_id === topRelationshipAction.action_id)) {
    selectedActions.push(topRelationshipAction);
  }
  if (topOutcomeAction &&
    !selectedActions.some((candidate) => candidate.action_id === topOutcomeAction.action_id)) {
    selectedActions.push(topOutcomeAction);
  }

  const topAction =
    chooseBest(dedupedActions, { allowBlocked: false, allowUnresolved: false }) ||
    chooseBest(dedupedActions, { allowBlocked: false, allowUnresolved: true }) ||
    chooseBest(dedupedActions, { allowBlocked: true, allowUnresolved: true });

  const blocker = topBlocker(dedupedActions);
  if (blocker && !selectedActions.some((candidate) => candidate.action_id === blocker.action_id)) {
    selectedActions.push(blocker);
  }

  const suppressedIds = Array.from(suppressedActionIds);
  for (const candidate of dedupedActions) {
    if (isHistorical(candidate)) suppressedIds.push(candidate.action_id);
    if (candidate.status === "blocked" && candidate.action_id !== blocker?.action_id) suppressedIds.push(candidate.action_id);
  }

  const suppressed = Array.from(new Set(suppressedIds));
  const supportingActions = dedupedActions.filter(
    (candidate) =>
      !selectedActions.some((selected) => selected.action_id === candidate.action_id) &&
      !suppressed.includes(candidate.action_id)
  );

  const revenueContext = resolveRevenueContext(truths);
  const fulfillmentContext = resolveFulfillmentContext(truths);
  const executionContext = resolveExecutionContext(truths);
  const outcomeContext = resolveOutcomeContext(truths);

  const arbitration = {
    selection_order: [
      "1. Suppress done and historical actions from top_action.",
      "2. Suppress blocked actions from top_action and route them to top_blocker.",
      "3. Deduplicate by relationship_id and business objective.",
      "4. Prefer ready revenue actions.",
      "5. Then prefer ready fulfillment actions.",
      "6. Then prefer ready relationship actions.",
      "7. Then prefer ready outcome actions.",
    ],
    why_this_won: [
      topAction
        ? `${topAction.action_type} won top_action because it is the highest-ranked ready action after suppression and dedupe.`
        : "No eligible top_action candidate was available.",
      topRevenueAction
        ? `${topRevenueAction.action_type} won top_revenue_action because it is the strongest ready revenue motion.`
        : "No eligible top_revenue_action candidate was available.",
      topFulfillmentAction
        ? `${topFulfillmentAction.action_type} won top_fulfillment_action because it is the strongest fulfillment-related motion.`
        : "No eligible top_fulfillment_action candidate was available.",
      topRelationshipAction
        ? `${topRelationshipAction.action_type} won top_relationship_action because it is the strongest trust or follow-up motion.`
        : "No eligible top_relationship_action candidate was available.",
      topOutcomeAction
        ? `${topOutcomeAction.action_type} won top_outcome_action because it is the strongest outcome-motion candidate.`
        : "No eligible top_outcome_action candidate was available.",
      blocker
        ? `${blocker.action_type} became top_blocker because it has the highest blocked business impact.`
        : "No blocked action qualified as top_blocker.",
    ],
  };

  const report: DecisionEngineReport = {
    top_action: topAction,
    top_revenue_action: topRevenueAction,
    top_fulfillment_action: topFulfillmentAction,
    top_relationship_action: topRelationshipAction,
    top_outcome_action: topOutcomeAction && !isHistorical(topOutcomeAction) ? topOutcomeAction : null,
    top_blocker: blocker,
    supporting_actions: supportingActions,
    suppressed_action_ids: suppressed,
    arbitration,
    validation: { ok: true, errors: [] },
    counts: {
      total_actions: dedupedActions.length,
      by_category: dedupedActions.reduce(
        (acc, candidate) => {
          acc[candidate.category] += 1;
          return acc;
        },
        { revenue: 0, fulfillment: 0, relationship: 0, outcome: 0 }
      ),
      unresolved_action_count: dedupedActions.filter((candidate) => candidate.unresolved_relationship).length,
      conflict_action_count: dedupedActions.filter((candidate) => candidate.stage_conflict || candidate.conflict_types.length > 0).length,
      suppressed_action_count: suppressed.length,
    },
  };

  const validation = validateDecisionEngine(report);
  const relationshipErrors = relationshipValidation.errors.length ? relationshipValidation.errors : [];
  const actionErrors = actionValidation.errors.length ? actionValidation.errors : [];
  const combinedErrors = [...validation.errors, ...relationshipErrors, ...actionErrors];

  return {
    ...report,
    validation: {
      ok: combinedErrors.length === 0,
      errors: combinedErrors,
    },
    truth_context: {
      revenue: revenueContext,
      fulfillment: fulfillmentContext,
      execution: executionContext,
      outcome: outcomeContext,
    },
  } as DecisionEngineReport & {
    truth_context: {
      revenue: ReturnType<typeof resolveRevenueContext>;
      fulfillment: ReturnType<typeof resolveFulfillmentContext>;
      execution: ReturnType<typeof resolveExecutionContext>;
      outcome: ReturnType<typeof resolveOutcomeContext>;
    };
  };
}

export function resolveDecisionEngine() {
  return buildDecisionEngine();
}

export function getDecisionEngineReport() {
  return buildDecisionEngine();
}

export function validateDecisionEngineReport(report: DecisionEngineReport) {
  return validateDecisionEngine(report);
}

export { normalizeDecisionKey };
