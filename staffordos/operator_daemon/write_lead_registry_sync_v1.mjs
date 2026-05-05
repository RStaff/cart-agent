import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const candidatePaths = [
  "staffordos/outreach/leads.json",
  "staffordos/products/shopifixer/assisted/leads.json",
  "staffordos/truth/lead_truth_store.json"
];

const found = candidatePaths.filter((p) => existsSync(p));

const result = {
  schema: "staffordos.lead_registry_sync.v1",
  generated_at: new Date().toISOString(),
  system: "shopifixer",
  status: "synced_status_only",
  mode: "safe_non_revenue_sync",
  found_lead_sources: found,
  missing_lead_sources: candidatePaths.filter((p) => !existsSync(p)),
  proof: {
    checked_known_lead_sources: true,
    wrote_sync_artifact: true,
    sent_messages: false,
    revenue_action: false
  }
};

if (found.length > 0) {
  result.source_summaries = found.map((p) => {
    try {
      const raw = readFileSync(p, "utf8");
      const parsed = JSON.parse(raw);
      return {
        path: p,
        type: Array.isArray(parsed) ? "array" : typeof parsed,
        count: Array.isArray(parsed) ? parsed.length : Object.keys(parsed || {}).length
      };
    } catch {
      return { path: p, type: "unreadable_or_non_json" };
    }
  });
}

writeFileSync(
  `${outDir}/lead_registry_sync_v1.json`,
  JSON.stringify(result, null, 2)
);

console.log("✅ lead registry sync written");
