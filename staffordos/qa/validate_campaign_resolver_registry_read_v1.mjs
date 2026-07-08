import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs";
import path from "node:path";
import { createRequire, Module } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const requireFromUi = createRequire(path.resolve(scriptDir, "../ui/operator-frontend/package.json"));
const ts = requireFromUi("typescript");
const resolverPath = path.resolve(scriptDir, "../ui/operator-frontend/lib/operator/campaignResolver.ts");
const registryPath = path.resolve(scriptDir, "../campaigns/campaign_registry_v1.json");

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function installTsRequireHook() {
  const original = Module._extensions[".ts"];
  Module._extensions[".ts"] = function transpileTs(module, filename) {
    const source = readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
      fileName: filename,
    }).outputText;
    module._compile(output, filename);
  };
  return () => {
    if (original) {
      Module._extensions[".ts"] = original;
    } else {
      delete Module._extensions[".ts"];
    }
  };
}

function loadResolverFresh() {
  delete require.cache[resolverPath];
  return require(resolverPath);
}

function campaignShape(campaign) {
  return Object.keys(campaign).sort();
}

const failures = [];
const restoreTsHook = installTsRequireHook();

try {
  const resolver = loadResolverFresh();
  const report = resolver.getCampaignResolverReport();
  const campaigns = Array.isArray(report.campaigns) ? report.campaigns : [];

  assert(campaigns.length > 0, "resolver_returned_no_campaigns", failures);
  assert(Array.isArray(campaigns), "resolver_campaigns_not_array", failures);
  assert(
    new Set(campaigns.map((campaign) => campaign.campaign_id)).size === campaigns.length,
    "campaign_ids_not_unique",
    failures
  );

  const expectedCampaignKeys = [
    "active_actions",
    "blocked_actions",
    "campaign_id",
    "campaign_type",
    "completed_actions",
    "confidence",
    "health",
    "next_best_action",
    "objective",
    "provenance",
    "relationships",
    "revenue_at_stake",
  ];
  assert(
    campaigns.every((campaign) => JSON.stringify(campaignShape(campaign)) === JSON.stringify(expectedCampaignKeys)),
    "campaign_output_shape_changed",
    failures
  );

  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const registryTypes = Array.isArray(registry.records) ? registry.records.map((record) => record.campaign_type) : [];
  const resolverTypes = campaigns.map((campaign) => campaign.campaign_type);

  assert(
    resolverTypes.every((campaignType) => registryTypes.includes(campaignType)),
    "resolver_types_do_not_map_to_registry_types",
    failures
  );

  const originalExistsSync = fs.existsSync;
  const originalReadFileSync = fs.readFileSync;
  try {
    fs.existsSync = (candidatePath, ...rest) =>
      typeof candidatePath === "string" && path.resolve(candidatePath) === registryPath ? false : originalExistsSync.call(fs, candidatePath, ...rest);
    fs.readFileSync = (candidatePath, ...rest) =>
      typeof candidatePath === "string" && path.resolve(candidatePath) === registryPath
        ? (() => {
            throw new Error("registry unavailable");
          })()
        : originalReadFileSync.call(fs, candidatePath, ...rest);

    const fallbackResolver = loadResolverFresh();
    const fallbackReport = fallbackResolver.getCampaignResolverReport();
    const fallbackCampaigns = Array.isArray(fallbackReport.campaigns) ? fallbackReport.campaigns : [];

    assert(fallbackCampaigns.length > 0, "fallback_returned_no_campaigns", failures);
    assert(
      new Set(fallbackCampaigns.map((campaign) => campaign.campaign_id)).size === fallbackCampaigns.length,
      "fallback_campaign_ids_not_unique",
      failures
    );
    assert(
      fallbackCampaigns.every((campaign) => campaign.campaign_id === `campaign_${campaign.campaign_type}`),
      "fallback_did_not_preserve_synthesized_ids",
      failures
    );
  } finally {
    fs.existsSync = originalExistsSync;
    fs.readFileSync = originalReadFileSync;
  }

  const result = {
    schema: "staffordos.campaign_resolver_registry_read_validation.v1",
    generated_at: new Date().toISOString(),
    status: failures.length ? "failed" : "passed",
    checks: {
      resolver_returns_campaigns: failures.indexOf("resolver_returned_no_campaigns") === -1,
      campaign_ids_unique: failures.indexOf("campaign_ids_not_unique") === -1,
      output_shape_unchanged: failures.indexOf("campaign_output_shape_changed") === -1,
      registry_maps_to_existing_types: failures.indexOf("resolver_types_do_not_map_to_registry_types") === -1,
      fallback_works_without_registry:
        failures.indexOf("fallback_returned_no_campaigns") === -1 &&
        failures.indexOf("fallback_campaign_ids_not_unique") === -1 &&
        failures.indexOf("fallback_did_not_preserve_synthesized_ids") === -1,
    },
    failures,
  };

  console.log(JSON.stringify(result, null, 2));

  if (failures.length) {
    process.exit(1);
  }
} finally {
  restoreTsHook();
}
