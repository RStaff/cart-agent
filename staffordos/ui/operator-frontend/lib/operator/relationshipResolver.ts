import fs from "node:fs";
import path from "node:path";

type ResolverState = "resolved" | "lead_only" | "contact_unknown" | "operational_conflict" | "unresolved_identity";
type ConflictType = "stage_conflict" | "payment_conflict" | "identity_conflict" | "contact_conflict";
type FacetName = "lead" | "client" | "merchant" | "fulfillment" | "execution" | "outcome";

type SourceMatchReasons = Record<FacetName, string[]>;

type RelationshipFacet = {
  source_match_reasons: string[];
  source_records: string[];
};

type RelationshipObject = {
  relationship_id: string;
  display_name: string;
  relationship_type: "lead" | "client" | "merchant" | "referral_source" | "partner";
  resolver_state: ResolverState;
  identity: {
    lead_id: string | null;
    client_id: string | null;
    merchant_id: string | null;
    merchant_shop: string | null;
    store_domain: string | null;
    domain: string | null;
    email: string | null;
    aliases: string[];
  };
  relationship_core: {
    owner: string;
    status: "resolved" | "lead_only" | "contact_unknown" | "operational_conflict" | "unresolved_identity";
    current_stage: string | null;
    current_stage_source: string | null;
    next_action: string | null;
    next_action_source: string | null;
    next_touch_at: string | null;
    contactability: "reachable" | "unknown";
    relationship_health: "healthy" | "warm" | "dormant" | "at_risk" | "unknown";
    risk_level: "low" | "medium" | "high" | "unknown";
    priority_score: number;
    confidence: number;
    conflict_types: ConflictType[];
    conflict_notes: string[];
  };
  facets: {
    lead: RelationshipFacet & {
      lead_id: string | null;
      campaign_id: string | null;
      name: string | null;
      domain: string | null;
      email: string | null;
      current_stage: string | null;
      next_action: string | null;
      status: string | null;
      score: number | null;
      temperature: string | null;
      sent: boolean;
      replied: boolean;
      blocked: boolean;
    };
    client: RelationshipFacet & {
      client_id: string | null;
      contact_email: string | null;
      current_stage: string | null;
      next_action: string | null;
      payment_status: string | null;
      closed_at: string | null;
      lifetime_value: number | null;
      followup_ready: boolean;
    };
    merchant: RelationshipFacet & {
      merchant_id: string | null;
      merchant_shop: string | null;
      store_domain: string | null;
      current_stage: string | null;
      next_required_action: string | null;
      readiness_score: number | null;
      offer_status: string | null;
      payment_status: string | null;
      fulfillment_status: string | null;
      proof_package_status: string | null;
      case_study_status: string | null;
      referral_status: string | null;
      revenue_status: string | null;
    };
    fulfillment: RelationshipFacet & {
      fulfillment_id: string | null;
      client_id: string | null;
      store_domain: string | null;
      payment_status: string | null;
      fulfillment_status: string | null;
      proof_status: string | null;
      completion_status: string | null;
      before_evidence_status: string | null;
      after_evidence_status: string | null;
      proof_package_status: string | null;
      completed_at: string | null;
      merchant_proof_package_ready: boolean;
      remaining_limitations: string | null;
      risk_or_limitation: string | null;
    };
    execution: RelationshipFacet & {
      execution_id: string | null;
      timestamp: string | null;
      operator: string | null;
      action_type: string | null;
      stage: string | null;
      outcome: string | null;
      revenue_impact: string | null;
      customer: string | null;
    };
    outcome: RelationshipFacet & {
      event_id: string | null;
      timestamp: string | null;
      customer: string | null;
      previous_state: string | null;
      new_state: string | null;
      trigger: string | null;
      confidence: number | null;
    };
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
    source_match_reasons: SourceMatchReasons;
    conflict_types: ConflictType[];
    conflict_notes: string[];
    confidence: number;
  };
  timeline: {
    created_at: string | null;
    updated_at: string | null;
    last_execution_at: string | null;
    last_outcome_at: string | null;
  };
};

type LeadRecord = Record<string, any>;
type ClientRecord = Record<string, any>;
type MerchantLifecycleRecord = Record<string, any>;
type FulfillmentRecord = Record<string, any>;
type ExecutionRecord = Record<string, any>;
type OutcomeRecord = Record<string, any>;

type RawGroupRecord = {
  source: "lead" | "client" | "merchant" | "fulfillment" | "execution" | "outcome";
  id: string;
  raw: Record<string, any>;
  keys: string[];
  created_at: string | null;
  updated_at: string | null;
};

type RelationshipGroup = {
  key: string;
  records: RawGroupRecord[];
};

type ResolverValidation = {
  ok: boolean;
  errors: string[];
};

const VALID_RESOLVER_STATES: ResolverState[] = [
  "resolved",
  "lead_only",
  "contact_unknown",
  "operational_conflict",
  "unresolved_identity",
];

const VALID_CONFLICT_TYPES: ConflictType[] = [
  "stage_conflict",
  "payment_conflict",
  "identity_conflict",
  "contact_conflict",
];

function resolveRepoRoot() {
  const cwd = process.cwd();
  const candidates = [cwd, path.resolve(cwd, "../../.."), path.resolve(cwd, "../..")];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "staffordos/clients/client_registry_v1.json"))) return candidate;
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

function lowerText(value: unknown, fallback = "") {
  return text(value, fallback).toLowerCase();
}

function normalizeTimestamp(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeRelationshipKey(value?: string | null) {
  const normalized = text(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0]
    .replace(/[^a-z0-9.@_-]+/g, "-")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized;
}

function toRelationshipId(value?: string | null) {
  const normalized = normalizeRelationshipKey(value);
  return normalized ? `rel_${normalized}` : "";
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => text(value)).filter(Boolean)));
}

function firstDefined(values: Array<string | null | undefined>) {
  for (const value of values) {
    if (text(value)) return text(value);
  }
  return null;
}

function isLikelyTimestamp(value: unknown) {
  return normalizeTimestamp(value) !== null;
}

