import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { canonicalNextActionLabel } from "./lifecycleTerminology";

type AnyRecord = Record<string, any>;

export type RelationshipFacet = AnyRecord;

export type RelationshipObject = {
  relationship_id: string;
  display_name: string;
  relationship_type: string;
  identity: {
    lead_id: string | null;
    client_id: string | null;
    merchant_id: string | null;
    merchant_shop: string | null;
    store_domain: string | null;
    domain: string | null;
    email: string | null;
    customer: string | null;
  };
  relationship_core: {
    owner: string;
    status: string;
    current_stage: string;
    next_action: string;
    contactability: string;
    relationship_health: string;
    risk_level: string;
    priority_score: number;
    last_touch_at: string | null;
    next_touch_at: string | null;
    confidence: number;
    conflict_notes: string[];
  };
  facets: {
    lead: RelationshipFacet | null;
    merchant: RelationshipFacet | null;
    client: RelationshipFacet | null;
    fulfillment: RelationshipFacet | null;
    outcome: RelationshipFacet | null;
  };
  links: {
    lead_registry_ids: string[];
    client_registry_ids: string[];
    merchant_lifecycle_ids: string[];
    fulfillment_ids: string[];
    execution_ids: string[];
    outcome_event_ids: string[];
  };
  provenance: {
    primary_source: string;
    secondary_sources: string[];
    source_keys: string[];
    confidence: number;
    conflict_notes: string[];
  };
  timeline: {
    created_at: string;
    updated_at: string;
  };
};

type LeadRegistry = {
  items?: AnyRecord[];
};

type ClientRegistry = {
  clients?: AnyRecord[];
};

type MerchantLifecycleRegistry = {
  generated_at?: string;
  records?: AnyRecord[];
  active_record_selection?: {
    merchant_id?: string | null;
  };
};

type FulfillmentTruth = {
  items?: AnyRecord[];
};

type ExecutionTruth = {
  events?: AnyRecord[];
};

type OutcomeTruth = {
  events?: AnyRecord[];
};

type RelationshipAccumulator = {
  relationship_id: string;
  display_name: string;
  relationship_type: string;
  identity: RelationshipObject["identity"];
  relationship_core: RelationshipObject["relationship_core"];
  facets: RelationshipObject["facets"];
  links: RelationshipObject["links"];
  provenance: RelationshipObject["provenance"];
  timeline: RelationshipObject["timeline"];
  aliases: Set<string>;
  source_keys: Set<string>;
  has_client: boolean;
  has_lead: boolean;
  has_merchant: boolean;
  has_fulfillment: boolean;
  has_execution: boolean;
  has_outcome: boolean;
  latest_at: string | null;
};

const SOURCES = {
  leadRegistry: "staffordos/leads/lead_registry_v1.json",
  clientRegistry: "staffordos/clients/client_registry_v1.json",
  merchantLifecycle: "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json",
  fulfillmentTruth: "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json",
  executionLog: "staffordos/execution/execution_log_v1.json",
  outcomeEvents: "staffordos/execution/outcome_events_v1.json",
} as const;

function resolveRepoRoot() {
  const cwd = process.cwd();
  const candidates = [cwd, path.resolve(cwd, "../../..")];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, SOURCES.clientRegistry))) return candidate;
  }

  return path.resolve(cwd, "../../..");
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function normalizeRelationshipKey(value?: string | null) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");

  return normalized;
}

function text(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "yes", "paid", "payment_received", "complete", "completed"].includes(normalized);
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => text(value)).filter(Boolean))];
}

function firstNonEmpty(values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = text(value);
    if (normalized) return normalized;
  }
  return null;
}

