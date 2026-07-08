import fs from "node:fs";
import path from "node:path";
import {
  type ActionCandidate,
  resolveActionCandidates,
  validateResolvedActionCandidates,
} from "./actionResolver";
import {
  resolveRelationships,
  validateResolvedRelationships,
} from "./relationshipResolver";
import { getDecisionEngineReport } from "./decisionEngineResolver";

type CampaignType =
  | "shopifixer_outreach"
  | "shopifixer_close_engine"
  | "fulfillment_delivery"
  | "referral_expansion"
  | "dormant_reactivation";

type CampaignHealth = "healthy" | "warm" | "at_risk" | "dormant" | "unknown";

type RawRecord = Record<string, any>;

type CampaignRegistryRecord = {
  campaign_id: string;
  campaign_type: CampaignType;
  status: string;
  owner: string;
  product: string;
  created_at: string;
};

type CampaignRegistry = {
  generated_at?: string;
  source?: string;
  version?: string;
  records?: CampaignRegistryRecord[];
};

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
  items?: RawRecord[];
};

type ExecutionTruth = {
  generated_at?: string;
  events?: RawRecord[];
};

type OutcomeTruth = {
  generated_at?: string;
  events?: RawRecord[];
};

type MerchantLifecycleRegistry = {
  generated_at?: string;
  records?: RawRecord[];
};

type Campaign = {
  campaign_id: string;
  campaign_type: CampaignType;
  objective: string;
  health: CampaignHealth;
  relationships: string[];
  active_actions: string[];
  blocked_actions: string[];
  completed_actions: string[];
  revenue_at_stake: number;
  next_best_action: ActionCandidate | null;
  confidence: number;
  provenance: {
    source_files: string[];
    relationship_reasons: Record<string, string[]>;
    action_reasons: Record<string, string[]>;
    conflict_types: string[];
    conflict_notes: string[];
    unresolved_relationship_ids: string[];
    decision_engine: {
      top_action_id: string | null;
      top_revenue_action_id: string | null;
      top_fulfillment_action_id: string | null;
      top_relationship_action_id: string | null;
      top_outcome_action_id: string | null;
      top_blocker_id: string | null;
      validation_ok: boolean;
    };
  };
};

type CampaignInventoryItem = {
  campaign_id: string;
  campaign_type: CampaignType;
  relationships: string[];
  active_actions: string[];
  blocked_actions: string[];
  completed_actions: string[];
  reasons: string[];
};

type CampaignResolverReport = {
  total_campaigns: number;
  campaign_types: Record<CampaignType, number>;
  health_distribution: Record<CampaignHealth, number>;
  revenue_at_stake_total: number;
  revenue_at_stake_by_type: Record<CampaignType, number>;
  relationship_coverage: {
    total_relationships: number;
    covered_relationships: number;
    coverage_percent: number;
    covered_relationship_ids: string[];
    uncovered_relationship_ids: string[];
  };
  unresolved_campaign_count: number;
  conflict_count: number;
  conflicts: Array<{
    campaign_id: string;
    campaign_type: CampaignType;
    conflict_types: string[];
    conflict_notes: string[];
  }>;
  campaigns: Campaign[];
  inventory: {
    source_inventory: {
      relationship_count: number;
      action_count: number;
      execution_event_count: number;
      outcome_event_count: number;
      merchant_lifecycle_record_count: number;
      fulfillment_item_count: number;
      revenue_bottleneck: string | null;
    };
    natural_membership: CampaignInventoryItem[];
  };
  validation: {
    ok: boolean;
    errors: string[];
  };
};

const VALID_CAMPAIGN_TYPES: CampaignType[] = [
  "shopifixer_outreach",
  "shopifixer_close_engine",
  "fulfillment_delivery",
  "referral_expansion",
  "dormant_reactivation",
];

const VALID_CAMPAIGN_HEALTHS: CampaignHealth[] = ["healthy", "warm", "at_risk", "dormant", "unknown"];

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