function collectBaseKeys(record: Record<string, any>, source: RawGroupRecord["source"]) {
  const keys = new Set<string>();
  const add = (...values: Array<string | null | undefined>) => {
    for (const value of values) {
      const normalized = normalizeRelationshipKey(value);
      if (normalized) keys.add(normalized);
    }
  };

  if (source === "lead") {
    add(record.lead_id, record.id, record.domain, record.name, record.execution?.send_target);
  }

  if (source === "client") {
    add(record.client_id, record.merchant_shop, record.store_domain, record.notes?.[0]?.lead_id);
  }

  if (source === "merchant") {
    add(
      record.merchant_id,
      record.client_id,
      record.merchant_shop,
      record.store_domain,
      record.lead_id,
      record.opportunity_id,
      record.delivery_id,
      record.action_id
    );
  }

  if (source === "fulfillment") {
    add(record.fulfillment_id, record.client_id, record.store_domain, record.opportunity_ref, record.delivery_unit_ref, record.packet_id);
  }

  if (source === "execution") {
    add(record.customer, record.product, record.execution_id);
  }

  if (source === "outcome") {
    add(record.customer, record.event_id);
  }

  return Array.from(keys);
}

class UnionFind {
  private parent = new Map<string, string>();

  make(value: string) {
    if (!this.parent.has(value)) this.parent.set(value, value);
  }

  find(value: string): string {
    this.make(value);
    const parent = this.parent.get(value);
    if (!parent || parent === value) return value;
    const root = this.find(parent);
    this.parent.set(value, root);
    return root;
  }

  union(a: string, b: string) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootB, rootA);
  }
}

function readSourceTruths(repoRoot: string) {
  const leadRegistry = readJson<{ items?: LeadRecord[] }>(path.join(repoRoot, "staffordos/leads/lead_registry_v1.json"), { items: [] });
  const clientRegistry = readJson<{ clients?: ClientRecord[] }>(path.join(repoRoot, "staffordos/clients/client_registry_v1.json"), { clients: [] });
  const merchantLifecycle = readJson<{ generated_at?: string; records?: MerchantLifecycleRecord[] }>(
    path.join(repoRoot, "staffordos/merchant_registry/merchant_lifecycle_registry_v1.json"),
    { records: [] }
  );
  const revenueTruth = readJson<Record<string, any>>(path.join(repoRoot, "staffordos/revenue/revenue_truth_v1.json"), {});
  const fulfillmentTruth = readJson<{ generated_at?: string; items?: FulfillmentRecord[] }>(
    path.join(repoRoot, "staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json"),
    { items: [] }
  );
  const executionTruth = readJson<{ generated_at?: string; events?: ExecutionRecord[] }>(
    path.join(repoRoot, "staffordos/execution/execution_log_v1.json"),
    { events: [] }
  );
  const outcomeTruth = readJson<{ generated_at?: string; events?: OutcomeRecord[] }>(
    path.join(repoRoot, "staffordos/execution/outcome_events_v1.json"),
    { events: [] }
  );

  return { leadRegistry, clientRegistry, merchantLifecycle, revenueTruth, fulfillmentTruth, executionTruth, outcomeTruth };
}

function stageFromLead(record: LeadRecord) {
  return firstDefined([
    record.status?.current_stage,
    record.lifecycle_stage,
    record.status?.lifecycle_stage,
  ]);
}

function nextActionFromLead(record: LeadRecord) {
  return firstDefined([
    record.status?.next_action,
    record.next_action?.instructions,
    record.next_action,
  ]);
}

function timestampFromLead(record: LeadRecord) {
  return normalizeTimestamp(
    firstDefined([
      record.next_action?.due_at,
      record.next_action?.updated_at,
      record.updated_at,
      record.created_at,
    ])
  );
}

function stageFromClient(record: ClientRecord) {
  return firstDefined([
    record.decision_trace?.lifecycle_stage,
    record.lifecycle?.stage,
    record.status?.current_stage,
    record.lifecycle_stage,
  ]);
}

function nextActionFromClient(record: ClientRecord) {
  return firstDefined([
    record.next_action?.instructions,
    record.business?.next_action,
    record.decision_trace?.next_action_type,
    record.next_action,
  ]);
}

function timestampFromClient(record: ClientRecord) {
  return normalizeTimestamp(
    firstDefined([
      record.next_action?.due_at,
      record.next_action?.updated_at,
      record.decision_trace?.evaluated_at,
      record.updated_at,
      record.created_at,
    ])
  );
}

function stageFromMerchant(record: MerchantLifecycleRecord) {
  return firstDefined([record.current_stage, record.overall?.current_stage, record.lifecycle?.stage]);
}

function nextActionFromMerchant(record: MerchantLifecycleRecord) {
  return firstDefined([record.next_required_action, record.next_action?.instructions, record.overall?.next_required_action]);
}

function timestampFromMerchant(record: MerchantLifecycleRecord) {
  return normalizeTimestamp(firstDefined([record.updated_at, record.generated_at, record.created_at]));
}

function stageFromFulfillment(record: FulfillmentRecord) {
  return firstDefined([record.completion_status, record.fulfillment_status, record.payment_status, record.proof_status]);
}

function timestampFromFulfillment(record: FulfillmentRecord) {
  return normalizeTimestamp(firstDefined([record.completed_at, record.fix_completed_at, record.fix_started_at]));
}

function stageFromExecution(record: ExecutionRecord) {
  return firstDefined([record.stage, record.outcome, record.action_type]);
}

function nextActionFromExecution(record: ExecutionRecord) {
  return firstDefined([record.notes, record.action_type]);
}

function timestampFromExecution(record: ExecutionRecord) {
  return normalizeTimestamp(record.timestamp);
}

function stageFromOutcome(record: OutcomeRecord) {
  return firstDefined([record.new_state, record.previous_state, record.trigger]);
}

function nextActionFromOutcome(record: OutcomeRecord) {
  return firstDefined([record.trigger, record.new_state]);
}

function timestampFromOutcome(record: OutcomeRecord) {
  return normalizeTimestamp(record.timestamp);
}

