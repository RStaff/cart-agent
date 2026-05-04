import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";

const now = new Date().toISOString();

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

mkdirSync("staffordos/domains", { recursive: true });
mkdirSync("staffordos/units", { recursive: true });
mkdirSync("staffordos/memory", { recursive: true });
mkdirSync("staffordos/events", { recursive: true });
mkdirSync("staffordos/gates", { recursive: true });
mkdirSync("staffordos/snapshots", { recursive: true });

const clients = readJson("staffordos/clients/client_registry_v1.json", { clients: [] }).clients || [];

const domainRegistry = {
  schema: "staffordos.domain_registry.v1",
  purpose: "Master domain map for RossOS / StaffordOS across life, business, products, clients, internal dev work, and system operations.",
  generated_at: now,
  domains: [
    { domain_id: "self", type: "life", label: "Self", privacy_level: "private", active: true },
    { domain_id: "family", type: "life", label: "Family", privacy_level: "high", active: true },
    { domain_id: "health", type: "life", label: "Health", privacy_level: "high", active: true },
    { domain_id: "career", type: "life", label: "Career", privacy_level: "private", active: true },
    { domain_id: "legal", type: "life", label: "Legal", privacy_level: "high", active: true },
    { domain_id: "finance", type: "life", label: "Finance", privacy_level: "high", active: true },
    { domain_id: "time", type: "life", label: "Time", privacy_level: "private", active: true },
    { domain_id: "knowledge", type: "life", label: "Knowledge", privacy_level: "private", active: true },

    { domain_id: "stafford_media", type: "business", label: "Stafford Media Consulting", privacy_level: "business", active: true },
    { domain_id: "shopifixer", type: "business_service", label: "ShopiFixer", revenue_model: "one_time_service", privacy_level: "business", active: true },
    { domain_id: "abando", type: "business_product", label: "Abando", revenue_model: "monthly_subscription", default_mrr: 49, privacy_level: "business", active: true },
    { domain_id: "internal_dev", type: "execution", label: "Internal Dev Work", privacy_level: "business", active: true },
    { domain_id: "system", type: "system", label: "StaffordOS System", privacy_level: "system", active: true }
  ]
};

const opportunityUnits = {
  schema: "staffordos.opportunity_units.v1",
  purpose: "Sales/revenue opportunities. Opportunity is distinct from client, lead, issue, and delivery.",
  generated_at: now,
  units: clients.map((client) => ({
    unit_id: `opp_${client.client_id}`,
    unit_type: "opportunity",
    domain_id: "shopifixer",
    client_id: client.client_id,
    title: `Convert ${client.client_id} into paid ShopiFixer / Abando revenue`,
    stage: client.lifecycle?.stage === "proposal_sent" ? "proposal_sent" : "open",
    status: "open",
    owner: client.next_action?.owner || "ross",
    value: {
      one_time: Number(client.revenue?.shopifixer_one_time || client.deal?.value || 950),
      recurring_mrr: Number(client.revenue?.abando_recurring_mrr || 0),
      currency: "USD"
    },
    probability: client.lifecycle?.stage === "proposal_sent" ? 0.45 : 0.25,
    confidence: 0.72,
    source_refs: ["staffordos/clients/client_registry_v1.json"],
    next_action: client.next_action || null,
    proof_required: true,
    created_at: now,
    updated_at: now
  }))
};