function normalizeKey(value?: string | null) {
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

function normalizeCampaignId(value: string) {
  return `campaign_${normalizeKey(value)}`;
}

function isStableCampaignRegistryId(value: unknown) {
  return typeof value === "string" && value.trim() === value && value.length > 0;
}

function toActionSummary(action: ActionCandidate | null) {
  if (!action) return null;
  return {
    action_id: action.action_id,
    relationship_id: action.relationship_id,
    action_type: action.action_type,
    title: action.title,
    why_it_matters: action.why_it_matters,
    expected_revenue_impact: action.expected_revenue_impact,
    trust_impact: action.trust_impact,
    delivery_impact: action.delivery_impact,
    urgency: action.urgency,
    confidence: action.confidence,
    status: action.status,
    blocker: action.blocker,
  } satisfies ActionCandidate;
}

function resolveTruths() {
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
  const merchantLifecycle = readJson<MerchantLifecycleRegistry>(
    path.join(repoRoot, "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json"),
    { records: [] }
  );
  return {
    repoRoot,
    revenueTruth,
    fulfillmentTruth,
    executionTruth,
    outcomeTruth,
    merchantLifecycle,
  };
}

function loadCampaignRegistry(repoRoot: string) {
  const registry = readJson<CampaignRegistry>(path.join(repoRoot, "staffordos/campaigns/campaign_registry_v1.json"), {});
  const records = Array.isArray(registry.records) ? registry.records : [];
  const byType = new Map<CampaignType, CampaignRegistryRecord>();
  const errors: string[] = [];

  for (const record of records) {
    if (!record || typeof record !== "object") {
      errors.push("Invalid campaign registry record shape");
      continue;
    }
    if (!VALID_CAMPAIGN_TYPES.includes(record.campaign_type)) {
      errors.push(`Invalid campaign registry type: ${String(record.campaign_type || "")}`);
      continue;
    }
    if (byType.has(record.campaign_type)) {
      errors.push(`Duplicate campaign registry type: ${record.campaign_type}`);
      continue;
    }
    if (!isStableCampaignRegistryId(record.campaign_id)) {
      errors.push(`Invalid campaign registry id: ${String(record.campaign_id || "")}`);
      continue;
    }
    if (!text(record.status) || !text(record.owner) || !text(record.product) || !text(record.created_at)) {
      errors.push(`Incomplete campaign registry record: ${record.campaign_type}`);
      continue;
    }
    byType.set(record.campaign_type, record);
  }

  return {
    ok: errors.length === 0 && records.length > 0,
    errors,
    records,
    byType,
  };
}

function loadMerchantOfferPrices(records: RawRecord[]) {
  const map = new Map<string, number>();
  for (const record of records) {
    const price = Number(record.offer_price);
    if (!Number.isFinite(price)) continue;
    for (const key of [record.merchant_id, record.client_id, record.merchant_shop, record.store_domain]) {
      const normalized = normalizeKey(key);
      if (normalized) map.set(normalized, price);
    }
  }
  return map;
}

function loadMerchantStages(records: RawRecord[]) {
  const map = new Map<string, RawRecord>();
  for (const record of records) {
    for (const key of [record.merchant_id, record.client_id, record.merchant_shop, record.store_domain]) {
      const normalized = normalizeKey(key);
      if (normalized) map.set(normalized, record);
    }
  }
  return map;
}

function determineCampaignTypes(relationship: ReturnType<typeof resolveRelationships>[number], actions: ActionCandidate[]) {
  const campaignTypes = new Set<CampaignType>();
  const relationshipStage = normalizeKey(relationship.relationship_core.current_stage);
  const leadStage = normalizeKey(relationship.facets.lead.current_stage);
  const clientStage = normalizeKey(relationship.facets.client.current_stage);
  const merchantStage = normalizeKey(relationship.facets.merchant.current_stage);
  const fulfillmentStatus = normalizeKey(relationship.facets.fulfillment.fulfillment_status);
  const paymentStatus = normalizeKey(relationship.facets.fulfillment.payment_status);
  const outcomeState = normalizeKey(relationship.facets.outcome.new_state);
  const hasActionType = (actionType: string) => actions.some((action) => action.action_type === actionType);

  if (
    relationship.resolver_state === "lead_only" ||
    relationship.resolver_state === "contact_unknown" ||
    leadStage === "lead" ||
    clientStage === "lead" ||
    clientStage === "engaged" ||
    hasActionType("revenue_outreach")
  ) {
    campaignTypes.add("shopifixer_outreach");
  }

  if (
    merchantStage === "offer_sent" ||
    merchantStage === "followup_sent" ||
    relationshipStage === "offer_sent" ||
    relationshipStage === "followup_sent" ||
    hasActionType("revenue_close") ||
    hasActionType("payment_followup_pending")
  ) {
    campaignTypes.add("shopifixer_close_engine");
  }

  if (
    paymentStatus === "waiting_for_payment" ||
    fulfillmentStatus === "waiting_for_payment" ||
    fulfillmentStatus === "proof_ready" ||
    fulfillmentStatus === "fix_in_progress" ||
    fulfillmentStatus === "completion_marked" ||
    hasActionType("fulfillment_waiting_payment")
  ) {
    campaignTypes.add("fulfillment_delivery");
  }

  if (
    outcomeState === "referral_candidate" ||
    outcomeState === "expansion_candidate" ||
    normalizeKey(relationship.facets.merchant.referral_status) === "ready" ||
    normalizeKey(relationship.facets.merchant.case_study_status) === "ready" ||
    Boolean(relationship.facets.client.followup_ready)
  ) {
    campaignTypes.add("referral_expansion");
  }

  if (
    outcomeState === "dormant" ||
    relationship.relationship_core.relationship_health === "dormant" ||
    (relationship.resolver_state !== "resolved" && !campaignTypes.size)
  ) {
    campaignTypes.add("dormant_reactivation");
  }

  return Array.from(campaignTypes);
}

function campaignObjective(campaignType: CampaignType) {
  switch (campaignType) {
    case "shopifixer_outreach":
      return "Move cold or early-stage Shopify prospects into an active offer conversation.";
    case "shopifixer_close_engine":
      return "Convert active ShopiFixer proposals into paid clients.";
    case "fulfillment_delivery":
      return "Deliver paid ShopiFixer work through proof and completion.";
    case "referral_expansion":
      return "Turn completed customers into referral or expansion revenue.";
    case "dormant_reactivation":
      return "Reawaken quiet relationships with dormant revenue potential.";
  }
}

function campaignTypeHealth(
  campaignType: CampaignType,
  relationships: ReturnType<typeof resolveRelationships>,
  actions: ActionCandidate[]
): CampaignHealth {
  const activeCount = actions.filter((action) => action.status === "ready").length;
  const blockedCount = actions.filter((action) => action.status === "blocked").length;
  const completedCount = actions.filter((action) => action.status === "done" || action.status === "stale").length;
  const unresolvedCount = relationships.filter((relationship) =>
    ["lead_only", "contact_unknown", "unresolved_identity", "operational_conflict"].includes(relationship.resolver_state)
  ).length;
  const conflictCount = relationships.filter((relationship) => relationship.relationship_core.conflict_types.length > 0).length;

  if (campaignType === "dormant_reactivation") return "dormant";
  if (completedCount > 0 && activeCount === 0 && blockedCount === 0) return "dormant";
  if (activeCount === 0 && blockedCount > 0) return "at_risk";
  if (unresolvedCount > 0 && blockedCount >= activeCount) return "at_risk";
  if (conflictCount > 0 && blockedCount > activeCount) return "at_risk";
  if (activeCount > 0 && blockedCount > 0) return "warm";
  if (activeCount > 0) return "healthy";
  return "unknown";
}

function campaignConfidence(relationships: ReturnType<typeof resolveRelationships>, actions: ActionCandidate[]) {
  const relConfidence = relationships.length
    ? relationships.reduce((sum, relationship) => sum + relationship.relationship_core.confidence, 0) / relationships.length
    : 0;
  const actionConfidence = actions.length
    ? actions.reduce((sum, action) => sum + action.confidence, 0) / actions.length
    : 0;
  const confidence = (relConfidence * 0.6) + (actionConfidence * 0.4);
  return Math.max(0, Math.min(1, Number(confidence.toFixed(2))));
}

function campaignRevenueAtStake(
  relationships: ReturnType<typeof resolveRelationships>,
  actions: ActionCandidate[],
  offerPrices: Map<string, number>
) {
  let total = 0;
  for (const relationship of relationships) {
    const key = normalizeKey(
      relationship.identity.client_id ||
        relationship.identity.merchant_id ||
        relationship.identity.merchant_shop ||
        relationship.identity.store_domain ||
        relationship.identity.lead_id
    );
    const price = offerPrices.get(key) || 0;
    if (price > 0) {
      total += price;
      continue;
    }
    const actionValue = actions.reduce((sum, action) => sum + Math.max(0, Number(action.expected_revenue_impact) || 0), 0);
    total += actionValue;
  }
  return total;
}

function campaignRelationshipReasons(
  relationship: ReturnType<typeof resolveRelationships>[number],
  campaignType: CampaignType
) {
  const reasons: string[] = [];
  reasons.push(`resolver_state=${relationship.resolver_state}`);
  if (relationship.relationship_core.current_stage) {
    reasons.push(`stage=${relationship.relationship_core.current_stage}`);
  }
  if (relationship.relationship_core.next_action) {
    reasons.push(`next_action=${relationship.relationship_core.next_action}`);
  }
  if (relationship.relationship_core.conflict_types.length) {
    reasons.push(`conflicts=${relationship.relationship_core.conflict_types.join(",")}`);
  }
  if (campaignType === "shopifixer_outreach") {
    reasons.push("motion=outreach_or_qualification");
  }
  if (campaignType === "shopifixer_close_engine") {
    reasons.push("motion=payment_close");
  }
  if (campaignType === "fulfillment_delivery") {
    reasons.push("motion=fulfillment_and_proof");
  }
  if (campaignType === "referral_expansion") {
    reasons.push("motion=referral_or_expansion");
  }
  if (campaignType === "dormant_reactivation") {
    reasons.push("motion=dormant_reactivation");
  }
  return reasons;
}

function buildCampaigns() {
  const truths = resolveTruths();
  const campaignRegistry = loadCampaignRegistry(truths.repoRoot);
  const relationships = resolveRelationships();
  const actionCandidates = resolveActionCandidates();
  const decisionEngine = getDecisionEngineReport();
  const relationshipLookup = new Map(relationships.map((relationship) => [relationship.relationship_id, relationship]));
  const offerPrices = loadMerchantOfferPrices(truths.merchantLifecycle.records || []);
  const lifecycleById = loadMerchantStages(truths.merchantLifecycle.records || []);

  const campaigns: Campaign[] = [];
  const inventory: CampaignInventoryItem[] = [];
  const campaignTypeOrder: CampaignType[] = [
    "shopifixer_outreach",
    "shopifixer_close_engine",
    "fulfillment_delivery",
    "referral_expansion",
    "dormant_reactivation",
  ];

  for (const campaignType of campaignTypeOrder) {
    const candidateRelationships = relationships.filter((relationship) => determineCampaignTypes(relationship, actionCandidates).includes(campaignType));
    if (!candidateRelationships.length) continue;

    const relationshipIds = candidateRelationships.map((relationship) => relationship.relationship_id);
    const candidateActions = actionCandidates.filter((action) => relationshipIds.includes(action.relationship_id));
    const activeActions = candidateActions.filter((action) => action.status === "ready").map((action) => action.action_id);
    const blockedActions = candidateActions.filter((action) => action.status === "blocked").map((action) => action.action_id);
    const completedActions = candidateActions.filter((action) => action.status === "done" || action.status === "stale").map((action) => action.action_id);
    const nextBestAction = candidateActions
      .filter((action) => action.status === "ready")
      .sort((a, b) => {
        const priority = (actionType: string) => {
          switch (actionType) {
            case "revenue_close":
              return 5;
            case "payment_followup_pending":
              return 4;
            case "revenue_followup":
              return 3;
            case "revenue_outreach":
              return 2;
            case "fulfillment_waiting_payment":
              return 1;
            default:
              return 0;
          }
        };
        if (priority(b.action_type) !== priority(a.action_type)) return priority(b.action_type) - priority(a.action_type);
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return a.action_id.localeCompare(b.action_id);
      })[0] || candidateActions
      .sort((a, b) => {
        const statusRank = (status: ActionCandidate["status"]) => (status === "ready" ? 3 : status === "blocked" ? 2 : 1);
        if (statusRank(b.status) !== statusRank(a.status)) return statusRank(b.status) - statusRank(a.status);
        return b.confidence - a.confidence;
      })[0] || null;

    const revenueAtStake = campaignRevenueAtStake(candidateRelationships, candidateActions, offerPrices);
    const health = campaignTypeHealth(campaignType, candidateRelationships, candidateActions);
    const confidence = campaignConfidence(candidateRelationships, candidateActions);
    const unresolvedRelationshipIds = candidateRelationships
      .filter((relationship) => ["lead_only", "contact_unknown", "unresolved_identity"].includes(relationship.resolver_state))
      .map((relationship) => relationship.relationship_id);
    const campaignConflictTypes = Array.from(
      new Set(candidateRelationships.flatMap((relationship) => relationship.relationship_core.conflict_types))
    );
    const campaignConflictNotes = Array.from(
      new Set(candidateRelationships.flatMap((relationship) => relationship.relationship_core.conflict_notes))
    );
    const registryRecord = campaignRegistry.byType.get(campaignType);

    const campaign: Campaign = {
      campaign_id: normalizeCampaignId(campaignType),
      campaign_type: campaignType,
      objective: campaignObjective(campaignType),
      health,
      relationships: relationshipIds,
      active_actions: activeActions,
      blocked_actions: blockedActions,
      completed_actions: completedActions,
      revenue_at_stake: revenueAtStake,
      next_best_action: nextBestAction ? toActionSummary(nextBestAction) : null,
      confidence,
      provenance: {
        source_files: [
          "staffordos/ui/operator-frontend/lib/operator/relationshipResolver.ts",
          "staffordos/ui/operator-frontend/lib/operator/actionResolver.ts",
          "staffordos/ui/operator-frontend/lib/operator/decisionEngineResolver.ts",
          ...(registryRecord ? ["staffordos/campaigns/campaign_registry_v1.json"] : []),
          "staffordos/revenue/revenue_truth_v1.json",
          "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json",
          "staffordos/execution/execution_log_v1.json",
          "staffordos/execution/outcome_events_v1.json",
          "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json",
        ],
        relationship_reasons: Object.fromEntries(
          candidateRelationships.map((relationship) => [relationship.relationship_id, campaignRelationshipReasons(relationship, campaignType)])
        ),
        action_reasons: Object.fromEntries(
          candidateActions.map((action) => [
            action.action_id,
            [
              `status=${action.status}`,
              `type=${action.action_type}`,
              `relationship_state=${relationshipLookup.get(action.relationship_id)?.resolver_state || "unresolved_identity"}`,
              ...(action.blocker ? [`blocker=${action.blocker}`] : []),
            ],
          ])
        ),
        conflict_types: campaignConflictTypes,
        conflict_notes: campaignConflictNotes,
        unresolved_relationship_ids: unresolvedRelationshipIds,
        decision_engine: {
          top_action_id: decisionEngine.top_action?.action_id || null,
          top_revenue_action_id: decisionEngine.top_revenue_action?.action_id || null,
          top_fulfillment_action_id: decisionEngine.top_fulfillment_action?.action_id || null,
          top_relationship_action_id: decisionEngine.top_relationship_action?.action_id || null,
          top_outcome_action_id: decisionEngine.top_outcome_action?.action_id || null,
          top_blocker_id: decisionEngine.top_blocker?.action_id || null,
          validation_ok: decisionEngine.validation.ok,
        },
      },
    };

    campaigns.push(campaign);
    inventory.push({
      campaign_id: campaign.campaign_id,
      campaign_type: campaign.campaign_type,
      relationships: campaign.relationships,
      active_actions: campaign.active_actions,
      blocked_actions: campaign.blocked_actions,
      completed_actions: campaign.completed_actions,
      reasons: Array.from(new Set(Object.values(campaign.provenance.relationship_reasons).flat())),
    });
  }

  return {
    truths,
    relationships,
    actionCandidates,
    decisionEngine,
    campaigns,
    inventory,
  };
}

function summarizeCampaignHealth(campaigns: Campaign[]) {
  return campaigns.reduce<Record<CampaignHealth, number>>(
    (acc, campaign) => {
      acc[campaign.health] += 1;
      return acc;
    },
    { healthy: 0, warm: 0, at_risk: 0, dormant: 0, unknown: 0 }
  );
}

function summarizeCampaignTypes(campaigns: Campaign[]) {
  return campaigns.reduce<Record<CampaignType, number>>(
    (acc, campaign) => {
      acc[campaign.campaign_type] += 1;
      return acc;
    },
    {
      shopifixer_outreach: 0,
      shopifixer_close_engine: 0,
      fulfillment_delivery: 0,
      referral_expansion: 0,
      dormant_reactivation: 0,
    }
  );
}

function validateResolvedCampaigns(campaigns: Campaign[]) {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const campaign of campaigns) {
    if (!campaign.campaign_id) errors.push("Missing campaign_id");
    if (seen.has(campaign.campaign_id)) errors.push(`Duplicate campaign_id: ${campaign.campaign_id}`);
    seen.add(campaign.campaign_id);
    if (!VALID_CAMPAIGN_TYPES.includes(campaign.campaign_type)) {
      errors.push(`Invalid campaign_type: ${campaign.campaign_id}`);
    }
    if (!VALID_CAMPAIGN_HEALTHS.includes(campaign.health)) {
      errors.push(`Invalid health: ${campaign.campaign_id}`);
    }
    if (!Array.isArray(campaign.relationships) || !campaign.relationships.length) {
      errors.push(`Campaign has no relationships: ${campaign.campaign_id}`);
    }
    if (typeof campaign.revenue_at_stake !== "number" || Number.isNaN(campaign.revenue_at_stake) || campaign.revenue_at_stake < 0) {
      errors.push(`Invalid revenue_at_stake: ${campaign.campaign_id}`);
    }
    if (typeof campaign.confidence !== "number" || Number.isNaN(campaign.confidence) || campaign.confidence < 0 || campaign.confidence > 1) {
      errors.push(`Invalid confidence: ${campaign.campaign_id}`);
    }
    if (campaign.next_best_action && !campaign.next_best_action.action_id) {
      errors.push(`Invalid next_best_action: ${campaign.campaign_id}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function conflictSummary(campaigns: Campaign[]) {
  const conflictCounts = new Map<string, number>();
  const conflicts = campaigns
    .filter((campaign) => campaign.provenance.conflict_types.length > 0)
    .map((campaign) => ({
      campaign_id: campaign.campaign_id,
      campaign_type: campaign.campaign_type,
      conflict_types: campaign.provenance.conflict_types,
      conflict_notes: campaign.provenance.conflict_notes,
    }));

  for (const conflict of conflicts) {
    for (const conflictType of conflict.conflict_types) {
      conflictCounts.set(conflictType, (conflictCounts.get(conflictType) || 0) + 1);
    }
  }

  return { conflicts, conflictCounts: Object.fromEntries(conflictCounts) };
}

function buildRelationshipCoverage(campaigns: Campaign[], relationships: ReturnType<typeof resolveRelationships>) {
  const covered = new Set(campaigns.flatMap((campaign) => campaign.relationships));
  const coveredRelationships = relationships.filter((relationship) => covered.has(relationship.relationship_id));
  const uncoveredRelationships = relationships.filter((relationship) => !covered.has(relationship.relationship_id));

  return {
    total_relationships: relationships.length,
    covered_relationships: coveredRelationships.length,
    coverage_percent: relationships.length ? Number(((coveredRelationships.length / relationships.length) * 100).toFixed(1)) : 0,
    covered_relationship_ids: coveredRelationships.map((relationship) => relationship.relationship_id),
    uncovered_relationship_ids: uncoveredRelationships.map((relationship) => relationship.relationship_id),
  };
}

function buildCampaignResolver() {
  const built = buildCampaigns();
  const validation = validateResolvedCampaigns(built.campaigns);
  const relationshipCoverage = buildRelationshipCoverage(built.campaigns, built.relationships);
  const typeSummary = summarizeCampaignTypes(built.campaigns);
  const healthSummary = summarizeCampaignHealth(built.campaigns);
  const revenueAtStakeByType = built.campaigns.reduce<Record<CampaignType, number>>(
    (acc, campaign) => {
      acc[campaign.campaign_type] += campaign.revenue_at_stake;
      return acc;
    },
    {
      shopifixer_outreach: 0,
      shopifixer_close_engine: 0,
      fulfillment_delivery: 0,
      referral_expansion: 0,
      dormant_reactivation: 0,
    }
  );
  const totalRevenueAtStake = Object.values(revenueAtStakeByType).reduce((sum, value) => sum + value, 0);
  const unresolvedCampaignCount = built.campaigns.filter(
    (campaign) =>
      campaign.provenance.unresolved_relationship_ids.length > 0 ||
      campaign.provenance.conflict_types.length > 0 ||
      campaign.health === "at_risk"
  ).length;
  const conflictSummaryResult = conflictSummary(built.campaigns);

  return {
    total_campaigns: built.campaigns.length,
    campaign_types: typeSummary,
    health_distribution: healthSummary,
    revenue_at_stake_total: totalRevenueAtStake,
    revenue_at_stake_by_type: revenueAtStakeByType,
    relationship_coverage: relationshipCoverage,
    unresolved_campaign_count: unresolvedCampaignCount,
    conflict_count: conflictSummaryResult.conflicts.length,
    conflicts: conflictSummaryResult.conflicts,
    campaigns: built.campaigns,
    inventory: {
      source_inventory: {
        relationship_count: built.relationships.length,
        action_count: built.actionCandidates.length,
        execution_event_count: Array.isArray(built.truths.executionTruth.events) ? built.truths.executionTruth.events.length : 0,
        outcome_event_count: Array.isArray(built.truths.outcomeTruth.events) ? built.truths.outcomeTruth.events.length : 0,
        merchant_lifecycle_record_count: Array.isArray(built.truths.merchantLifecycle.records) ? built.truths.merchantLifecycle.records.length : 0,
        fulfillment_item_count: Array.isArray(built.truths.fulfillmentTruth.items) ? built.truths.fulfillmentTruth.items.length : 0,
        revenue_bottleneck: text(built.truths.revenueTruth.current_bottleneck) || null,
      },
      natural_membership: built.inventory,
    },
    validation: {
      ok: validation.ok && built.decisionEngine.validation.ok && validateResolvedRelationships(built.relationships).ok && validateResolvedActionCandidates(built.actionCandidates).ok,
      errors: [
        ...(validation.errors || []),
        ...(built.decisionEngine.validation.errors || []),
      ],
    },
  } satisfies CampaignResolverReport;
}

export function resolveCampaigns() {
  return buildCampaignResolver().campaigns;
}

export function resolveCampaignById(id: string) {
  const normalized = normalizeCampaignId(id);
  return resolveCampaigns().find((campaign) => campaign.campaign_id === normalized || normalizeKey(campaign.campaign_id) === normalizeKey(normalized)) || null;
}

export function validateResolvedCampaignsPublic(campaigns: Campaign[]) {
  return validateResolvedCampaigns(campaigns);
}

export function getCampaignResolverReport() {
  return buildCampaignResolver();
}

export function normalizeCampaignKey(value?: string | null) {
  return normalizeKey(value);
}

export { validateResolvedCampaignsPublic as validateResolvedCampaigns };