function buildRecords(repoRoot: string) {
  const truths = readSourceTruths(repoRoot);
  const records: RawGroupRecord[] = [];

  const leadItems = Array.isArray(truths.leadRegistry.items) ? truths.leadRegistry.items : [];
  for (const [index, item] of leadItems.entries()) {
    records.push({
      source: "lead",
      id: text(item.id || item.lead_id || `lead-${index}`),
      raw: item,
      keys: collectBaseKeys(item, "lead"),
      created_at: normalizeTimestamp(item.created_at),
      updated_at: normalizeTimestamp(item.updated_at),
    });
  }

  const clientItems = Array.isArray(truths.clientRegistry.clients) ? truths.clientRegistry.clients : [];
  for (const [index, item] of clientItems.entries()) {
    records.push({
      source: "client",
      id: text(item.client_id || `client-${index}`),
      raw: item,
      keys: collectBaseKeys(item, "client"),
      created_at: normalizeTimestamp(item.created_at),
      updated_at: normalizeTimestamp(item.updated_at),
    });
  }

  const lifecycleItems = Array.isArray(truths.merchantLifecycle.records) ? truths.merchantLifecycle.records : [];
  for (const [index, item] of lifecycleItems.entries()) {
    records.push({
      source: "merchant",
      id: text(item.merchant_id || item.client_id || `merchant-${index}`),
      raw: item,
      keys: collectBaseKeys(item, "merchant"),
      created_at: normalizeTimestamp(item.created_at),
      updated_at: normalizeTimestamp(item.updated_at || truths.merchantLifecycle.generated_at),
    });
  }

  const fulfillmentItems = Array.isArray(truths.fulfillmentTruth.items) ? truths.fulfillmentTruth.items : [];
  for (const [index, item] of fulfillmentItems.entries()) {
    records.push({
      source: "fulfillment",
      id: text(item.fulfillment_id || item.delivery_unit_ref || `fulfillment-${index}`),
      raw: item,
      keys: collectBaseKeys(item, "fulfillment"),
      created_at: normalizeTimestamp(item.created_at),
      updated_at: normalizeTimestamp(item.updated_at || truths.fulfillmentTruth.generated_at),
    });
  }

  const executionItems = Array.isArray(truths.executionTruth.events) ? truths.executionTruth.events : [];
  for (const [index, item] of executionItems.entries()) {
    records.push({
      source: "execution",
      id: text(item.execution_id || `execution-${index}`),
      raw: item,
      keys: collectBaseKeys(item, "execution"),
      created_at: normalizeTimestamp(item.timestamp),
      updated_at: normalizeTimestamp(item.timestamp),
    });
  }

  const outcomeItems = Array.isArray(truths.outcomeTruth.events) ? truths.outcomeTruth.events : [];
  for (const [index, item] of outcomeItems.entries()) {
    records.push({
      source: "outcome",
      id: text(item.event_id || `outcome-${index}`),
      raw: item,
      keys: collectBaseKeys(item, "outcome"),
      created_at: normalizeTimestamp(item.timestamp),
      updated_at: normalizeTimestamp(item.timestamp),
    });
  }

  return { truths, records };
}

function buildGroups(records: RawGroupRecord[]) {
  const uf = new UnionFind();
  for (const record of records) {
    if (!record.keys.length) {
      record.keys = [normalizeRelationshipKey(`${record.source}-${record.id}`)];
    }
    const [head, ...tail] = record.keys;
    uf.make(head);
    for (const key of tail) {
      uf.make(key);
      uf.union(head, key);
    }
  }

  const groups = new Map<string, RelationshipGroup>();
  for (const record of records) {
    const root = uf.find(record.keys[0]);
    const existing = groups.get(root);
    if (existing) {
      existing.records.push(record);
    } else {
      groups.set(root, { key: root, records: [record] });
    }
  }

  return groups;
}

function sourceIds(records: RawGroupRecord[], source: RawGroupRecord["source"]) {
  return records.filter((record) => record.source === source).map((record) => record.id);
}

function recordsBySource(records: RawGroupRecord[], source: RawGroupRecord["source"]) {
  return records.filter((record) => record.source === source);
}

function pickPrimaryRecord(group: RelationshipGroup) {
  const client = group.records.find((record) => record.source === "client");
  const merchant = group.records.find((record) => record.source === "merchant");
  const fulfillment = group.records.find((record) => record.source === "fulfillment");
  const lead = group.records.find((record) => record.source === "lead");
  const execution = group.records.find((record) => record.source === "execution");
  const outcome = group.records.find((record) => record.source === "outcome");
  return client || merchant || fulfillment || lead || execution || outcome || group.records[0];
}

function collectLeadFacet(group: RelationshipGroup): RelationshipObject["facets"]["lead"] {
  const leads = recordsBySource(group.records, "lead");
  const record = leads[0]?.raw || {};
  const contactEmail = firstDefined([record.contact?.email, record.email, record.send_target]);
  return {
    lead_id: firstDefined([record.lead_id, record.id]),
    campaign_id: firstDefined([record.campaign_id]) || null,
    name: firstDefined([record.name, record.domain]),
    domain: firstDefined([record.domain]),
    email: contactEmail || null,
    current_stage: firstDefined([stageFromLead(record)]),
    next_action: firstDefined([nextActionFromLead(record)]),
    status: firstDefined([record.status?.current_stage, record.lifecycle_stage, record.status]) || null,
    score: Number.isFinite(Number(record.score)) ? Number(record.score) : null,
    temperature: firstDefined([record.status?.temperature, record.temperature]) || null,
    sent: Boolean(record.engagement?.sent || record.sent),
    replied: Boolean(record.engagement?.replied || record.replied),
    blocked: Boolean(record.blocked || record.status?.blocked),
    source_match_reasons: leads.length
      ? unique(
          leads.flatMap((lead) => [
            lead.raw.lead_id ? `lead_id=${lead.raw.lead_id}` : null,
            lead.raw.id ? `id=${lead.raw.id}` : null,
            lead.raw.domain ? `domain=${lead.raw.domain}` : null,
            lead.raw.contact?.email ? `contact.email=${lead.raw.contact.email}` : null,
          ])
        )
      : [],
    source_records: leads.map((lead) => lead.id),
  };
}

