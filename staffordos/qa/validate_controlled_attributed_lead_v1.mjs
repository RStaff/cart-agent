import { existsSync, readFileSync } from "node:fs";
import {
  loadCampaignRegistry,
} from "../leads/campaign_attribution_v1.mjs";
import { buildCampaignAttributionReport } from "./campaign_attribution_report_lib.mjs";

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
const leadRegistryBefore = readFileSync(LEAD_REGISTRY_PATH, "utf8");
const liveRegistry = readJson(LEAD_REGISTRY_PATH, { items: [] });
const liveItems = Array.isArray(liveRegistry.items) ? liveRegistry.items : [];

const controlledSource = [
  {
    id: "controlled_lead_001",
    domain: "controlled.example",
    campaign_id: "campaign_shopifixer_outreach_001",
    source: "controlled_test_fixture",
    test_control: true,
  },
];

const invalidControlledSource = [
  {
    id: "controlled_invalid_001",
    domain: "controlled.invalid",
    campaign_id: "campaign_invalid_999",
    source: "controlled_test_fixture",
    test_control: true,
  },
];

const missingControlledSource = [
  {
    id: "controlled_missing_001",
    domain: "controlled.missing",
    source: "controlled_test_fixture",
    test_control: true,
  },
];

const report = buildCampaignAttributionReport(controlledSource, campaignRegistry, {
  source_files: ["controlled_test_fixture"],
  output_path: "staffordos/qa/output/control-only-campaign_attribution_report_v1.json",
});

assert(report.totals.leads === 1, "controlled_total_should_be_one", failures);
assert(report.totals.attributed_leads === 1, "controlled_attributed_should_be_one", failures);
assert(report.totals.unattributed_leads === 0, "controlled_unattributed_should_be_zero", failures);
assert(
  report.leads_by_campaign_id.campaign_shopifixer_outreach_001 === 1,
  "controlled_campaign_id_not_counted",
  failures
);

const invalidReport = buildCampaignAttributionReport(invalidControlledSource, campaignRegistry, {
  source_files: ["controlled_test_fixture"],
  output_path: "staffordos/qa/output/control-only-campaign_attribution_report_v1.json",
});
assert(invalidReport.totals.attributed_leads === 0, "invalid_controlled_campaign_id_counted", failures);
assert(invalidReport.totals.unattributed_leads === 1, "invalid_controlled_campaign_id_not_unattributed", failures);
assert(
  invalidReport.validation.invalid_campaign_ids_are_reported_not_corrected,
  "invalid_controlled_campaign_id_not_reported",
  failures
);

const missingReport = buildCampaignAttributionReport(missingControlledSource, campaignRegistry, {
  source_files: ["controlled_test_fixture"],
  output_path: "staffordos/qa/output/control-only-campaign_attribution_report_v1.json",
});
assert(missingReport.totals.attributed_leads === 0, "missing_controlled_campaign_id_counted", failures);
assert(missingReport.totals.unattributed_leads === 1, "missing_controlled_campaign_id_not_unattributed", failures);

const leadRegistryAfter = readFileSync(LEAD_REGISTRY_PATH, "utf8");
assert(leadRegistryBefore === leadRegistryAfter, "live_lead_registry_changed", failures);
assert(liveItems.length === 13, "live_13_leads_changed", failures);
assert(campaignRegistry.records.length > 0, "campaign_registry_missing", failures);

const result = {
  schema: "staffordos.controlled_attributed_lead_validation.v1",
  generated_at: new Date().toISOString(),
  status: failures.length ? "failed" : "passed",
  checks: {
    valid_campaign_id_survives_controlled_fixture: failures.indexOf("controlled_campaign_id_not_counted") === -1,
    invalid_campaign_id_is_ignored: failures.indexOf("invalid_controlled_campaign_id_counted") === -1 && failures.indexOf("invalid_controlled_campaign_id_not_reported") === -1,
    missing_campaign_id_is_safe: failures.indexOf("missing_controlled_campaign_id_counted") === -1,
    campaign_registry_gating_enforced: campaignRegistry.records.length > 0,
    live_registry_untouched: failures.indexOf("live_lead_registry_changed") === -1 && failures.indexOf("live_13_leads_changed") === -1,
    controlled_report_counts_attributed_lead: report.totals.attributed_leads === 1,
  },
  failures,
};

console.log(JSON.stringify(result, null, 2));

if (failures.length) {
  process.exit(1);
}
