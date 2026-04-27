import { existsSync, readFileSync, writeFileSync } from "node:fs";

const OUTREACH = "staffordos/leads/outreach_queue.json";
const CONTACT_RESEARCH = "staffordos/leads/contact_research_queue.json";
const APPROVAL_QUEUE = "staffordos/leads/approval_queue_v1.json";
const SEND_LEDGER = "staffordos/leads/send_ledger_v1.json";
const REPLY_INTERPRETATION = "staffordos/leads/reply_interpretation_v1.json";
const OUTCOMES = "staffordos/leads/outcomes.json";
const REGISTRY = "staffordos/leads/lead_registry_v1.json";
const EVENTS = "staffordos/leads/lead_events_v1.json";
const ROUTING_POLICY = "staffordos/leads/lead_routing_policy_v1.json";
const LOG = "staffordos/leads/lead_registry_sync_log_v1.json";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function normalizeDomain(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function leadId(domain) {
  return `lead_${normalizeDomain(domain).replace(/[^a-z0-9]/gi, "_")}`;
}

function inferProductIntent(item = {}) {
  const haystack = [
    item.message_type,
    item.product,
    item.notes,
    item.source_intent,
    item.product_surface,
    item.domain
  ].map((value) => String(value || "").toLowerCase()).join(" ");

  for (const rule of routingPolicy.intent_rules || []) {
    const matches = Array.isArray(rule.match_any) ? rule.match_any : [];
    if (matches.some((keyword) => haystack.includes(String(keyword).toLowerCase()))) {
      return rule.product_intent || routingPolicy.default_product_intent || "shopifixer";
    }
  }

  return routingPolicy.default_product_intent || "shopifixer";
}

function routingFor(intent) {
  if (intent === "abando") {
    return {
      primary_offer: "abando_recovery",
      secondary_offer: "staffordmedia_services",
      do_not_cross_sell_until: "qualified"
    };
  }

  return {
    primary_offer: "shopifixer_audit",
    secondary_offer: "abando_recovery",
    do_not_cross_sell_until: "qualified"
  };
}

function currentStage({ outreachItem, contactItem, approvals, ledgerItems, replies }) {
  if (replies.length > 0) return "engaged";
  if (ledgerItems.some(x => x.status === "sent")) return "sent";
  if (ledgerItems.some(x => x.status === "dry_run_ready")) return "dry_run_ready";
  if (ledgerItems.length > 0) return "ledgered";
  if (approvals.some(x => x.status === "approved")) return "approved";
  if (approvals.some(x => x.status === "pending_review")) return "pending_approval";
  if (outreachItem?.subject && outreachItem?.body) return "message_ready";
  if (!outreachItem?.email && !contactItem?.contact_email) return "contact_needed";
  return "cold";
}

function outcomeForDomain(domain) {
  const normalized = normalizeDomain(domain);
  return outcomes.find((entry) => normalizeDomain(entry?.domain || "") === normalized) || null;
}

function abandoSignalsForOutcome(outcome = null) {
  return {
    audit_viewed: Boolean(outcome?.audit_opened),
    experience_viewed: Boolean(outcome?.experience_opened),
    recovery_sent: Boolean(outcome?.recovery_sent),
    return_tracked: Boolean(outcome?.return_tracked),
    status: String(outcome?.status || "")
  };
}

function bottleneckFor(stage) {
  const map = {
    cold: ["routing", "Move lead into contact or message workflow."],
    contact_needed: ["contact", "Find or add valid contact email."],
    message_ready: ["approval", "Validate and move message to approval queue."],
    pending_approval: ["approval", "Review, approve, reject, or hold."],
    approved: ["send_ledger", "Move approved item into send ledger."],
    ledgered: ["send_execution", "Run dry-run send execution."],
    dry_run_ready: ["live_send_locked", "Keep blocked until explicit live-send unlock."],
    sent: ["reply", "Watch for reply or follow-up window."],
    engaged: ["qualification", "Qualify intent and route next offer."],
    qualified: ["close", "Move to service/product close path."],
    customer: ["success", "Track fulfilled revenue."],
    stopped: ["stopped", "No next action."]
  };
  const [current_bottleneck, next_action] = map[stage] || ["unknown", "Inspect lead state."];
  return { current_bottleneck, next_action };
}

const outreach = readJson(OUTREACH, []);
const contactResearch = readJson(CONTACT_RESEARCH, []);
const approvalDoc = readJson(APPROVAL_QUEUE, { version: "approval_queue_v1", items: [] });
const approvals = Array.isArray(approvalDoc.items) ? approvalDoc.items : [];
const ledgerDoc = readJson(SEND_LEDGER, { version: "send_ledger_v1", items: [] });
const ledger = Array.isArray(ledgerDoc.items) ? ledgerDoc.items : [];
const replyDoc = readJson(REPLY_INTERPRETATION, { version: "reply_interpretation_v1", items: [] });
const replies = Array.isArray(replyDoc.items) ? replyDoc.items : [];
const outcomes = readJson(OUTCOMES, []);

const routingPolicy = readJson(ROUTING_POLICY, {
  default_product_intent: "shopifixer",
  products: {},
  intent_rules: []
});

const registry = readJson(REGISTRY, { version: "lead_registry_v1", items: [] });
registry.version = "lead_registry_v1";
registry.items = Array.isArray(registry.items) ? registry.items : [];

const events = readJson(EVENTS, { version: "lead_events_v1", items: [] });
events.version = "lead_events_v1";
events.items = Array.isArray(events.items) ? events.items : [];

const byDomain = new Map(registry.items.map(item => [normalizeDomain(item.domain), item]));

const domains = new Set([
  ...outreach.map(x => normalizeDomain(x.domain)),
  ...contactResearch.map(x => normalizeDomain(x.domain)),
  ...approvals.map(x => normalizeDomain(x.domain)),
  ...ledger.map(x => normalizeDomain(x.domain)),
  ...replies.map(x => normalizeDomain(x.domain)),
  ...outcomes.map(x => normalizeDomain(x.domain))
].filter(Boolean));

let created = 0;
let updated = 0;

for (const domain of domains) {
  const outreachItem = outreach.find(x => normalizeDomain(x.domain) === domain) || {};
  const contactItem = contactResearch.find(x => normalizeDomain(x.domain) === domain) || {};
  const approvalItems = approvals.filter(x => normalizeDomain(x.domain) === domain);
  const ledgerItems = ledger.filter(x => normalizeDomain(x.domain) === domain);
  const replyItems = replies.filter(x => normalizeDomain(x.domain) === domain);
  const outcomeItem = outcomes.find(x => normalizeDomain(x.domain) === domain) || null;

  const existing = byDomain.get(domain) || null;
  let intent = inferProductIntent(outreachItem);

  // Override intent if Abando outcome signals exist (source-of-truth correction)
  if (outcomeItem && (outcomeItem.recovery_sent || outcomeItem.return_tracked)) {
    intent = "abando";
  }
  const stage = currentStage({ outreachItem, contactItem, approvals: approvalItems, ledgerItems, replies: replyItems });
  const status = bottleneckFor(stage);
  const now = new Date().toISOString();

  const next = {
    lead_id: existing?.lead_id || leadId(domain),
    domain,
    source: outreachItem.source || contactItem.source || "staffordos",
    lead_state: stage,
    product_intent: existing?.product_intent || intent,
    product_surface: intent === "abando" ? "abando_marketing" : "staffordmedia_shopifixer",
    contact: {
      email: outreachItem.email || contactItem.contact_email || existing?.contact?.email || "",
      name: contactItem.contact_name || existing?.contact?.name || "",
      role: contactItem.contact_role || existing?.contact?.role || "",
      confidence: contactItem.contact_status || existing?.contact?.confidence || "none"
    },
    engagement: {
      audit_viewed: Boolean(outcomeItem?.audit_opened || existing?.engagement?.audit_viewed),
      experience_viewed: Boolean(outcomeItem?.experience_opened || existing?.engagement?.experience_viewed),
      replied: replyItems.length > 0 || Boolean(outreachItem.replied),
      approved_for_send: approvalItems.some(x => x.status === "approved"),
      dry_run_ready: ledgerItems.some(x => x.status === "dry_run_ready"),
      sent: ledgerItems.some(x => x.status === "sent") || Boolean(outreachItem.sent),
      recovery_sent: Boolean(outcomeItem?.recovery_sent || existing?.engagement?.recovery_sent),
      return_tracked: Boolean(outcomeItem?.return_tracked || existing?.engagement?.return_tracked),
      recovered_revenue: outcomeItem?.recovered_revenue || existing?.engagement?.recovered_revenue || null
    },
    routing: routingFor(intent),
    status: {
      current_stage: stage,
      ...status
    },
    refs: {
      outreach_queue: Boolean(outreachItem.domain),
      approval_queue_ids: approvalItems.map(x => x.id).filter(Boolean),
      send_ledger_ids: ledgerItems.map(x => x.id).filter(Boolean),
      reply_ids: replyItems.map(x => x.id).filter(Boolean),
      outcome: Boolean(outcomeItem)
    },
    created_at: existing?.created_at || now,
    updated_at: now
  };

  byDomain.set(domain, next);

  if (existing) updated += 1;
  else {
    created += 1;
    events.items.push({
      id: `event_${next.lead_id}_${Date.now()}`,
      lead_id: next.lead_id,
      domain,
      event_type: "lead_registered",
      product_intent: next.product_intent,
      source: "lead_registry_sync_agent_v1",
      observed_sources: {
        outreach_queue: Boolean(outreachItem),
        contact_research_queue: Boolean(contactItem),
        approval_queue: approvals.length > 0,
        send_ledger: ledgerItems.length > 0,
        reply_interpretation: replies.length > 0,
        outcomes: Boolean(outcomeItem)
      },
      created_at: now
    });
  }
}

registry.items = Array.from(byDomain.values()).sort((a, b) => a.domain.localeCompare(b.domain));
writeJson(REGISTRY, registry);
writeJson(EVENTS, events);

const log = readJson(LOG, []);
log.push({
  agent: "lead_registry_sync_agent_v1",
  created,
  updated,
  total: registry.items.length,
  at: new Date().toISOString()
});
writeJson(LOG, log);

console.log(JSON.stringify({
  ok: true,
  agent: "lead_registry_sync_agent_v1",
  created,
  updated,
  total: registry.items.length
}, null, 2));