function collectClientFacet(group: RelationshipGroup): RelationshipObject["facets"]["client"] {
  const clients = recordsBySource(group.records, "client");
  const record = clients[0]?.raw || {};
  return {
    client_id: firstDefined([record.client_id]),
    contact_email: firstDefined([record.contact?.email, record.email, record.next_action?.contact_email]) || null,
    current_stage: firstDefined([stageFromClient(record)]),
    next_action: firstDefined([nextActionFromClient(record)]),
    payment_status: firstDefined([record.deal?.payment_status, record.payment_status]) || null,
    closed_at: firstDefined([record.deal?.closed_at]) || null,
    lifetime_value: Number.isFinite(Number(record.business?.lifetime_value ?? record.revenue?.total_lifetime_value))
      ? Number(record.business?.lifetime_value ?? record.revenue?.total_lifetime_value)
      : null,
    followup_ready: Boolean(record.close_engine?.followup_ready),
    source_match_reasons: clients.length
      ? unique(
          clients.flatMap((client) => [
            client.raw.client_id ? `client_id=${client.raw.client_id}` : null,
            client.raw.merchant_shop ? `merchant_shop=${client.raw.merchant_shop}` : null,
            client.raw.contact?.email ? `contact.email=${client.raw.contact.email}` : null,
            client.raw.next_action?.instructions ? `next_action.instructions=${client.raw.next_action.instructions}` : null,
          ])
        )
      : [],
    source_records: clients.map((client) => client.id),
  };
}

function collectMerchantFacet(group: RelationshipGroup): RelationshipObject["facets"]["merchant"] {
  const merchants = recordsBySource(group.records, "merchant");
  const record = merchants[0]?.raw || {};
  return {
    merchant_id: firstDefined([record.merchant_id, record.client_id]),
    merchant_shop: firstDefined([record.merchant_shop]),
    store_domain: firstDefined([record.store_domain, record.merchant_shop]),
    current_stage: firstDefined([stageFromMerchant(record)]),
    next_required_action: firstDefined([nextActionFromMerchant(record)]),
    readiness_score: Number.isFinite(Number(record.readiness_score)) ? Number(record.readiness_score) : null,
    offer_status: firstDefined([record.offer_status]) || null,
    payment_status: firstDefined([record.payment_status]) || null,
    fulfillment_status: firstDefined([record.fulfillment_status]) || null,
    proof_package_status: firstDefined([record.proof_package_status]) || null,
    case_study_status: firstDefined([record.case_study_status]) || null,
    referral_status: firstDefined([record.referral_status]) || null,
    revenue_status: firstDefined([record.revenue_status]) || null,
    source_match_reasons: merchants.length
      ? unique(
          merchants.flatMap((merchant) => [
            merchant.raw.merchant_id ? `merchant_id=${merchant.raw.merchant_id}` : null,
            merchant.raw.client_id ? `client_id=${merchant.raw.client_id}` : null,
            merchant.raw.merchant_shop ? `merchant_shop=${merchant.raw.merchant_shop}` : null,
            merchant.raw.store_domain ? `store_domain=${merchant.raw.store_domain}` : null,
            merchant.raw.current_stage ? `current_stage=${merchant.raw.current_stage}` : null,
            merchant.raw.next_required_action ? `next_required_action=${merchant.raw.next_required_action}` : null,
          ])
        )
      : [],
    source_records: merchants.map((merchant) => merchant.id),
  };
}

function collectFulfillmentFacet(group: RelationshipGroup): RelationshipObject["facets"]["fulfillment"] {
  const fulfillments = recordsBySource(group.records, "fulfillment");
  const record = fulfillments[0]?.raw || {};
  return {
    fulfillment_id: firstDefined([record.fulfillment_id, record.delivery_unit_ref]) || null,
    client_id: firstDefined([record.client_id]) || null,
    store_domain: firstDefined([record.store_domain]) || null,
    payment_status: firstDefined([record.payment_status]) || null,
    fulfillment_status: firstDefined([record.fulfillment_status]) || null,
    proof_status: firstDefined([record.proof_status]) || null,
    completion_status: firstDefined([record.completion_status]) || null,
    before_evidence_status: firstDefined([record.before_evidence_status]) || null,
    after_evidence_status: firstDefined([record.after_evidence_status]) || null,
    proof_package_status: firstDefined([record.proof_package_status]) || null,
    completed_at: normalizeTimestamp(record.completed_at),
    merchant_proof_package_ready: Boolean(record.merchant_proof_package_ready),
    remaining_limitations: firstDefined([record.remaining_limitations]) || null,
    risk_or_limitation: firstDefined([record.risk_or_limitation]) || null,
    source_match_reasons: fulfillments.length
      ? unique(
          fulfillments.flatMap((fulfillment) => [
            fulfillment.raw.fulfillment_id ? `fulfillment_id=${fulfillment.raw.fulfillment_id}` : null,
            fulfillment.raw.client_id ? `client_id=${fulfillment.raw.client_id}` : null,
            fulfillment.raw.store_domain ? `store_domain=${fulfillment.raw.store_domain}` : null,
            fulfillment.raw.payment_status ? `payment_status=${fulfillment.raw.payment_status}` : null,
            fulfillment.raw.fulfillment_status ? `fulfillment_status=${fulfillment.raw.fulfillment_status}` : null,
          ])
        )
      : [],
    source_records: fulfillments.map((fulfillment) => fulfillment.id),
  };
}

function collectExecutionFacet(group: RelationshipGroup): RelationshipObject["facets"]["execution"] {
  const executions = recordsBySource(group.records, "execution");
  const record = executions[0]?.raw || {};
  return {
    execution_id: firstDefined([record.execution_id]) || null,
    timestamp: timestampFromExecution(record),
    operator: firstDefined([record.operator]) || null,
    action_type: firstDefined([record.action_type]) || null,
    stage: firstDefined([stageFromExecution(record)]),
    outcome: firstDefined([record.outcome]) || null,
    revenue_impact: firstDefined([record.revenue_impact]) || null,
    customer: firstDefined([record.customer]) || null,
    source_match_reasons: executions.length
      ? unique(
          executions.flatMap((execution) => [
            execution.raw.execution_id ? `execution_id=${execution.raw.execution_id}` : null,
            execution.raw.customer ? `customer=${execution.raw.customer}` : null,
            execution.raw.action_type ? `action_type=${execution.raw.action_type}` : null,
          ])
        )
      : [],
    source_records: executions.map((execution) => execution.id),
  };
}

