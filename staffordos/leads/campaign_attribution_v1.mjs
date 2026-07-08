import { existsSync, readFileSync } from "node:fs";

const CAMPAIGN_REGISTRY_PATH = "staffordos/campaigns/campaign_registry_v1.json";

function readJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

export function normalizeOptionalCampaignId(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

export function loadCampaignRegistry(path = CAMPAIGN_REGISTRY_PATH) {
  const registry = readJson(path, { records: [] });
  const records = Array.isArray(registry.records) ? registry.records : [];
  const byId = new Map();

  for (const record of records) {
    const campaignId = normalizeOptionalCampaignId(record?.campaign_id);
    if (!campaignId) continue;
    byId.set(campaignId, record);
  }

  return {
    path,
    records,
    byId,
  };
}

export function resolveCanonicalCampaignId(candidate, registry = loadCampaignRegistry()) {
  const normalized = normalizeOptionalCampaignId(candidate);
  if (!normalized) return undefined;
  return registry.byId.has(normalized) ? normalized : undefined;
}

export function resolveLeadCampaignId(existing = {}, outreachItem = {}, contactItem = {}, registry = loadCampaignRegistry()) {
  return resolveCanonicalCampaignId(
    existing?.campaign_id || outreachItem.campaign_id || contactItem.campaign_id || contactItem.campaign?.campaign_id,
    registry
  );
}

export function summarizeSourceCampaignAttribution(source, registry = loadCampaignRegistry()) {
  const records = Array.isArray(source) ? source : Array.isArray(source?.items) ? source.items : [];
  const canonicalCampaignIds = new Set();
  const invalidCampaignIds = new Set();

  for (const record of records) {
    const candidate = normalizeOptionalCampaignId(record?.campaign_id || record?.campaign?.campaign_id);
    if (!candidate) continue;
    const canonical = resolveCanonicalCampaignId(candidate, registry);
    if (canonical) canonicalCampaignIds.add(canonical);
    else invalidCampaignIds.add(candidate);
  }

  return {
    record_count: records.length,
    canonical_campaign_ids: Array.from(canonicalCampaignIds).sort(),
    invalid_campaign_ids: Array.from(invalidCampaignIds).sort(),
  };
}
