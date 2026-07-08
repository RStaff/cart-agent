import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadLiveCampaignAttributionReport } from "./campaign_attribution_report_lib.mjs";

const OUTPUT_PATH = "staffordos/qa/output/campaign_attribution_report_v1.json";

function writeJson(pathname, value) {
  mkdirSync(path.dirname(pathname), { recursive: true });
  writeFileSync(pathname, JSON.stringify(value, null, 2) + "\n");
}

const report = loadLiveCampaignAttributionReport();
writeJson(OUTPUT_PATH, report);
console.log(JSON.stringify(report, null, 2));