function collectOutcomeFacet(group: RelationshipGroup): RelationshipObject["facets"]["outcome"] {
  const outcomes = recordsBySource(group.records, "outcome");
  const record = outcomes[0]?.raw || {};
  return {
    event_id: firstDefined([record.event_id]) || null,
    timestamp: timestampFromOutcome(record),
    customer: firstDefined([record.customer]) || null,
    previous_state: firstDefined([record.previous_state]) || null,
    new_state: firstDefined([record.new_state]) || null,
    trigger: firstDefined([record.trigger]) || null,
    confidence: Number.isFinite(Number(record.confidence)) ? Number(record.confidence) : null,
    source_match_reasons: outcomes.length
      ? unique(
          outcomes.flatMap((outcome) => [
            outcome.raw.event_id ? `event_id=${outcome.raw.event_id}` : null,
            outcome.raw.customer ? `customer=${outcome.raw.customer}` : null,
            outcome.raw.new_state ? `new_state=${outcome.raw.new_state}` : null,
            outcome.raw.trigger ? `trigger=${outcome.raw.trigger}` : null,
          ])
        )
      : [],
    source_records: outcomes.map((outcome) => outcome.id),
  };
}

function determinePrimaryKey(group: RelationshipGroup) {
  const byPriority = [
    group.records.find((record) => record.source === "client" && text(record.raw.client_id)),
    group.records.find((record) => record.source === "merchant" && text(record.raw.client_id || record.raw.merchant_shop)),
    group.records.find((record) => record.source === "fulfillment" && text(record.raw.client_id || record.raw.store_domain)),
    group.records.find((record) => record.source === "lead" && text(record.raw.lead_id || record.raw.domain)),
    group.records.find((record) => record.source === "execution" && text(record.raw.customer)),
    group.records.find((record) => record.source === "outcome" && text(record.raw.customer)),
  ].filter(Boolean) as RawGroupRecord[];

  const chosen = byPriority[0] || group.records[0];
  const primary =
    chosen.source === "client"
      ? chosen.raw.client_id || chosen.raw.merchant_shop || chosen.raw.store_domain
      : chosen.source === "merchant"
        ? chosen.raw.client_id || chosen.raw.merchant_shop || chosen.raw.store_domain || chosen.raw.merchant_id
        : chosen.source === "fulfillment"
          ? chosen.raw.client_id || chosen.raw.store_domain || chosen.raw.fulfillment_id
          : chosen.source === "lead"
            ? chosen.raw.lead_id || chosen.raw.domain || chosen.raw.name
            : chosen.source === "execution"
              ? chosen.raw.customer || chosen.raw.execution_id
              : chosen.raw.customer || chosen.raw.event_id;

  return text(primary || chosen.id || group.key);
}

function determineDisplayName(group: RelationshipGroup) {
  const client = group.records.find((record) => record.source === "client")?.raw || {};
  const merchant = group.records.find((record) => record.source === "merchant")?.raw || {};
  const fulfillment = group.records.find((record) => record.source === "fulfillment")?.raw || {};
  const lead = group.records.find((record) => record.source === "lead")?.raw || {};
  const outcome = group.records.find((record) => record.source === "outcome")?.raw || {};
  const execution = group.records.find((record) => record.source === "execution")?.raw || {};

  return firstDefined([
    client.merchant_shop,
    client.client_id,
    merchant.merchant_shop,
    merchant.client_id,
    fulfillment.store_domain,
    lead.name,
    lead.domain,
    outcome.customer,
    execution.customer,
    group.key,
  ]) || "unknown";
}

function determineCurrentStage(group: RelationshipGroup) {
  const client = group.records.find((record) => record.source === "client")?.raw || {};
  const merchant = group.records.find((record) => record.source === "merchant")?.raw || {};
  const fulfillment = group.records.find((record) => record.source === "fulfillment")?.raw || {};
  const lead = group.records.find((record) => record.source === "lead")?.raw || {};
  const outcome = group.records.find((record) => record.source === "outcome")?.raw || {};

  const sourceValues = [
    { source: "client_registry_v1.json", value: stageFromClient(client), precedence: 1 },
    { source: "merchant_lifecycle_registry_v1.json", value: stageFromMerchant(merchant), precedence: 2 },
    { source: "shopifixer_fulfillment_truth_v1.json", value: stageFromFulfillment(fulfillment), precedence: 3 },
    { source: "lead_registry_v1.json", value: stageFromLead(lead), precedence: 4 },
    { source: "execution/outcome history", value: stageFromOutcome(outcome), precedence: 5 },
  ].filter((item) => text(item.value));

  const selected = [...sourceValues].sort((a, b) => a.precedence - b.precedence)[0] || null;
  const distinctValues = unique(sourceValues.map((item) => item.value));
  const conflict = distinctValues.length > 1 ? true : false;

  return {
    stage: selected ? selected.value : null,
    source: selected ? selected.source : null,
    conflict,
    allValues: distinctValues,
  };
}

function determineNextAction(group: RelationshipGroup, revenueTruth: Record<string, any>) {
  const client = group.records.find((record) => record.source === "client")?.raw || {};
  const merchant = group.records.find((record) => record.source === "merchant")?.raw || {};
  const lead = group.records.find((record) => record.source === "lead")?.raw || {};

  const clientAction = firstDefined([nextActionFromClient(client)]);
  const merchantAction = firstDefined([nextActionFromMerchant(merchant)]);
  const leadAction = firstDefined([nextActionFromLead(lead)]);
  const revenueAction = firstDefined([
    revenueTruth?.next_actions?.[0]?.action,
    revenueTruth?.next_actions?.[0]?.expected_outcome,
    revenueTruth?.current_bottleneck,
  ]);

  const selected = firstDefined([clientAction, merchantAction, revenueAction, leadAction]);
  const selectedSource = clientAction
    ? "client_registry_v1.json"
    : merchantAction
      ? "merchant_lifecycle_registry_v1.json"
      : revenueAction
        ? "revenue_truth_v1.json"
          : leadAction
            ? "lead_registry_v1.json"
            : null;
  const selectedOwner = firstDefined([
    client.next_action?.owner,
    merchant.next_action?.owner,
    lead.next_action?.owner,
  ]) || (selectedSource ? "system" : null);

  return {
    nextAction: selected,
    source: selectedSource,
    owner: selectedOwner,
    values: unique([clientAction, merchantAction, revenueAction, leadAction]),
  };
}

