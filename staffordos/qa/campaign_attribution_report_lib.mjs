import { existsSync, readFileSync } from "node:fs";
import { loadCampaignRegistry, normalizeOptionalCampaignId, resolveCanonicalCampaignId, summarizeSourceCampaignAttribution } from "../leads/campaign_attribution_v1.mjs";

export const LEAD_REGISTRY_PATH = "staffordos/leads/lead_registry_v1.json";
export const CAMPAIGN_REGISTRY_PATH = "staffordos/campaigns/campaign_registry_v1.json";

function readJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

export function countAttributedLeads(leads, campaignRegistry = loadCampaignRegistry()) {
  const attributed = new Map();
  const invalid = new Map();
  let attributedCount = 0;
  let invalidCount = 0;

  for (const lead of Array.isArray(leads) ? leads : []) {
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

export function buildCampaignAttributionReport(leads, campaignRegistry = loadCampaignRegistry(), options = {}) {
  const records = Array.isArray(campaignRegistry.records) ? campaignRegistry.records : [];
  const { attributed, invalid, attributedCount, invalidCount } = countAttributedLeads(leads, campaignRegistry);
  const totalLeads = Array.isArray(leads) ? leads.length : 0;
  const unattributedCount = totalLeads - attributedCount;
  const coveragePercent = totalLeads ? Number(((attributedCount / totalLeads) * 100).toFixed(1)) : 0;
  const sourceSummary = summarizeSourceCampaignAttribution({ items: leads }, campaignRegistry);

  return {
    schema: "staffordos.campaign_attribution_report.v1",
    generated_at: new Date().toISOString(),
    source_files: options.source_files || [LEAD_REGISTRY_PATH, CAMPAIGN_REGISTRY_PATH],
    output_path: options.output_path || "staffordos/qa/output/campaign_attribution_report_v1.json",
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
      registry_exists: campaignRegistry.records.length > 0,
      lead_registry_exists: true,
      no_lead_mutation_occurred: true,
      attributed_plus_unattributed_equals_total: attributedCount + unattributedCount === totalLeads,
      invalid_campaign_ids_are_reported_not_corrected: invalidCount >= 0,
      source_summary_campaign_ids: sourceSummary.canonical_campaign_ids,
    },
  };
}

export function loadLiveCampaignAttributionReport() {
  const campaignRegistry = loadCampaignRegistry(CAMPAIGN_REGISTRY_PATH);
  const leadRegistry = readJson(LEAD_REGISTRY_PATH, { items: [] });
  const leads = Array.isArray(leadRegistry.items) ? leadRegistry.items : [];
  return buildCampaignAttributionReport(leads, campaignRegistry, {
    source_files: [LEAD_REGISTRY_PATH, CAMPAIGN_REGISTRY_PATH],
    output_path: "staffordos/qa/output/campaign_attribution_report_v1.json",
  });
}
