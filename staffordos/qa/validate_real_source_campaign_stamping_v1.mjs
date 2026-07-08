import { existsSync, readFileSync } from "node:fs";
import {
  loadCampaignRegistry,
  resolveLeadCampaignId,
  summarizeSourceCampaignAttribution,
} from "../leads/campaign_attribution_v1.mjs";

const LEAD_REGISTRY_PATH = "staffordos/leads/lead_registry_v1.json";
const CAMPAIGN_REGISTRY_PATH = "staffordos/campaigns/campaign_registry_v1.json";

function readJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

const failures = [];
const campaignRegistry = loadCampaignRegistry(CAMPAIGN_REGISTRY_PATH);
const leadRegistry = readJson(LEAD_REGISTRY_PATH, { items: [] });
const leadItems = Array.isArray(leadRegistry.items) ? leadRegistry.items : [];

assert(existsSync(CAMPAIGN_REGISTRY_PATH), "campaign_registry_missing", failures);
assert(existsSync(LEAD_REGISTRY_PATH), "lead_registry_missing", failures);
assert(campaignRegistry.records.length > 0, "campaign_registry_not_loaded", failures);
assert(leadItems.length === 13, "existing_13_leads_not_compatible", failures);

const validSource = {
  items: [
    {
      id: "source_valid_001",
      domain: "valid.example",
      campaign_id: "campaign_shopifixer_outreach_001",
      source: "real_source",
    },
  ],
};

const invalidSource = {
  items: [
    {
      id: "source_invalid_001",
      domain: "invalid.example",
      campaign_id: "campaign_invalid_999",
      source: "real_source",
    },
  ],
};

const missingSource = {
  items: [
    {
      id: "source_missing_001",
      domain: "missing.example",
      source: "real_source",
    },
  ],
};

const validSummary = summarizeSourceCampaignAttribution(validSource, campaignRegistry);
const invalidSummary = summarizeSourceCampaignAttribution(invalidSource, campaignRegistry);
const missingSummary = summarizeSourceCampaignAttribution(missingSource, campaignRegistry);

assert(
  validSummary.canonical_campaign_ids.length === 1 &&
    validSummary.canonical_campaign_ids[0] === "campaign_shopifixer_outreach_001",
  "valid_campaign_id_not_preserved",
  failures
);
assert(
  invalidSummary.canonical_campaign_ids.length === 0 && invalidSummary.invalid_campaign_ids.includes("campaign_invalid_999"),
  "invalid_campaign_id_not_ignored",
  failures
);
assert(
  missingSummary.canonical_campaign_ids.length === 0 && missingSummary.invalid_campaign_ids.length === 0,
  "missing_campaign_id_not_safe",
  failures
);

const resolvedValid = resolveLeadCampaignId({}, validSource.items[0], {}, campaignRegistry);
const resolvedInvalid = resolveLeadCampaignId({}, invalidSource.items[0], {}, campaignRegistry);
const resolvedMissing = resolveLeadCampaignId({}, missingSource.items[0], {}, campaignRegistry);

assert(resolvedValid === "campaign_shopifixer_outreach_001", "valid_campaign_id_not_resolved", failures);
assert(resolvedInvalid === undefined, "invalid_campaign_id_not_rejected", failures);
assert(resolvedMissing === undefined, "missing_campaign_id_not_optional", failures);

const result = {
  schema: "staffordos.real_source_campaign_stamping_validation.v1",
  generated_at: new Date().toISOString(),
  status: failures.length ? "failed" : "passed",
  checks: {
    valid_campaign_id_survives_source_summary_processing:
      failures.indexOf("valid_campaign_id_not_preserved") === -1 && failures.indexOf("valid_campaign_id_not_resolved") === -1,
    invalid_campaign_id_is_ignored:
      failures.indexOf("invalid_campaign_id_not_ignored") === -1 && failures.indexOf("invalid_campaign_id_not_rejected") === -1,
    missing_campaign_id_is_safe:
      failures.indexOf("missing_campaign_id_not_safe") === -1 && failures.indexOf("missing_campaign_id_not_optional") === -1,
    registry_gating_enforced: campaignRegistry.records.length > 0,
    existing_leads_unchanged: leadItems.length === 13,
  },
  failures,
};

console.log(JSON.stringify(result, null, 2));

if (failures.length) {
  process.exit(1);
}