function determineNextTouchAt(group: RelationshipGroup) {
  const client = group.records.find((record) => record.source === "client")?.raw || {};
  const merchant = group.records.find((record) => record.source === "merchant")?.raw || {};
  const lead = group.records.find((record) => record.source === "lead")?.raw || {};
  const fulfillment = group.records.find((record) => record.source === "fulfillment")?.raw || {};

  return (
    normalizeTimestamp(firstDefined([
      client.next_action?.due_at,
      client.next_action?.updated_at,
      client.decision_trace?.evaluated_at,
      merchant.updated_at,
      merchant.generated_at,
      lead.next_action?.due_at,
      lead.next_action?.updated_at,
      lead.updated_at,
      fulfillment.updated_at,
      fulfillment.completed_at,
    ])) || null
  );
}

function detectConflicts(group: RelationshipGroup) {
  const client = group.records.find((record) => record.source === "client")?.raw || {};
  const merchant = group.records.find((record) => record.source === "merchant")?.raw || {};
  const fulfillment = group.records.find((record) => record.source === "fulfillment")?.raw || {};
  const lead = group.records.find((record) => record.source === "lead")?.raw || {};
  const execution = group.records.find((record) => record.source === "execution")?.raw || {};
  const outcome = group.records.find((record) => record.source === "outcome")?.raw || {};

  const conflictTypes: ConflictType[] = [];
  const conflictNotes: string[] = [];

  const stageValues = unique([
    stageFromClient(client),
    stageFromMerchant(merchant),
    stageFromFulfillment(fulfillment),
    stageFromLead(lead),
    stageFromExecution(execution),
    stageFromOutcome(outcome),
  ]);
  if (stageValues.length > 1) {
    conflictTypes.push("stage_conflict");
    conflictNotes.push(`stage conflict: ${stageValues.join(" | ")}`);
  }

  const paymentValues = unique([
    client.deal?.payment_status,
    client.payment_status,
    merchant.payment_status,
    fulfillment.payment_status,
  ].filter((value) => lowerText(value) !== "not_billable" && lowerText(value) !== "unknown"));
  if (paymentValues.length > 1) {
    conflictTypes.push("payment_conflict");
    conflictNotes.push(`payment conflict: ${paymentValues.join(" | ")}`);
  }

  const clientIds = unique([client.client_id, merchant.client_id, fulfillment.client_id]);
  const merchantShops = unique([client.merchant_shop, merchant.merchant_shop, fulfillment.store_domain]);
  const leadIds = unique([lead.lead_id, merchant.lead_id]);
  const customerNames = unique([execution.customer, outcome.customer]);
  const identitySignals = unique([...clientIds, ...merchantShops, ...leadIds, ...customerNames]);
  const meaningfulIdentitySignals = identitySignals.filter((value) => Boolean(value));
  if (meaningfulIdentitySignals.length > 1 && clientIds.length > 1) {
    conflictTypes.push("identity_conflict");
    conflictNotes.push(`identity conflict: ${meaningfulIdentitySignals.join(" | ")}`);
  }

  const contactValues = unique([
    lead.contact?.email,
    client.contact?.email,
  ]);
  if (contactValues.length > 1) {
    conflictTypes.push("contact_conflict");
    conflictNotes.push(`contact conflict: ${contactValues.join(" | ")}`);
  }

  return {
    conflictTypes,
    conflictNotes,
  };
}

function buildSourceMatchReasons(group: RelationshipGroup): SourceMatchReasons {
  const lead = recordsBySource(group.records, "lead");
  const client = recordsBySource(group.records, "client");
  const merchant = recordsBySource(group.records, "merchant");
  const fulfillment = recordsBySource(group.records, "fulfillment");
  const execution = recordsBySource(group.records, "execution");
  const outcome = recordsBySource(group.records, "outcome");

  return {
    lead: unique(
      lead.flatMap((record) => [
        record.raw.lead_id ? `lead_id=${record.raw.lead_id}` : null,
        record.raw.id ? `id=${record.raw.id}` : null,
        record.raw.domain ? `domain=${record.raw.domain}` : null,
        record.raw.contact?.email ? `contact.email=${record.raw.contact.email}` : null,
      ])
    ),
    client: unique(
      client.flatMap((record) => [
        record.raw.client_id ? `client_id=${record.raw.client_id}` : null,
        record.raw.merchant_shop ? `merchant_shop=${record.raw.merchant_shop}` : null,
        record.raw.contact?.email ? `contact.email=${record.raw.contact.email}` : null,
      ])
    ),
    merchant: unique(
      merchant.flatMap((record) => [
        record.raw.merchant_id ? `merchant_id=${record.raw.merchant_id}` : null,
        record.raw.client_id ? `client_id=${record.raw.client_id}` : null,
        record.raw.merchant_shop ? `merchant_shop=${record.raw.merchant_shop}` : null,
        record.raw.store_domain ? `store_domain=${record.raw.store_domain}` : null,
      ])
    ),
    fulfillment: unique(
      fulfillment.flatMap((record) => [
        record.raw.fulfillment_id ? `fulfillment_id=${record.raw.fulfillment_id}` : null,
        record.raw.client_id ? `client_id=${record.raw.client_id}` : null,
        record.raw.store_domain ? `store_domain=${record.raw.store_domain}` : null,
      ])
    ),
    execution: unique(
      execution.flatMap((record) => [
        record.raw.execution_id ? `execution_id=${record.raw.execution_id}` : null,
        record.raw.customer ? `customer=${record.raw.customer}` : null,
        record.raw.action_type ? `action_type=${record.raw.action_type}` : null,
      ])
    ),
    outcome: unique(
      outcome.flatMap((record) => [
        record.raw.event_id ? `event_id=${record.raw.event_id}` : null,
        record.raw.customer ? `customer=${record.raw.customer}` : null,
        record.raw.new_state ? `new_state=${record.raw.new_state}` : null,
      ])
    ),
  };
}

function selectResolverState(group: RelationshipGroup, conflictTypes: ConflictType[], identity: RelationshipObject["identity"], contactability: "reachable" | "unknown"): ResolverState {
  const leadRecords = recordsBySource(group.records, "lead");
  const clientRecords = recordsBySource(group.records, "client");
  const merchantRecords = recordsBySource(group.records, "merchant");
  const fulfillmentRecords = recordsBySource(group.records, "fulfillment");
  const executionRecords = recordsBySource(group.records, "execution");
  const outcomeRecords = recordsBySource(group.records, "outcome");

  const hasLeadOnly =
    leadRecords.length > 0 &&
    clientRecords.length === 0 &&
    merchantRecords.length === 0 &&
    fulfillmentRecords.length === 0 &&
    executionRecords.length === 0 &&
    outcomeRecords.length === 0;

  const hasIdentityAnchors = Boolean(
    identity.client_id || identity.merchant_shop || identity.store_domain || identity.lead_id || identity.email || identity.domain
  );

  if (!hasIdentityAnchors) return "unresolved_identity";
  if (hasLeadOnly) return "lead_only";
  const severeConflict =
    conflictTypes.length > 1 || conflictTypes.some((type) => type !== "stage_conflict");
  if (severeConflict) return "operational_conflict";
  if (contactability === "unknown") return "contact_unknown";
  return "resolved";
}

