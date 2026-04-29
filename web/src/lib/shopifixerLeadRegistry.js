import fs from "node:fs";
import path from "node:path";

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function safeWriteJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function normalizeStore(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function leadIdFromStore(storeUrl) {
  return `lead_${normalizeStore(storeUrl)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}`;
}

export function upsertShopifixerLead({ repoRoot, storeUrl, email, analysis }) {
  const now = new Date().toISOString();
  const domain = normalizeStore(storeUrl);
  const leadId = leadIdFromStore(domain);

  const registryPath = path.join(repoRoot, "staffordos/leads/lead_registry_v1.json");
  const eventsPath = path.join(repoRoot, "staffordos/leads/lead_events_v1.json");

  const registry = safeReadJson(registryPath, {
    version: "lead_registry_v1",
    schema: "canonical_lead_registry_v1",
    items: []
  });

  const events = safeReadJson(eventsPath, {
    version: "lead_events_v1",
    schema: "canonical_lead_events_v1",
    events: []
  });

  if (!Array.isArray(registry.items)) registry.items = [];
  if (!Array.isArray(events.events)) events.events = [];

  const idx = registry.items.findIndex((x) => x.id === leadId || x.lead_id === leadId);
  const existing = idx >= 0 ? registry.items[idx] : {};

  const lead = {
    ...existing,
    id: leadId,
    lead_id: leadId,
    name: existing.name || domain,
    domain,
    product: "shopifixer",
    product_surface: "staffordmedia_shopifixer",
    source: "staffordmedia",
    lifecycle_stage: email ? "inbound_contact_ready" : "inbound_contact_needed",
    status: {
      ...(existing.status || {}),
      current_stage: email ? "inbound_contact_ready" : "inbound_contact_needed",
      current_bottleneck: email ? "audit_delivery" : "contact",
      next_action: email
        ? "Send full ShopiFixer audit email"
        : "Capture valid email before audit delivery"
    },
    score: typeof existing.score === "number" ? existing.score : 0,
    contact: {
      ...(existing.contact || {}),
      email: email || existing.contact?.email || "",
      confidence: email ? "submitted_by_visitor" : existing.contact?.confidence || "missing"
    },
    engagement: {
      audit_viewed: false,
      experience_viewed: false,
      replied: false,
      approved_for_send: false,
      dry_run_ready: false,
      sent: false,
      ...(existing.engagement || {})
    },
    routing: {
      primary_offer: "shopifixer_audit",
      secondary_offer: "abando_recovery",
      do_not_cross_sell_until: "qualified",
      rule: "ShopiFixer first; Abando only after leak diagnosed",
      ...(existing.routing || {})
    },
    refs: {
      outreach_queue: false,
      approval_queue_ids: [],
      send_ledger_ids: [],
      reply_ids: [],
      ...(existing.refs || {})
    },
    execution: {
      channel: "inbound_form",
      send_target: email || null,
      message: null,
      follow_up_message: null,
      ...(existing.execution || {})
    },
    payment: {
      status: null,
      url: null,
      ...(existing.payment || {})
    },
    problem_summary: analysis?.summary || analysis?.primaryIssue || null,
    runtime_source: "web/src/index.js:/api/fix-audit",
    created_at: existing.created_at || now,
    updated_at: now
  };

  if (idx >= 0) registry.items[idx] = lead;
  else registry.items.unshift(lead);

  registry.normalized_at = now;
  registry.source = "staffordmedia_shopifixer_inbound";

  events.events.push({
    id: `event_${leadId}_${Date.now()}`,
    lead_id: leadId,
    event_type: idx >= 0 ? "shopifixer_lead_updated" : "shopifixer_lead_created",
    source: "staffordmedia_shopifixer",
    payload: {
      storeUrl: domain,
      email_present: Boolean(email),
      analysis_present: Boolean(analysis)
    },
    created_at: now
  });

  safeWriteJson(registryPath, registry);
  safeWriteJson(eventsPath, events);

  return { leadId, lead, registryPath, eventsPath };
}