const issueUnits = {
  schema: "staffordos.issue_units.v1",
  purpose: "Issue-level execution units. Audits create suspected issues; validation promotes issues into fixable work.",
  generated_at: now,
  rules: [
    "Free audit output may create suspected issues only.",
    "Suspected issues require confidence and validation before fix execution.",
    "No issue may move to fix_in_progress unless confidence_gate.status is pass or human_override is recorded."
  ],
  units: clients.map((client) => ({
    unit_id: `issue_${client.client_id}_recovery_gap`,
    unit_type: "issue",
    domain_id: "shopifixer",
    client_id: client.client_id,
    issue_type: "recovery_value_not_monetized",
    title: "Recovered merchant value has not been converted into Stafford revenue.",
    status: "suspected",
    confidence: 0.78,
    confidence_band: "medium_high",
    evidence: [
      {
        type: "abando_recovery_proof",
        value: client.abando?.merchant_revenue_recovered || 0,
        source: "client_registry_v1"
      },
      {
        type: "stafford_revenue",
        value: client.revenue?.total_lifetime_value || 0,
        source: "client_registry_v1"
      }
    ],
    validation_required: true,
    recommended_fix: "Follow up on proposal and close payment before delivery execution.",
    known_risk: "Recovered revenue is proof of value, not proof of willingness to pay.",
    created_at: now,
    updated_at: now
  }))
};

const deliveryUnits = {
  schema: "staffordos.delivery_units.v1",
  purpose: "Active execution units for paid or internal work. Supports client fixes, Abando installs, internal dev work, legal/family/career tasks.",
  generated_at: now,
  rules: [
    "Delivery units should be created after deal_closed, internal_dev_approved, or explicit Ross approval.",
    "Client-facing delivery requires proof before completion.",
    "Internal dev delivery requires build/test/proof before done."
  ],
  units: [
    ...clients.map((client) => ({
      unit_id: `delivery_${client.client_id}_shopifixer`,
      unit_type: "delivery",
      delivery_type: "client_fix",
      domain_id: "shopifixer",
      client_id: client.client_id,
      status: client.lifecycle?.stage === "proposal_sent" ? "waiting_for_payment" : "not_started",
      stage: "pre_delivery",
      owner: "ross",
      issue_refs: [`issue_${client.client_id}_recovery_gap`],
      opportunity_ref: `opp_${client.client_id}`,
      proof_required: true,
      proof_status: "not_started",
      next_action:
        client.lifecycle?.stage === "proposal_sent"
          ? "Wait for payment or follow up before starting fix delivery."
          : "Do not start delivery until opportunity is closed.",
      created_at: now,
      updated_at: now
    })),
    {
      unit_id: "delivery_internal_dev_schema_foundation_v1",
      unit_type: "delivery",
      delivery_type: "internal_dev",
      domain_id: "internal_dev",
      client_id: null,
      status: "active",
      stage: "schema_foundation",
      owner: "system",
      issue_refs: [],
      opportunity_ref: null,
      proof_required: true,
      proof_status: "created",
      next_action: "Use schema foundation to connect Ask, Operate, Memory, Opportunity, Issue, Delivery, and Outcome layers.",
      created_at: now,
      updated_at: now
    }
  ]
};

const actionUnits = {
  schema: "staffordos.action_units.v1",
  purpose: "Atomic executable actions across life and business. Actions should be linked to opportunities, issues, delivery units, or memory units.",
  generated_at: now,
  units: clients.map((client) => ({
    unit_id: `action_${client.client_id}_followup_offer`,
    unit_type: "action",
    domain_id: "shopifixer",
    linked_units: [`opp_${client.client_id}`, `delivery_${client.client_id}_shopifixer`],
    owner: "ross",
    status: "open",
    action_type: "followup",
    instructions: client.next_action?.instructions || "Follow up on offer and close payment.",
    due_at: null,
    proof_required: true,
    proof_status: "offer_sent_logged",
    created_at: now,
    updated_at: now
  }))
};

const memoryUnits = {
  schema: "staffordos.memory_units.v1",
  purpose: "Structured memory for life and business. Memory is explicit, typed, domain-scoped, and source-aware.",
  generated_at: now,
  rules: [
    "Do not mix family/private memory with business execution unless explicitly linked.",
    "Personal or family memory should be explicit and source-aware.",
    "Memory can be fact, event, insight, preference, or decision."
  ],
  units: [
    {
      memory_id: "mem_staffordos_architecture_units_of_work_v1",
      memory_type: "decision",
      domain_id: "system",
      entity_id: "staffordos",
      summary: "StaffordOS should use domains and units of work as its scalable abstraction across life, business, client work, and internal dev work.",
      confidence: 0.95,
      source: "conversation_and_repo_inventory",
      created_at: now,
      updated_at: now
    }
  ]
};