function latestTimestamp(...values: Array<string | null | undefined>) {
  const timestamps = values
    .map((value) => text(value))
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((time) => Number.isFinite(time));

  if (!timestamps.length) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function shortestNonEmpty(values: Array<string | null | undefined>) {
  const items = values.map((value) => text(value)).filter(Boolean);
  if (!items.length) return null;
  return items.sort((a, b) => a.length - b.length)[0];
}

function recordAliases(record: AnyRecord) {
  return unique([
    record.relationship_id,
    record.client_id,
    record.merchant_id,
    record.merchant_shop,
    record.store_domain,
    record.domain,
    record.email,
    record.customer,
    record.lead_id,
    record.id,
    record.name,
    record.merchant_name,
    record.lead_name,
    record.fulfillment_id,
    record.packet_id,
    record.opportunity_ref,
    record.delivery_unit_ref,
    record.action_id,
    record.send_target,
    record.execution?.send_target,
    record.contact?.email,
    record.contact?.name,
    record.contact?.role,
  ]);
}

function noteAliases(record: AnyRecord) {
  const notes = Array.isArray(record.notes) ? record.notes : [];
  return unique(
    notes.flatMap((note) => [
      note?.lead_id,
      note?.client_id,
      note?.merchant_id,
      note?.merchant_shop,
      note?.store_domain,
      note?.email,
      note?.customer,
    ])
  );
}

function outcomeState(record: AnyRecord) {
  return text(record.outcome_state || record.new_state || record.status);
}

function relationshipTypeFor(accumulator: RelationshipAccumulator) {
  const outcome = accumulator.facets.outcome || {};
  const client = accumulator.facets.client || {};
  const merchant = accumulator.facets.merchant || {};
  const lead = accumulator.facets.lead || {};
  const outcomeLabel = text(outcome.outcome_state || outcome.new_state).toLowerCase();

  if (outcomeLabel.includes("at risk")) return "at_risk";
  if (outcomeLabel.includes("dormant")) return "dormant";
  if (outcomeLabel.includes("referral")) return "client";
  if (outcomeLabel.includes("expansion")) return "client";
  if (client.client_id || client.deal || toBoolean(client.revenue?.shopifixer_collected)) return "client";
  if (merchant.merchant_id || merchant.payment_status || merchant.offer_status) return "merchant";
  if (lead.lead_id) return "lead";
  return "relationship";
}

function relationshipHealthFor(accumulator: RelationshipAccumulator) {
  const outcome = accumulator.facets.outcome || {};
  const client = accumulator.facets.client || {};
  const merchant = accumulator.facets.merchant || {};
  const lead = accumulator.facets.lead || {};
  const label = text(outcome.outcome_state || outcome.new_state).toLowerCase();

  if (label.includes("at risk")) return "at_risk";
  if (label.includes("dormant")) return "dormant";
  if (label.includes("referral")) return "healthy";
  if (label.includes("expansion")) return "healthy";
  if (merchant.payment_status === "waiting_for_payment" || client.deal?.payment_status === "unpaid") return "warm";
  if (lead.lead_id && !client.client_id) return "warm";
  if (toBoolean(client.blocker_detection?.blocked) || toBoolean(client.lifecycle?.blocked)) return "at_risk";
  return "healthy";
}

function relationshipStatusFor(accumulator: RelationshipAccumulator) {
  const outcome = accumulator.facets.outcome || {};
  const label = text(outcome.outcome_state || outcome.new_state).toLowerCase();
  if (label.includes("at risk")) return "at_risk";
  if (label.includes("dormant")) return "dormant";
  if (label.includes("satisfied")) return "active";
  if (label.includes("referral")) return "active";
  if (label.includes("expansion")) return "active";
  if (accumulator.has_fulfillment && !accumulator.relationship_core.next_action) return "blocked";
  return accumulator.has_client ? "active" : accumulator.has_lead ? "open" : "unknown";
}

function riskLevelFor(accumulator: RelationshipAccumulator) {
  const notes = accumulator.relationship_core.conflict_notes;
  const outcome = accumulator.facets.outcome || {};
  const fulfillment = accumulator.facets.fulfillment || {};
  const client = accumulator.facets.client || {};
  const label = text(outcome.outcome_state || outcome.new_state).toLowerCase();

  if (label.includes("at risk")) return "high";
  if (notes.length > 2 || toBoolean(client.blocker_detection?.blocked) || toBoolean(fulfillment.risk_or_limitation) || toBoolean(fulfillment.remaining_limitations)) {
    return "high";
  }
  if (notes.length > 0 || accumulator.relationship_core.status === "blocked") return "medium";
  return "low";
}

function contactabilityFor(accumulator: RelationshipAccumulator) {
  const lead = accumulator.facets.lead || {};
  const client = accumulator.facets.client || {};
  const email = text(lead.contact?.email || client.contact?.email || accumulator.identity.email);
  if (email) return "reachable";
  return accumulator.has_lead || accumulator.has_client ? "unknown" : "unreachable";
}

function confidenceFor(accumulator: RelationshipAccumulator) {
  let confidence = 0.25;
  if (accumulator.has_lead) confidence += 0.15;
  if (accumulator.has_client) confidence += 0.25;
  if (accumulator.has_merchant) confidence += 0.15;
  if (accumulator.has_fulfillment) confidence += 0.1;
  if (accumulator.has_execution) confidence += 0.05;
  if (accumulator.has_outcome) confidence += 0.1;
  confidence -= Math.min(0.3, accumulator.relationship_core.conflict_notes.length * 0.08);
  return Math.max(0.15, Math.min(1, Number(confidence.toFixed(2))));
}

function addConflict(accumulator: RelationshipAccumulator, note: string) {
  if (!accumulator.relationship_core.conflict_notes.includes(note)) {
    accumulator.relationship_core.conflict_notes.push(note);
  }
}

function touchAccumulator(accumulator: RelationshipAccumulator, at?: string | null) {
  const latest = latestTimestamp(accumulator.latest_at, at);
  accumulator.latest_at = latest;
  accumulator.timeline.updated_at = latest || accumulator.timeline.updated_at;
}

function createAccumulator(canonicalKey: string, displayName: string): RelationshipAccumulator {
  return {
    relationship_id: `rel_${canonicalKey}`,
    display_name: displayName || canonicalKey,
    relationship_type: "relationship",
    identity: {
      lead_id: null,
      client_id: null,
      merchant_id: null,
      merchant_shop: null,
      store_domain: null,
      domain: null,
      email: null,
      customer: null,
    },
    relationship_core: {
      owner: "Ross",
      status: "unknown",
      current_stage: "unknown",
      next_action: "Review relationship",
      contactability: "unknown",
      relationship_health: "healthy",
      risk_level: "low",
      priority_score: 0,
      last_touch_at: null,
      next_touch_at: null,
      confidence: 0.25,
      conflict_notes: [],
    },
    facets: {
      lead: null,
      merchant: null,
      client: null,
      fulfillment: null,
      outcome: null,
    },
    links: {
      lead_registry_ids: [],
      client_registry_ids: [],
      merchant_lifecycle_ids: [],
      fulfillment_ids: [],
      execution_ids: [],
      outcome_event_ids: [],
    },
    provenance: {
      primary_source: "unknown",
      secondary_sources: [],
      source_keys: [],
      confidence: 0.25,
      conflict_notes: [],
    },
    timeline: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    aliases: new Set<string>(),
    source_keys: new Set<string>(),
    has_client: false,
    has_lead: false,
    has_merchant: false,
    has_fulfillment: false,
    has_execution: false,
    has_outcome: false,
    latest_at: null,
  };
}

function chooseRelationship(accumulator: RelationshipAccumulator, record: AnyRecord, candidateKey: string, sourceKey: string) {
  accumulator.aliases.add(candidateKey);
  accumulator.source_keys.add(sourceKey);
  touchAccumulator(accumulator, record.updated_at || record.created_at || record.generated_at || record.completed_at || record.timestamp);

  if (!accumulator.provenance.secondary_sources.includes(sourceKey)) {
    accumulator.provenance.secondary_sources.push(sourceKey);
  }
}

function resolveOrCreate(
  buckets: Map<string, RelationshipAccumulator>,
  aliases: Map<string, string>,
  candidateKeys: string[],
  displayName: string
) {
  for (const key of candidateKeys) {
    const normalized = normalizeRelationshipKey(key);
    const existingKey = aliases.get(normalized);
    if (existingKey) {
      return buckets.get(existingKey) || null;
    }
  }

  const canonical = normalizeRelationshipKey(candidateKeys.find(Boolean) || displayName || "unknown");
  if (!canonical) return null;

  const existing = buckets.get(canonical);
  if (existing) return existing;

  const accumulator = createAccumulator(canonical, displayName || canonical);
  buckets.set(canonical, accumulator);
  aliases.set(canonical, canonical);
  return accumulator;
}

function registerAliases(aliases: Map<string, string>, canonicalKey: string, values: string[]) {
  for (const value of values) {
    const normalized = normalizeRelationshipKey(value);
    if (normalized) {
      aliases.set(normalized, canonicalKey);
    }
  }
}

function mergeLead(record: AnyRecord, bucket: RelationshipAccumulator, sourceKey: string, aliases: Map<string, string>) {
  bucket.has_lead = true;
  bucket.facets.lead = {
    lead_id: text(record.lead_id || record.id),
    name: text(record.name),
    domain: text(record.domain),
    product: text(record.product),
    lifecycle_stage: text(record.lifecycle_stage || record.status?.current_stage),
    status: record.status || {},
    score: toNumber(record.score ?? record.conversion_score ?? record.status?.conversion_score),
    contact: record.contact || {},
    engagement: record.engagement || {},
    routing: record.routing || {},
    refs: record.refs || {},
    execution: record.execution || {},
    payment: record.payment || {},
    next_action: record.next_action || null,
    updated_at: text(record.updated_at),
    created_at: text(record.created_at),
  };

  const aliasesToAdd = recordAliases(record).concat(noteAliases(record));
  if (bucket.facets.lead.lead_id) bucket.identity.lead_id = bucket.identity.lead_id || bucket.facets.lead.lead_id;
  if (record.contact?.email || record.email) bucket.identity.email = bucket.identity.email || text(record.contact?.email || record.email);
  if (record.domain) bucket.identity.domain = bucket.identity.domain || text(record.domain);

  if (!bucket.display_name || bucket.display_name === bucket.relationship_id.replace(/^rel_/, "")) {
    bucket.display_name = text(record.name || record.domain || record.lead_id || bucket.display_name);
  }

  registerAliases(aliases, bucket.relationship_id, aliasesToAdd);
  chooseRelationship(bucket, record, bucket.relationship_id, sourceKey);
}

function mergeClient(record: AnyRecord, bucket: RelationshipAccumulator, sourceKey: string, aliases: Map<string, string>) {
  bucket.has_client = true;
  bucket.facets.client = {
    client_id: text(record.client_id),
    merchant_shop: text(record.merchant_shop),
    status: text(record.status),
    lifecycle: record.lifecycle || {},
    lifecycle_stage: text(record.lifecycle?.stage || record.lifecycle_stage || record.decision_trace?.lifecycle_stage),
    payment_status: text(record.deal?.payment_status || record.payment_status),
    deal: record.deal || {},
    business: record.business || {},
    shopifixer: record.shopifixer || {},
    abando: record.abando || {},
    priority_score: record.priority_score || {},
    blocker_detection: record.blocker_detection || {},
    decision_trace: record.decision_trace || {},
    close_engine: record.close_engine || {},
    next_action: record.next_action || {},
    notes: record.notes || [],
    contact: record.contact || {},
  };

  const aliasesToAdd = recordAliases(record).concat(noteAliases(record));
  if (record.client_id) bucket.identity.client_id = bucket.identity.client_id || text(record.client_id);
  if (record.merchant_shop) bucket.identity.merchant_shop = bucket.identity.merchant_shop || text(record.merchant_shop);
  if (record.contact?.email) bucket.identity.email = bucket.identity.email || text(record.contact.email);
  if (record.contact?.name) bucket.identity.customer = bucket.identity.customer || text(record.contact.name);

  const leadIdsFromNotes = Array.isArray(record.notes)
    ? record.notes.map((note) => text(note?.lead_id)).filter(Boolean)
    : [];
  if (leadIdsFromNotes.length) {
    bucket.identity.lead_id = bucket.identity.lead_id || leadIdsFromNotes[0];
  }

  if (!bucket.display_name || bucket.display_name === bucket.relationship_id.replace(/^rel_/, "")) {
    bucket.display_name = text(record.merchant_shop || record.client_id || bucket.display_name);
  }

  registerAliases(aliases, bucket.relationship_id, aliasesToAdd);
  chooseRelationship(bucket, record, bucket.relationship_id, sourceKey);

  for (const leadId of leadIdsFromNotes) {
    registerAliases(aliases, bucket.relationship_id, [leadId]);
    bucket.links.lead_registry_ids.push(leadId);
  }
}

function mergeMerchantLifecycle(record: AnyRecord, bucket: RelationshipAccumulator, sourceKey: string, aliases: Map<string, string>) {
  bucket.has_merchant = true;
  bucket.facets.merchant = {
    merchant_id: text(record.merchant_id),
    client_id: text(record.client_id),
    merchant_shop: text(record.merchant_shop),
    store_domain: text(record.store_domain),
    current_stage: text(record.current_stage),
    next_required_action: text(record.next_required_action),
    readiness_score: toNumber(record.readiness_score),
    offer_status: text(record.offer_status),
    offer_price: toNumber(record.offer_price),
    payment_status: text(record.payment_status),
    fulfillment_status: text(record.fulfillment_status),
    proof_package_status: text(record.proof_package_status),
    case_study_status: text(record.case_study_status),
    review_status: text(record.review_status),
    referral_status: text(record.referral_status),
    revenue_status: text(record.revenue_status),
    audit: record.audit || {},
    offer: record.offer || {},
    payment: record.payment || {},
    fulfillment: record.fulfillment || {},
    lifecycle_lane: record.lifecycle_lane || {},
    field_sources: record.field_sources || {},
    source_files: record.source_files || [],
  };

  const aliasesToAdd = recordAliases(record);
  if (record.merchant_id) bucket.identity.merchant_id = bucket.identity.merchant_id || text(record.merchant_id);
  if (record.client_id) bucket.identity.client_id = bucket.identity.client_id || text(record.client_id);
  if (record.merchant_shop) bucket.identity.merchant_shop = bucket.identity.merchant_shop || text(record.merchant_shop);
  if (record.store_domain) bucket.identity.store_domain = bucket.identity.store_domain || text(record.store_domain);

  if (!bucket.display_name || bucket.display_name === bucket.relationship_id.replace(/^rel_/, "")) {
    bucket.display_name = text(record.merchant_shop || record.store_domain || record.client_id || record.merchant_id || bucket.display_name);
  }

  registerAliases(aliases, bucket.relationship_id, aliasesToAdd);
  chooseRelationship(bucket, record, bucket.relationship_id, sourceKey);
}

function mergeFulfillment(record: AnyRecord, bucket: RelationshipAccumulator, sourceKey: string, aliases: Map<string, string>) {
  bucket.has_fulfillment = true;
  bucket.facets.fulfillment = {
    fulfillment_id: text(record.fulfillment_id),
    packet_id: text(record.packet_id),
    client_id: text(record.client_id),
    store_domain: text(record.store_domain),
    opportunity_ref: text(record.opportunity_ref),
    delivery_unit_ref: text(record.delivery_unit_ref),
    payment_status: text(record.payment_status),
    fulfillment_status: text(record.fulfillment_status),
    execution_status: text(record.execution_status),
    proof_status: text(record.proof_status),
    completion_status: text(record.completion_status),
    before_evidence_status: text(record.before_evidence_status),
    after_evidence_status: text(record.after_evidence_status),
    proof_package_status: text(record.proof_package_status),
    review_status: text(record.review_status),
    referral_status: text(record.referral_status),
    case_study_status: text(record.case_study_status),
    risk_or_limitation: text(record.risk_or_limitation),
    remaining_limitations: text(record.remaining_limitations),
    merchant_proof_package_ready: toBoolean(record.merchant_proof_package_ready),
    completed_at: text(record.completed_at),
    source_files: record.source_files || [],
  };

  const aliasesToAdd = recordAliases(record);
  if (record.fulfillment_id) bucket.links.fulfillment_ids.push(text(record.fulfillment_id));
  if (record.client_id) bucket.identity.client_id = bucket.identity.client_id || text(record.client_id);
  if (record.store_domain) bucket.identity.store_domain = bucket.identity.store_domain || text(record.store_domain);

  if (!bucket.display_name || bucket.display_name === bucket.relationship_id.replace(/^rel_/, "")) {
    bucket.display_name = text(record.merchant_name || record.client_id || record.store_domain || bucket.display_name);
  }

  registerAliases(aliases, bucket.relationship_id, aliasesToAdd);
  chooseRelationship(bucket, record, bucket.relationship_id, sourceKey);
}

function mergeExecution(record: AnyRecord, bucket: RelationshipAccumulator, sourceKey: string, aliases: Map<string, string>) {
  bucket.has_execution = true;
  bucket.facets.outcome = bucket.facets.outcome || {};
  bucket.facets.outcome = {
    ...(bucket.facets.outcome || {}),
    execution_id: text(record.execution_id),
    timestamp: text(record.timestamp),
    customer: text(record.customer),
    action_type: text(record.action_type),
    stage: text(record.stage),
    outcome: text(record.outcome),
    revenue_impact: text(record.revenue_impact),
    notes: text(record.notes),
  };

  const aliasValues = unique([record.customer, record.customer_name, record.domain, record.email]);
  registerAliases(aliases, bucket.relationship_id, aliasValues);
  if (record.execution_id) bucket.links.execution_ids.push(text(record.execution_id));
  if (!bucket.identity.customer) bucket.identity.customer = text(record.customer);
  if (!bucket.display_name || bucket.display_name === bucket.relationship_id.replace(/^rel_/, "")) {
    bucket.display_name = text(record.customer || bucket.display_name);
  }

  chooseRelationship(bucket, record, bucket.relationship_id, sourceKey);
}

function mergeOutcome(record: AnyRecord, bucket: RelationshipAccumulator, sourceKey: string, aliases: Map<string, string>) {
  bucket.has_outcome = true;
  bucket.facets.outcome = {
    ...(bucket.facets.outcome || {}),
    event_id: text(record.event_id),
    timestamp: text(record.timestamp),
    customer: text(record.customer),
    previous_state: text(record.previous_state),
    new_state: text(record.new_state),
    trigger: text(record.trigger),
    confidence: Number.isFinite(Number(record.confidence)) ? Number(record.confidence) : 0,
  };

  const aliasValues = unique([record.customer, record.customer_name, record.domain, record.email]);
  registerAliases(aliases, bucket.relationship_id, aliasValues);
  if (record.event_id) bucket.links.outcome_event_ids.push(text(record.event_id));
  if (!bucket.identity.customer) bucket.identity.customer = text(record.customer);
  if (!bucket.display_name || bucket.display_name === bucket.relationship_id.replace(/^rel_/, "")) {
    bucket.display_name = text(record.customer || bucket.display_name);
  }

  chooseRelationship(bucket, record, bucket.relationship_id, sourceKey);
}

function addConflictNotes(bucket: RelationshipAccumulator) {
  const lead = bucket.facets.lead || {};
  const client = bucket.facets.client || {};
  const merchant = bucket.facets.merchant || {};
  const fulfillment = bucket.facets.fulfillment || {};
  const outcome = bucket.facets.outcome || {};

  const stageValues = unique([
    lead.lifecycle_stage,
    lead.status?.current_stage,
    client.lifecycle_stage,
    client.decision_trace?.lifecycle_stage,
    merchant.current_stage,
    merchant.offer_status,
    merchant.payment_status,
    fulfillment.fulfillment_status,
    fulfillment.execution_status,
    fulfillment.proof_status,
    fulfillment.completion_status,
    outcome.previous_state,
    outcome.new_state,
  ]);
  if (stageValues.length > 1) {
    addConflict(bucket, `Stage mismatch: ${stageValues.join(" | ")}`);
  }

  const paymentValues = unique([
    client.payment_status,
    merchant.payment_status,
    fulfillment.payment_status,
  ]);
  if (paymentValues.length > 1) {
    addConflict(bucket, `Payment mismatch: ${paymentValues.join(" | ")}`);
  }

  const emailValues = unique([
    lead.contact?.email,
    client.contact?.email,
    bucket.identity.email,
  ]);
  if (emailValues.length > 1) {
    addConflict(bucket, `Email mismatch: ${emailValues.join(" | ")}`);
  }

  const leadIds = unique(bucket.links.lead_registry_ids);
  const clientIds = unique(bucket.links.client_registry_ids);
  const merchantIds = unique(bucket.links.merchant_lifecycle_ids);
  if (leadIds.length > 1) {
    addConflict(bucket, `Multiple lead IDs mapped: ${leadIds.join(" | ")}`);
  }
  if (clientIds.length > 1) {
    addConflict(bucket, `Multiple client IDs mapped: ${clientIds.join(" | ")}`);
  }
  if (merchantIds.length > 1) {
    addConflict(bucket, `Multiple merchant lifecycle IDs mapped: ${merchantIds.join(" | ")}`);
  }
}

function finalizeAccumulator(bucket: RelationshipAccumulator): RelationshipObject {
  addConflictNotes(bucket);

  const lead = bucket.facets.lead || {};
  const client = bucket.facets.client || {};
  const merchant = bucket.facets.merchant || {};
  const fulfillment = bucket.facets.fulfillment || {};
  const outcome = bucket.facets.outcome || {};

  const displayName = firstNonEmpty([
    bucket.identity.client_id,
    bucket.identity.merchant_shop,
    bucket.identity.store_domain,
    bucket.identity.lead_id,
    bucket.identity.customer,
    lead.name,
    client.merchant_shop,
    merchant.merchant_shop,
    fulfillment.store_domain,
  ]) || bucket.display_name;

  const currentStage = firstNonEmpty([
    text(merchant.current_stage),
    text(client.lifecycle_stage),
    text(lead.lifecycle_stage),
    text(fulfillment.fulfillment_status),
    text(outcome.new_state || outcome.previous_state),
  ]) || "unknown";

  const nextAction = firstNonEmpty([
    merchant.next_required_action,
    client.next_action?.instructions,
    lead.next_action?.instructions,
    fulfillment.risk_or_limitation,
    fulfillment.remaining_limitations,
  ]) || canonicalNextActionLabel("Review relationship");

  const lastTouchAt = latestTimestamp(
    lead.updated_at,
    client.next_action?.updated_at,
    merchant.field_sources?.updated_at,
    fulfillment.completed_at,
    executionTimestamp(outcome),
    outcome.timestamp,
    bucket.timeline.updated_at
  );
  const nextTouchAt = firstNonEmpty([
    client.next_action?.due_at,
    lead.next_action?.due_at,
    merchant.next_required_action,
  ]);

  const confidence = confidenceFor(bucket);
  const relationshipHealth = relationshipHealthFor(bucket);
  const status = relationshipStatusFor(bucket);
  const riskLevel = riskLevelFor(bucket);
  const relationshipType = relationshipTypeFor(bucket);

  const sourceKeys = unique([
    ...Array.from(bucket.source_keys),
    ...bucket.links.lead_registry_ids,
    ...bucket.links.client_registry_ids,
    ...bucket.links.merchant_lifecycle_ids,
    ...bucket.links.fulfillment_ids,
    ...bucket.links.execution_ids,
    ...bucket.links.outcome_event_ids,
  ]);

  const primarySource = bucket.has_client
    ? "client_registry_v1.json"
    : bucket.has_merchant
      ? "merchant_lifecycle_registry_v1.json"
      : bucket.has_fulfillment
        ? "shopifixer_fulfillment_truth_v1.json"
        : bucket.has_lead
          ? "lead_registry_v1.json"
          : bucket.has_outcome
            ? "outcome_events_v1.json"
            : bucket.has_execution
              ? "execution_log_v1.json"
              : "unknown";

  const secondarySources = unique([
    bucket.has_lead ? "lead_registry_v1.json" : null,
    bucket.has_client ? "client_registry_v1.json" : null,
    bucket.has_merchant ? "merchant_lifecycle_registry_v1.json" : null,
    bucket.has_fulfillment ? "shopifixer_fulfillment_truth_v1.json" : null,
    bucket.has_execution ? "execution_log_v1.json" : null,
    bucket.has_outcome ? "outcome_events_v1.json" : null,
  ]).filter((value) => value !== primarySource);

  const conflictNotes = unique([
    ...bucket.relationship_core.conflict_notes,
    ...(bucket.identity.lead_id && bucket.identity.client_id && bucket.identity.lead_id === bucket.identity.client_id ? [] : []),
  ]);

  const timelineCreated = bucket.timeline.created_at || new Date().toISOString();
  const timelineUpdated = bucket.latest_at || bucket.timeline.updated_at || timelineCreated;

  const merchantId = bucket.identity.merchant_id || bucket.identity.client_id || bucket.identity.merchant_shop || bucket.identity.store_domain || null;

  const resolvedRelationship: RelationshipObject = {
    relationship_id: bucket.relationship_id,
    display_name: displayName,
    relationship_type: relationshipType,
    identity: {
      lead_id: bucket.identity.lead_id,
      client_id: bucket.identity.client_id,
      merchant_id: merchantId,
      merchant_shop: bucket.identity.merchant_shop,
      store_domain: bucket.identity.store_domain,
      domain: bucket.identity.domain,
      email: bucket.identity.email,
      customer: bucket.identity.customer,
    },
    relationship_core: {
      owner: bucket.relationship_core.owner,
      status,
      current_stage: currentStage,
      next_action: nextAction,
      contactability: contactabilityFor(bucket),
      relationship_health: relationshipHealth,
      risk_level: riskLevel,
      priority_score: toNumber(client.priority_score?.total || client.priority_score || merchant.readiness_score || lead.score),
      last_touch_at: lastTouchAt,
      next_touch_at: nextTouchAt,
      confidence,
      conflict_notes: conflictNotes,
    },
    facets: {
      lead: bucket.facets.lead,
      merchant: bucket.facets.merchant,
      client: bucket.facets.client,
      fulfillment: bucket.facets.fulfillment,
      outcome: bucket.facets.outcome,
    },
    links: {
      lead_registry_ids: unique(bucket.links.lead_registry_ids),
      client_registry_ids: unique(bucket.links.client_registry_ids),
      merchant_lifecycle_ids: unique(bucket.links.merchant_lifecycle_ids),
      fulfillment_ids: unique(bucket.links.fulfillment_ids),
      execution_ids: unique(bucket.links.execution_ids),
      outcome_event_ids: unique(bucket.links.outcome_event_ids),
    },
    provenance: {
      primary_source: primarySource,
      secondary_sources: secondarySources,
      source_keys: sourceKeys,
      confidence,
      conflict_notes: conflictNotes,
    },
    timeline: {
      created_at: timelineCreated,
      updated_at: timelineUpdated,
    },
  };

  return resolvedRelationship;
}

function executionTimestamp(outcome: AnyRecord) {
  return text(outcome.timestamp);
}

function buildRelationshipBuckets() {
  const repoRoot = resolveRepoRoot();
  const leadRegistry = readJson<LeadRegistry>(path.join(repoRoot, SOURCES.leadRegistry), { items: [] });
  const clientRegistry = readJson<ClientRegistry>(path.join(repoRoot, SOURCES.clientRegistry), { clients: [] });
  const merchantLifecycle = readJson<MerchantLifecycleRegistry>(path.join(repoRoot, SOURCES.merchantLifecycle), { records: [] });
  const fulfillmentTruth = readJson<FulfillmentTruth>(path.join(repoRoot, SOURCES.fulfillmentTruth), { items: [] });
  const executionTruth = readJson<ExecutionTruth>(path.join(repoRoot, SOURCES.executionLog), { events: [] });
  const outcomeTruth = readJson<OutcomeTruth>(path.join(repoRoot, SOURCES.outcomeEvents), { events: [] });

  const buckets = new Map<string, RelationshipAccumulator>();
  const aliases = new Map<string, string>();

  function getBucket(candidateKeys: string[], displayName: string) {
    return resolveOrCreate(buckets, aliases, candidateKeys, displayName);
  }

  for (const client of Array.isArray(clientRegistry.clients) ? clientRegistry.clients : []) {
    const candidateKeys = unique([
      client.client_id,
      client.merchant_shop,
      client.shop,
      client.domain,
      client.contact?.email,
      ...noteAliases(client),
    ]);
    const displayName = text(client.merchant_shop || client.client_id || client.contact?.email || "Unknown client");
    const bucket = getBucket(candidateKeys, displayName);
    if (!bucket) continue;

    mergeClient(client, bucket, SOURCES.clientRegistry, aliases);
    registerAliases(aliases, bucket.relationship_id, candidateKeys);
    if (client.client_id) bucket.links.client_registry_ids.push(text(client.client_id));
  }

  for (const record of Array.isArray(merchantLifecycle.records) ? merchantLifecycle.records : []) {
    const candidateKeys = unique([
      record.client_id,
      record.merchant_id,
      record.merchant_shop,
      record.store_domain,
      ...recordAliases(record),
    ]);
    const displayName = text(record.merchant_shop || record.store_domain || record.client_id || record.merchant_id || "Unknown merchant");
    const bucket = getBucket(candidateKeys, displayName);
    if (!bucket) continue;

    mergeMerchantLifecycle(record, bucket, SOURCES.merchantLifecycle, aliases);
    registerAliases(aliases, bucket.relationship_id, candidateKeys);
    if (record.merchant_id) bucket.links.merchant_lifecycle_ids.push(text(record.merchant_id));
    if (record.client_id) bucket.links.client_registry_ids.push(text(record.client_id));
  }

  for (const item of Array.isArray(fulfillmentTruth.items) ? fulfillmentTruth.items : []) {
    const candidateKeys = unique([
      item.client_id,
      item.merchant_name,
      item.store_domain,
      item.fulfillment_id,
      item.delivery_unit_ref,
      item.opportunity_ref,
      item.packet_id,
      ...recordAliases(item),
    ]);
    const displayName = text(item.merchant_name || item.store_domain || item.client_id || item.fulfillment_id || "Unknown fulfillment");
    const bucket = getBucket(candidateKeys, displayName);
    if (!bucket) continue;

    mergeFulfillment(item, bucket, SOURCES.fulfillmentTruth, aliases);
    registerAliases(aliases, bucket.relationship_id, candidateKeys);
    if (item.client_id) bucket.links.client_registry_ids.push(text(item.client_id));
    if (item.fulfillment_id) bucket.links.fulfillment_ids.push(text(item.fulfillment_id));
  }

  for (const lead of Array.isArray(leadRegistry.items) ? leadRegistry.items : []) {
    const candidateKeys = unique([
      lead.lead_id,
      lead.id,
      lead.domain,
      lead.name,
      lead.contact?.email,
      lead.execution?.send_target,
      ...recordAliases(lead),
    ]);
    const displayName = text(lead.name || lead.domain || lead.lead_id || lead.id || "Unknown lead");
    const bucket = getBucket(candidateKeys, displayName);
    if (!bucket) continue;

    mergeLead(lead, bucket, SOURCES.leadRegistry, aliases);
    registerAliases(aliases, bucket.relationship_id, candidateKeys);
    if (lead.lead_id || lead.id) bucket.links.lead_registry_ids.push(text(lead.lead_id || lead.id));
  }

  for (const event of Array.isArray(executionTruth.events) ? executionTruth.events : []) {
    const candidateKeys = unique([event.customer, event.domain, event.email, ...recordAliases(event)]);
    const displayName = text(event.customer || "Unknown execution customer");
    const bucket = getBucket(candidateKeys, displayName);
    if (!bucket) continue;

    mergeExecution(event, bucket, SOURCES.executionLog, aliases);
    registerAliases(aliases, bucket.relationship_id, candidateKeys);
    if (event.execution_id) bucket.links.execution_ids.push(text(event.execution_id));
  }

  for (const event of Array.isArray(outcomeTruth.events) ? outcomeTruth.events : []) {
    const candidateKeys = unique([event.customer, event.domain, event.email, ...recordAliases(event)]);
    const displayName = text(event.customer || "Unknown outcome customer");
    const bucket = getBucket(candidateKeys, displayName);
    if (!bucket) continue;

    mergeOutcome(event, bucket, SOURCES.outcomeEvents, aliases);
    registerAliases(aliases, bucket.relationship_id, candidateKeys);
    if (event.event_id) bucket.links.outcome_event_ids.push(text(event.event_id));
  }

  return { repoRoot, buckets, aliases };
}

export function resolveRelationships() {
  const { buckets } = buildRelationshipBuckets();
  const relationships = [...buckets.values()].map(finalizeAccumulator);

  return relationships.sort((a, b) => {
    const priorityDelta = (b.relationship_core.priority_score || 0) - (a.relationship_core.priority_score || 0);
    if (priorityDelta !== 0) return priorityDelta;
    return a.relationship_id.localeCompare(b.relationship_id);
  });
}

export function resolveRelationshipById(id: string) {
  const normalized = normalizeRelationshipKey(id);
  if (!normalized) return null;

  return resolveRelationships().find((relationship) => {
    const keys = unique([
      relationship.relationship_id,
      relationship.identity.client_id,
      relationship.identity.merchant_id,
      relationship.identity.merchant_shop,
      relationship.identity.store_domain,
      relationship.identity.lead_id,
      relationship.identity.domain,
      relationship.identity.email,
      relationship.identity.customer,
    ]);

    return keys.some((value) => normalizeRelationshipKey(value) === normalized);
  }) || null;
}

export function validateResolvedRelationships(relationships: RelationshipObject[]) {
  const issues: string[] = [];

  for (const relationship of relationships) {
    if (!relationship.relationship_id) issues.push("Missing relationship_id");
    if (!relationship.identity.client_id && !relationship.identity.lead_id && !relationship.identity.customer) {
      issues.push(`Relationship ${relationship.relationship_id} is missing identity anchors.`);
    }
    if (!relationship.display_name) issues.push(`Relationship ${relationship.relationship_id} is missing display_name.`);
    if (!relationship.provenance.primary_source) issues.push(`Relationship ${relationship.relationship_id} is missing primary_source.`);
    if (relationship.provenance.confidence < 0.25 || relationship.provenance.confidence > 1) {
      issues.push(`Relationship ${relationship.relationship_id} has invalid confidence ${relationship.provenance.confidence}.`);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