function determineRelationshipType(group: RelationshipGroup, resolverState: ResolverState): RelationshipObject["relationship_type"] {
  if (resolverState === "lead_only") return "lead";
  if (group.records.some((record) => record.source === "fulfillment" || record.source === "merchant")) return "merchant";
  if (group.records.some((record) => record.source === "client")) return "client";
  return "lead";
}

function determineHealth(resolverState: ResolverState, conflictTypes: ConflictType[]) {
  if (resolverState === "operational_conflict") return "at_risk" as const;
  if (resolverState === "contact_unknown" || resolverState === "lead_only") return "unknown" as const;
  if (resolverState === "unresolved_identity") return "unknown" as const;
  if (conflictTypes.length > 0) return "at_risk" as const;
  return "healthy" as const;
}

function determineRiskLevel(resolverState: ResolverState, conflictTypes: ConflictType[], contactability: "reachable" | "unknown") {
  if (resolverState === "operational_conflict") return "high" as const;
  if (resolverState === "unresolved_identity") return "high" as const;
  if (resolverState === "lead_only") return contactability === "reachable" ? "medium" as const : "high" as const;
  if (resolverState === "contact_unknown") return "medium" as const;
  if (conflictTypes.length > 0) return "high" as const;
  return "low" as const;
}

function determineContactability(identity: RelationshipObject["identity"]) {
  return identity.email ? ("reachable" as const) : ("unknown" as const);
}

function computePriorityScore(group: RelationshipGroup, relationshipCore: RelationshipObject["relationship_core"]) {
  const client = group.records.find((record) => record.source === "client")?.raw || {};
  const merchant = group.records.find((record) => record.source === "merchant")?.raw || {};
  const lead = group.records.find((record) => record.source === "lead")?.raw || {};
  const fulfillment = group.records.find((record) => record.source === "fulfillment")?.raw || {};

  const base =
    Number(client.priority_score?.total) ||
    Number(client.priority_score?.revenue_potential) * 0.5 ||
    Number(merchant.readiness_score) ||
    Number(lead.score) ||
    Number(fulfillment.merchant_proof_package_ready ? 90 : 0) ||
    0;
  const riskPenalty = relationshipCore.conflict_types.length > 0 ? 20 : 0;
  const statePenalty = relationshipCore.status === "lead_only" ? 10 : relationshipCore.status === "contact_unknown" ? 5 : 0;
  return Math.max(0, Math.min(100, Math.round(base - riskPenalty - statePenalty)));
}

function computeConfidence(group: RelationshipGroup, conflictTypes: ConflictType[], identity: RelationshipObject["identity"]) {
  const hasClient = group.records.some((record) => record.source === "client");
  const hasMerchant = group.records.some((record) => record.source === "merchant");
  const hasFulfillment = group.records.some((record) => record.source === "fulfillment");
  const hasExecution = group.records.some((record) => record.source === "execution");
  const hasOutcome = group.records.some((record) => record.source === "outcome");
  const hasLead = group.records.some((record) => record.source === "lead");

  let confidence = 0.3;
  if (hasLead) confidence += 0.1;
  if (identity.client_id) confidence += 0.25;
  if (identity.merchant_shop) confidence += 0.1;
  if (hasMerchant) confidence += 0.1;
  if (hasFulfillment) confidence += 0.1;
  if (hasExecution) confidence += 0.05;
  if (hasOutcome) confidence += 0.05;
  if (conflictTypes.length > 0) confidence -= 0.15 * conflictTypes.length;
  return Math.max(0, Math.min(1, Number(confidence.toFixed(2))));
}