const confidenceGate = {
  schema: "staffordos.confidence_gate.v1",
  purpose: "Prevents low-confidence audit findings from becoming fix execution without validation.",
  generated_at: now,
  thresholds: {
    auto_fix_allowed_min_confidence: 0.9,
    human_validation_required_below: 0.9,
    block_below: 0.55
  },
  rules: [
    {
      rule_id: "audit_to_issue",
      description: "Free audit output may create issue units, but issue units remain suspected until validated.",
      required_fields: ["issue_type", "confidence", "evidence", "validation_required"]
    },
    {
      rule_id: "issue_to_delivery",
      description: "Issue cannot move into fix execution unless confidence >= 0.9 or Ross approves validation.",
      hard_gate: true
    },
    {
      rule_id: "delivery_to_done",
      description: "Delivery cannot be marked done without proof_status = verified or explicit exception.",
      hard_gate: true
    }
  ]
};

const outcomeEventLog = {
  schema: "staffordos.outcome_event_log.v1",
  purpose: "Append-only event log for actions, offers, replies, payments, fixes, verification, failures, and learning outcomes.",
  generated_at: now,
  events: [
    {
      event_id: `evt_schema_foundation_${Date.now()}`,
      event_type: "schema_foundation_locked",
      domain_id: "system",
      linked_units: ["delivery_internal_dev_schema_foundation_v1"],
      actor: "system",
      summary: "Non-destructive schema foundation created for domains, opportunities, issues, delivery, actions, memory, confidence gates, and outcomes.",
      outcome: "created",
      created_at: now
    }
  ]
};

const snapshot = {
  schema: "staffordos.unit_work_snapshot.v1",
  generated_at: now,
  summary: {
    domains: domainRegistry.domains.length,
    opportunities: opportunityUnits.units.length,
    issues: issueUnits.units.length,
    delivery_units: deliveryUnits.units.length,
    actions: actionUnits.units.length,
    memory_units: memoryUnits.units.length,
    outcome_events: outcomeEventLog.events.length
  },
  open_work: [
    ...opportunityUnits.units.map((u) => ({
      unit_id: u.unit_id,
      type: "opportunity",
      domain_id: u.domain_id,
      status: u.status,
      stage: u.stage,
      owner: u.owner,
      next_action: u.next_action?.instructions || "Review opportunity."
    })),
    ...deliveryUnits.units.map((u) => ({
      unit_id: u.unit_id,
      type: "delivery",
      domain_id: u.domain_id,
      status: u.status,
      stage: u.stage,
      owner: u.owner,
      next_action: u.next_action
    })),
    ...actionUnits.units.map((u) => ({
      unit_id: u.unit_id,
      type: "action",
      domain_id: u.domain_id,
      status: u.status,
      owner: u.owner,
      next_action: u.instructions
    }))
  ]
};

writeJson("staffordos/domains/domain_registry_v1.json", domainRegistry);
writeJson("staffordos/units/opportunity_units_v1.json", opportunityUnits);
writeJson("staffordos/units/issue_units_v1.json", issueUnits);
writeJson("staffordos/units/delivery_units_v1.json", deliveryUnits);
writeJson("staffordos/units/action_units_v1.json", actionUnits);
writeJson("staffordos/memory/memory_units_v1.json", memoryUnits);
writeJson("staffordos/gates/confidence_gate_v1.json", confidenceGate);
writeJson("staffordos/events/outcome_event_log_v1.json", outcomeEventLog);
writeJson("staffordos/snapshots/unit_work_snapshot_v1.json", snapshot);

console.log(JSON.stringify({
  ok: true,
  generated_at: now,
  created: snapshot.summary,
  note: "Non-destructive pass: existing leads, clients, proofs, and UI were not replaced."
}, null, 2));
