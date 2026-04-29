import fs from "node:fs";
import path from "node:path";

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
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

function leadIdFromStore(store) {
  return `lead_${normalizeStore(store)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}`;
}

const TRACKING_RULES = {
  audit_result_viewed: {
    stage: "audit_result_viewed",
    next_action: "Move visitor to pricing page",
    engagement_key: "audit_viewed"
  },
  pricing_viewed: {
    stage: "pricing_viewed",
    next_action: "Convert to payment or follow up",
    engagement_key: "experience_viewed"
  },
  onboarding_started: {
    stage: "onboarding_started",
    next_action: "Begin fix intake and capture baseline",
    engagement_key: "onboarding_started"
  }
};

export function trackShopifixerLifecycle({ repoRoot, store, eventType, metadata = {} }) {
  const now = new Date().toISOString();
  const domain = normalizeStore(store);
  const leadId = leadIdFromStore(domain);
  const rule = TRACKING_RULES[eventType];

  if (!domain) {
    return { ok: false, error: "missing_store" };
  }

  if (!rule) {
    return { ok: false, error: "unsupported_event_type" };
  }

  const registryPath = path.join(repoRoot, "staffordos/leads/lead_registry_v1.json");
  const eventsPath = path.join(repoRoot, "staffordos/leads/lead_events_v1.json");

  const registry = readJson(registryPath, {
    version: "lead_registry_v1",
    schema: "canonical_lead_registry_v1",
    items: []
  });

  const events = readJson(eventsPath, {
    version: "lead_events_v1",
    schema: "canonical_lead_events_v1",
    events: []
  });

  if (!Array.isArray(registry.items)) registry.items = [];
  if (!Array.isArray(events.events)) events.events = [];

  const idx = registry.items.findIndex((x) => x.id === leadId || x.lead_id === leadId);
  if (idx < 0) {
    events.events.push({
      id: `event_${leadId}_${Date.now()}`,
      lead_id: leadId,
      event_type: `${eventType}_unmatched`,
      source: "staffordmedia_shopifixer",
      payload: { store: domain, metadata },
      created_at: now
    });
    writeJson(eventsPath, events);
    return { ok: false, error: "lead_not_found", leadId };
  }

  const lead = registry.items[idx];

  lead.lifecycle_stage = rule.stage;
  lead.status = {
    ...(lead.status || {}),
    current_stage: rule.stage,
    current_bottleneck: eventType === "onboarding_started" ? "delivery" : "conversion",
    next_action: rule.next_action
  };

  lead.engagement = {
    ...(lead.engagement || {}),
    [rule.engagement_key]: true
  };

  lead.updated_at = now;
  registry.items[idx] = lead;
  registry.normalized_at = now;

  events.events.push({
    id: `event_${leadId}_${Date.now()}`,
    lead_id: leadId,
    event_type: eventType,
    source: "staffordmedia_shopifixer",
    payload: { store: domain, metadata },
    created_at: now
  });

  writeJson(registryPath, registry);
  writeJson(eventsPath, events);

  return { ok: true, leadId, eventType, stage: rule.stage };
}
