import { readFileSync, existsSync } from "node:fs";
import {
  loadCampaignRegistry,
  resolveCanonicalCampaignId,
  resolveLeadCampaignId,
  normalizeOptionalCampaignId,
} from "../leads/campaign_attribution_v1.mjs";

const REGISTRY_PATH = "staffordos/leads/lead_registry_v1.json";

function readJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function syncLeadLikePath(existing, outreachItem = {}, contactItem = {}) {
  const registry = loadCampaignRegistry();
  return {
    lead_id: existing?.lead_id || `lead_${String(existing?.domain || outreachItem.domain || contactItem.domain || "unknown").replace(/[^a-z0-9]/gi, "_")}`,
    domain: existing?.domain || outreachItem.domain || contactItem.domain || null,
    source: outreachItem.source || contactItem.source || existing?.source || "staffordos",
    campaign_id: resolveLeadCampaignId(existing, outreachItem, contactItem, registry) || null,
    created_at: existing?.created_at || "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  };
}

function loadLeadLikePath(input) {
  return {
    id: String(input.id || input.lead_id || input.domain || input.name || ""),
    lead_id: String(input.lead_id || input.id || input.domain || input.name || ""),
    domain: String(input.domain || input.url || ""),
    campaign_id: normalizeOptionalCampaignId(input.campaign_id || input.campaign?.campaign_id),
    source: String(input.source || "unknown"),
    lifecycle_stage: String(input.lifecycle_stage || input.status?.current_stage || input.status || "new"),
    status: input.status || null,
    contact: input.contact || {},
    engagement: input.engagement || {},
    routing: input.routing || {},
    refs: input.refs || {},
    created_at: input.created_at || null,
    updated_at: input.updated_at || null
  };
}

function relationshipLeadFacetPath(record) {
  return {
    lead_id: record.lead_id || record.id || null,
    campaign_id: record.campaign_id || null,
    name: record.name || record.domain || null,
    domain: record.domain || null,
    email: record.contact?.email || record.email || record.send_target || null,
    current_stage: record.status?.current_stage || record.lifecycle_stage || null,
    next_action: record.status?.next_action || record.next_action?.instructions || record.next_action || null,
    status: record.status?.current_stage || record.lifecycle_stage || record.status || null,
    score: Number.isFinite(Number(record.score)) ? Number(record.score) : null,
    temperature: record.status?.temperature || record.temperature || null,
    sent: Boolean(record.engagement?.sent || record.sent),
    replied: Boolean(record.engagement?.replied || record.replied),
    blocked: Boolean(record.blocked || record.status?.blocked)
  };
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

const failures = [];
const registry = readJson(REGISTRY_PATH, { items: [] });
const items = Array.isArray(registry.items) ? registry.items : [];
const campaignRegistry = loadCampaignRegistry();

assert(items.length === 13, `expected_13_leads_found_${items.length}`, failures);

const normalizedExistingLeads = items.map((item) => loadLeadLikePath(item));
assert(
  normalizedExistingLeads.every((lead) => lead.lead_id && lead.domain !== undefined),
  "existing_leads_failed_lead_load_normalization",
  failures
);
assert(
  normalizedExistingLeads.every((lead) => lead.campaign_id === null),
  "existing_leads_should_remain_campaign_id_optional",
  failures
);

const campaignLead = syncLeadLikePath(
  { lead_id: "lead_example", domain: "example.com", source: "staffordos" },
  { domain: "example.com", campaign_id: "campaign_shopifixer_outreach_001" },
  {}
);
assert(
  campaignLead.campaign_id === "campaign_shopifixer_outreach_001",
  "campaign_id_not_preserved_on_sync_path",
  failures
);

const whitespaceCampaignLead = syncLeadLikePath(
  { lead_id: "lead_example_ws", domain: "example.org", source: "staffordos" },
  { domain: "example.org", campaign_id: "  campaign_shopifixer_outreach_001  " },
  {}
);
assert(
  whitespaceCampaignLead.campaign_id === "campaign_shopifixer_outreach_001",
  "whitespace_campaign_id_not_normalized_on_sync_path",
  failures
);

const invalidCampaignLead = syncLeadLikePath(
  { lead_id: "lead_example_invalid", domain: "invalid.example", source: "staffordos" },
  { domain: "invalid.example", campaign_id: "campaign_invalid_999" },
  {}
);
assert(
  invalidCampaignLead.campaign_id === null,
  "invalid_campaign_id_not_rejected_on_sync_path",
  failures
);

const missingCampaignLead = syncLeadLikePath(
  { lead_id: "lead_example_missing", domain: "missing.example", source: "staffordos" },
  { domain: "missing.example" },
  {}
);
assert(
  missingCampaignLead.campaign_id === null,
  "missing_campaign_id_not_optional_on_sync_path",
  failures
);

const loadCampaignLead = loadLeadLikePath({
  lead_id: "lead_loaded",
  domain: "loaded.example",
  campaign_id: "campaign_shopifixer_outreach_001",
  source: "staffordos",
  contact: { email: "", confidence: "low" },
  status: { current_stage: "new" }
});
assert(
  loadCampaignLead.campaign_id === "campaign_shopifixer_outreach_001",
  "campaign_id_not_preserved_on_load_path",
  failures
);

const relationshipFacet = relationshipLeadFacetPath(loadCampaignLead);
assert(
  relationshipFacet.campaign_id === "campaign_shopifixer_outreach_001",
  "relationship_facet_missing_campaign_id_when_present",
  failures
);

const relationshipFacetWithoutCampaign = relationshipLeadFacetPath(normalizedExistingLeads[0] || {});
assert(
  relationshipFacetWithoutCampaign.campaign_id === null,
  "relationship_facet_should_allow_missing_campaign_id",
  failures
);

const result = {
  schema: "staffordos.campaign_id_path_validation.v1",
  generated_at: new Date().toISOString(),
  status: failures.length ? "failed" : "passed",
  checks: {
    existing_leads_compatible: failures.indexOf("existing_leads_failed_lead_load_normalization") === -1 &&
      failures.indexOf("existing_leads_should_remain_campaign_id_optional") === -1,
    campaign_id_preserved_on_sync: failures.indexOf("campaign_id_not_preserved_on_sync_path") === -1,
    campaign_id_normalized: failures.indexOf("whitespace_campaign_id_not_normalized_on_sync_path") === -1,
    campaign_id_rejected_when_invalid: failures.indexOf("invalid_campaign_id_not_rejected_on_sync_path") === -1,
    campaign_id_optional_when_missing: failures.indexOf("missing_campaign_id_not_optional_on_sync_path") === -1,
    campaign_id_preserved_on_load: failures.indexOf("campaign_id_not_preserved_on_load_path") === -1,
    relationship_facet_exposes_campaign_id: failures.indexOf("relationship_facet_missing_campaign_id_when_present") === -1,
    registry_still_valid: campaignRegistry.records.length > 0 && resolveCanonicalCampaignId("campaign_shopifixer_outreach_001", campaignRegistry) === "campaign_shopifixer_outreach_001",
  },
  failures
};

console.log(JSON.stringify(result, null, 2));

if (failures.length) {
  process.exit(1);
}