function buildRelationship(group: RelationshipGroup, revenueTruth: Record<string, any>): RelationshipObject {
  const leadFacet = collectLeadFacet(group);
  const clientFacet = collectClientFacet(group);
  const merchantFacet = collectMerchantFacet(group);
  const fulfillmentFacet = collectFulfillmentFacet(group);
  const executionFacet = collectExecutionFacet(group);
  const outcomeFacet = collectOutcomeFacet(group);
  const sourceMatchReasons = buildSourceMatchReasons(group);
  const identity = {
    lead_id: firstDefined([leadFacet.lead_id, merchantFacet.current_stage ? leadFacet.lead_id : null]) || null,
    client_id: firstDefined([clientFacet.client_id, fulfillmentFacet.client_id, merchantFacet.merchant_id]) || null,
    merchant_id: firstDefined([merchantFacet.merchant_id, clientFacet.client_id, fulfillmentFacet.client_id]) || null,
    merchant_shop: firstDefined([merchantFacet.merchant_shop, clientFacet.client_id, fulfillmentFacet.store_domain, leadFacet.domain]) || null,
    store_domain: firstDefined([merchantFacet.store_domain, fulfillmentFacet.store_domain, clientFacet.contact_email ? merchantFacet.merchant_shop : null, leadFacet.domain]) || null,
    domain: firstDefined([leadFacet.domain, merchantFacet.store_domain, clientFacet.client_id, outcomeFacet.customer, executionFacet.customer]) || null,
    email: firstDefined([clientFacet.contact_email, leadFacet.email]) || null,
    aliases: unique([
      leadFacet.lead_id,
      leadFacet.domain,
      clientFacet.client_id,
      merchantFacet.merchant_id,
      merchantFacet.merchant_shop,
      merchantFacet.store_domain,
      fulfillmentFacet.client_id,
      fulfillmentFacet.store_domain,
      executionFacet.customer,
      outcomeFacet.customer,
    ]),
  };

  const currentStageInfo = determineCurrentStage(group);
  const nextActionInfo = determineNextAction(group, revenueTruth);
  const nextTouchAt = determineNextTouchAt(group);
  const conflictInfo = detectConflicts(group);
  const contactability = determineContactability(identity);
  const resolverState = selectResolverState(group, conflictInfo.conflictTypes, identity, contactability);
  const relationshipType = determineRelationshipType(group, resolverState);
  const relationshipCore = {
    owner: nextActionInfo.owner || "system",
    status: resolverState,
    current_stage: currentStageInfo.stage,
    current_stage_source: currentStageInfo.source,
    next_action: nextActionInfo.nextAction,
    next_action_source: nextActionInfo.source,
    next_touch_at: nextTouchAt,
    contactability,
    relationship_health: determineHealth(resolverState, conflictInfo.conflictTypes),
    risk_level: determineRiskLevel(resolverState, conflictInfo.conflictTypes, contactability),
    priority_score: 0,
    confidence: 0,
    conflict_types: conflictInfo.conflictTypes,
    conflict_notes: conflictInfo.conflictNotes,
  } as RelationshipObject["relationship_core"];

  relationshipCore.priority_score = computePriorityScore(group, relationshipCore);
  relationshipCore.confidence = computeConfidence(group, conflictInfo.conflictTypes, identity);

  const recordsByType = {
    lead: recordsBySource(group.records, "lead"),
    client: recordsBySource(group.records, "client"),
    merchant: recordsBySource(group.records, "merchant"),
    fulfillment: recordsBySource(group.records, "fulfillment"),
    execution: recordsBySource(group.records, "execution"),
    outcome: recordsBySource(group.records, "outcome"),
  };

  const createdAt = firstDefined([
    ...group.records.map((record) => record.created_at),
  ]);
  const updatedAt = firstDefined([
    ...group.records.map((record) => record.updated_at),
    executionFacet.timestamp,
    outcomeFacet.timestamp,
  ]);

  const lastExecutionAt = executionFacet.timestamp || null;
  const lastOutcomeAt = outcomeFacet.timestamp || null;

  const primaryKey = determinePrimaryKey(group);
  const relationshipId = toRelationshipId(primaryKey || group.key);

  const provenanceSources = unique([
    ...recordsByType.lead.map((record) => record.source),
    ...recordsByType.client.map((record) => record.source),
    ...recordsByType.merchant.map((record) => record.source),
    ...recordsByType.fulfillment.map((record) => record.source),
    ...recordsByType.execution.map((record) => record.source),
    ...recordsByType.outcome.map((record) => record.source),
  ]);

  const primarySource =
    relationshipCore.status === "lead_only"
      ? "lead_registry_v1.json"
      : relationshipCore.status === "contact_unknown" || relationshipCore.status === "resolved" || relationshipCore.status === "operational_conflict"
        ? "client_registry_v1.json"
        : "lead_registry_v1.json";

  return {
    relationship_id: relationshipId,
    display_name: determineDisplayName(group),
    relationship_type: relationshipType,
    resolver_state: resolverState,
    identity,
    relationship_core: relationshipCore,
    facets: {
      lead: leadFacet,
      client: clientFacet,
      merchant: merchantFacet,
      fulfillment: fulfillmentFacet,
      execution: executionFacet,
      outcome: outcomeFacet,
    },
    links: {
      lead_registry_ids: sourceIds(group.records, "lead"),
      client_registry_ids: sourceIds(group.records, "client"),
      merchant_lifecycle_ids: sourceIds(group.records, "merchant"),
      fulfillment_ids: sourceIds(group.records, "fulfillment"),
      execution_ids: sourceIds(group.records, "execution"),
      outcome_event_ids: sourceIds(group.records, "outcome"),
    },
    provenance: {
      primary_source: primarySource,
      secondary_sources: provenanceSources.filter((source) => source !== primarySource),
      source_match_reasons: sourceMatchReasons,
      conflict_types: conflictInfo.conflictTypes,
      conflict_notes: conflictInfo.conflictNotes,
      confidence: relationshipCore.confidence,
    },
    timeline: {
      created_at: normalizeTimestamp(createdAt) || group.records.map((record) => record.created_at).find(Boolean) || null,
      updated_at: normalizeTimestamp(updatedAt) || group.records.map((record) => record.updated_at).find(Boolean) || null,
      last_execution_at: lastExecutionAt,
      last_outcome_at: lastOutcomeAt,
    },
  };
}

function buildRelationshipIndex() {
  const repoRoot = resolveRepoRoot();
  const { truths, records } = buildRecords(repoRoot);
  const groups = buildGroups(records);
  const relationships = Array.from(groups.values()).map((group) => buildRelationship(group, truths.revenueTruth || {}));
  relationships.sort((a, b) => a.relationship_id.localeCompare(b.relationship_id));
  return { repoRoot, relationships };
}

export function resolveRelationships() {
  return buildRelationshipIndex().relationships;
}

export function resolveRelationshipById(id: string) {
  const normalized = toRelationshipId(id) || normalizeRelationshipKey(id);
  return resolveRelationships().find((relationship) => {
    if (relationship.relationship_id === normalized) return true;
    return relationship.identity.aliases.some((alias) => normalizeRelationshipKey(alias) === normalizeRelationshipKey(id));
  }) || null;
}

export function validateResolvedRelationships(relationships: RelationshipObject[]): ResolverValidation {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const relationship of relationships) {
    if (!relationship.relationship_id) errors.push("Missing relationship_id");
    if (seen.has(relationship.relationship_id)) errors.push(`Duplicate relationship_id: ${relationship.relationship_id}`);
    seen.add(relationship.relationship_id);

    if (!VALID_RESOLVER_STATES.includes(relationship.resolver_state)) {
      errors.push(`Invalid resolver_state: ${relationship.relationship_id}`);
    }

    const conflictTypes = relationship.relationship_core.conflict_types || [];
    for (const conflictType of conflictTypes) {
      if (!VALID_CONFLICT_TYPES.includes(conflictType)) {
        errors.push(`Invalid conflict type on ${relationship.relationship_id}: ${conflictType}`);
      }
    }

    if (relationship.relationship_core.next_touch_at !== null && !isLikelyTimestamp(relationship.relationship_core.next_touch_at)) {
      errors.push(`next_touch_at must be timestamp or null: ${relationship.relationship_id}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function getRelationshipResolverReport() {
  const relationships = resolveRelationships();
  const validation = validateResolvedRelationships(relationships);
  return {
    total_relationships: relationships.length,
    relationships,
    validation,
  };
}
