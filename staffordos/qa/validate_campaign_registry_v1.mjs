import { existsSync, readFileSync } from "node:fs";

const REGISTRY_PATH = "staffordos/campaigns/campaign_registry_v1.json";
const LEAD_REGISTRY_PATH = "staffordos/leads/lead_registry_v1.json";
const VALID_CAMPAIGN_TYPES = new Set([
  "shopifixer_outreach",
  "shopifixer_close_engine",
  "fulfillment_delivery",
  "referral_expansion",
  "dormant_reactivation",
]);

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

function isStableString(value) {
  return typeof value === "string" && value.trim() === value && /^campaign_[a-z0-9_]+_\d{3}$/.test(value);
}

const failures = [];
const registry = readJson(REGISTRY_PATH, null);
const leads = readJson(LEAD_REGISTRY_PATH, { items: [] });
const records = Array.isArray(registry?.records) ? registry.records : [];
const leadItems = Array.isArray(leads?.items) ? leads.items : [];

assert(existsSync(REGISTRY_PATH), "registry_missing", failures);
assert(records.length > 0, "registry_has_no_records", failures);
assert(leadItems.length === 13, "existing_13_leads_not_compatible", failures);

const seenIds = new Set();
for (const record of records) {
  assert(Boolean(record && typeof record === "object"), "invalid_record_shape", failures);
  assert(isStableString(record.campaign_id), `invalid_campaign_id:${record?.campaign_id || ""}`, failures);
  assert(!seenIds.has(record.campaign_id), `duplicate_campaign_id:${record.campaign_id}`, failures);
  seenIds.add(record.campaign_id);
  assert(VALID_CAMPAIGN_TYPES.has(record.campaign_type), `invalid_campaign_type:${record.campaign_type}`, failures);
  assert(typeof record.status === "string" && record.status.trim().length > 0, `invalid_status:${record.campaign_id}`, failures);
  assert(typeof record.owner === "string" && record.owner.trim().length > 0, `invalid_owner:${record.campaign_id}`, failures);
  assert(typeof record.product === "string" && record.product.trim().length > 0, `invalid_product:${record.campaign_id}`, failures);
  assert(typeof record.created_at === "string" && record.created_at.trim().length > 0, `invalid_created_at:${record.campaign_id}`, failures);
}

const typesInRegistry = new Set(records.map((record) => record.campaign_type));
for (const campaignType of VALID_CAMPAIGN_TYPES) {
  assert(typesInRegistry.has(campaignType), `missing_campaign_type:${campaignType}`, failures);
}

assert(
  leadItems.every((lead) => lead && typeof lead === "object" && !Object.prototype.hasOwnProperty.call(lead, "campaign_id")),
  "lead_mutation_required_for_registry",
  failures
);

const result = {
  schema: "staffordos.campaign_registry_validation.v1",
  generated_at: new Date().toISOString(),
  status: failures.length ? "failed" : "passed",
  checks: {
    registry_exists: existsSync(REGISTRY_PATH),
    unique_campaign_ids: failures.every((failure) => !String(failure).startsWith("duplicate_campaign_id:")),
    stable_campaign_id_strings: failures.every((failure) => !String(failure).startsWith("invalid_campaign_id:")),
    valid_campaign_types: failures.every((failure) => !String(failure).startsWith("invalid_campaign_type:") && !String(failure).startsWith("missing_campaign_type:")),
    no_lead_mutation_required: failures.indexOf("lead_mutation_required_for_registry") === -1,
    existing_leads_compatible: failures.indexOf("existing_13_leads_not_compatible") === -1,
  },
  failures,
};

console.log(JSON.stringify(result, null, 2));

if (failures.length) {
  process.exit(1);
}
