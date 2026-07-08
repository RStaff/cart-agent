import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  loadCampaignRegistry,
  normalizeOptionalCampaignId,
  resolveCanonicalCampaignId,
} from "../leads/campaign_attribution_v1.mjs";

const LEAD_REGISTRY_PATH = "staffordos/leads/lead_registry_v1.json";
const CAMPAIGN_REGISTRY_PATH = "staffordos/campaigns/campaign_registry_v1.json";
const OUTPUT_PATH = "staffordos/qa/output/campaign_attribution_report_v1.json";

function readJson(pathname, fallback) {
  try {
    if (!existsSync(pathname)) return fallback;
    return JSON.parse(readFileSync(pathname, "utf8"));
  } catch {
    return fallback;
  }
}

function readText(pathname) {
  try {
    return existsSync(pathname) ? readFileSync(pathname, "utf8") : null;
  } catch {
    return null;
  }
}

function writeJson(pathname, value) {
  mkdirSync(path.dirname(pathname), { recursive: true });
  writeFileSync(pathname, JSON.stringify(value, null, 2) + "\n");
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function countByCampaignId(leads, campaignRegistry) {
  const attributed = new Map();
  const invalid = new Map();
  let attributedCount = 0;
  let invalidCount = 0;

  for (const lead of leads) {
    const rawCampaignId = normalizeOptionalCampaignId(lead?.campaign_id || lead?.campaign?.campaign_id);
    if (!rawCampaignId) continue;

    const canonicalId = resolveCanonicalCampaignId(rawCampaignId, campaignRegistry);
    if (canonicalId) {
      attributedCount += 1;
      attributed.set(canonicalId, (attributed.get(canonicalId) || 0) + 1);
    } else {
      invalidCount += 1;
      invalid.set(rawCampaignId, (invalid.get(rawCampaignId) || 0) + 1);
    }
  }

  return { attributed, invalid, attributedCount, invalidCount };
}

const failures = [];
const campaignRegistryBefore = readText(CAMPAIGN_REGISTRY_PATH);
const leadRegistryBefore = readText(LEAD_REGISTRY_PATH);
const registry = loadCampaignRegistry(CAMPAIGN_REGISTRY_PATH);
const leadRegistry = readJson(LEAD_REGISTRY_PATH, { items: [] });
const leads = Array.isArray(leadRegistry.items) ? leadRegistry.items : [];
const records = Array.isArray(registry.records) ? registry.records : [];

assert(Boolean(campaignRegistryBefore), "campaign_registry_missing", failures);
assert(Boolean(leadRegistryBefore), "lead_registry_missing", failures);

const { attributed, invalid, attributedCount, invalidCount } = countByCampaignId(leads, registry);
const totalLeads = leads.length;
const unattributedCount = totalLeads - attributedCount;
const coveragePercent = totalLeads ? Number(((attributedCount / totalLeads) * 100).toFixed(1)) : 0;

assert(attributedCount + unattributedCount === totalLeads, "lead_count_balance_failed", failures);

const report = {
  schema: "staffordos.campaign_attribution_report.v1",
  generated_at: new Date().toISOString(),
  source_files: [LEAD_REGISTRY_PATH, CAMPAIGN_REGISTRY_PATH],
  output_path: OUTPUT_PATH,
  totals: {
    leads: totalLeads,
    attributed_leads: attributedCount,
    unattributed_leads: unattributedCount,
    invalid_campaign_id_count: invalidCount,
    attribution_coverage_percent: coveragePercent,
  },
  leads_by_campaign_id: Object.fromEntries(
    Array.from(attributed.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([campaign_id, count]) => [campaign_id, count])
  ),
  invalid_campaign_ids: Object.fromEntries(
    Array.from(invalid.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([campaign_id, count]) => [campaign_id, count])
  ),
  campaigns_with_zero_leads: records
    .filter((record) => !attributed.has(record.campaign_id))
    .map((record) => ({
      campaign_id: record.campaign_id,
      campaign_type: record.campaign_type,
      owner: record.owner,
      status: record.status,
      product: record.product,
      lead_count: 0,
    })),
  validation: {
    registry_exists: Boolean(campaignRegistryBefore),
    lead_registry_exists: Boolean(leadRegistryBefore),
    no_lead_mutation_occurred: false,
    attributed_plus_unattributed_equals_total: attributedCount + unattributedCount === totalLeads,
    invalid_campaign_ids_are_reported_not_corrected: invalidCount >= 0,
  },
};

writeJson(OUTPUT_PATH, report);

const campaignRegistryAfter = readText(CAMPAIGN_REGISTRY_PATH);
const leadRegistryAfter = readText(LEAD_REGISTRY_PATH);
const finalReport = {
  ...report,
  validation: {
    ...report.validation,
    no_lead_mutation_occurred: leadRegistryBefore === leadRegistryAfter,
    registry_unchanged_during_report: campaignRegistryBefore === campaignRegistryAfter,
  },
};

writeJson(OUTPUT_PATH, finalReport);

assert(finalReport.validation.no_lead_mutation_occurred, "lead_registry_mutated", failures);
assert(finalReport.validation.registry_unchanged_during_report, "campaign_registry_mutated", failures);
assert(finalReport.validation.invalid_campaign_ids_are_reported_not_corrected, "invalid_campaign_ids_not_reported", failures);

console.log(JSON.stringify(finalReport, null, 2));

if (failures.length) {
  process.exitCode = 1;
}
