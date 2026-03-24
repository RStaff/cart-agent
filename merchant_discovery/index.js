// Sample command:
// node merchant_discovery/index.js

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { generateCheckoutBenchmark } from "../checkout_benchmark_intelligence/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_LIST_PATH = join(__dirname, "store_list.json");
const LOW_SCORE_LEADS_PATH = join(__dirname, "low_score_leads.json");
const LEAD_SCORE_THRESHOLD = 65;

async function readStoreList() {
  const raw = await readFile(STORE_LIST_PATH, "utf8");
  const stores = JSON.parse(raw);
  return Array.isArray(stores) ? stores : [];
}

function buildLead(report) {
  return {
    store: report.store,
    checkout_score: report.score ?? report.checkout_score,
    tier: report.tier ?? null,
    percentile: report.percentile ?? null,
    top_friction: report.top_friction ?? null,
    estimated_revenue_opportunity:
      report.estimated_revenue_opportunity ?? report.estimated_monthly_revenue_opportunity ?? 0,
    benchmark_badge: report.benchmark_badge ?? null,
    competitor_score: report.competitor_comparison?.competitor_score ?? null,
    score_gap: report.competitor_comparison?.score_gap ?? null,
    detected_at: new Date().toISOString(),
  };
}

export async function generateMerchantDiscoveryLeads() {
  const stores = await readStoreList();
  const leads = [];
  let failedCount = 0;

  await mkdir(__dirname, { recursive: true });

  for (const store of stores) {
    try {
      const report = await generateCheckoutBenchmark(store);
      const checkoutScore = report.score ?? report.checkout_score ?? 0;
      const fetchStatus = report.fetch_status || "unknown";

      if (fetchStatus !== "ok") {
        failedCount += 1;
      }

      if (checkoutScore < LEAD_SCORE_THRESHOLD) {
        const lead = buildLead(report);
        leads.push(lead);
        console.log(
          `Scanned: ${store} -> fetch ${fetchStatus} -> score ${checkoutScore} -> lead saved`,
        );
      } else {
        console.log(
          `Scanned: ${store} -> fetch ${fetchStatus} -> score ${checkoutScore} -> skipped`,
        );
      }
    } catch (error) {
      failedCount += 1;
      console.error(`Scanned: ${store} -> fetch failed -> scan error -> skipped`, error);
    }
  }

  await writeFile(LOW_SCORE_LEADS_PATH, JSON.stringify(leads, null, 2) + "\n", "utf8");
  return {
    leads,
    total_scanned: stores.length,
    total_failed: failedCount,
    total_low_score_leads_saved: leads.length,
  };
}

async function main() {
  const result = await generateMerchantDiscoveryLeads();
  console.log(`Finished scanning.`);
  console.log(`Total scanned: ${result.total_scanned}`);
  console.log(`Total failed: ${result.total_failed}`);
  console.log(`Total low-score leads saved: ${result.total_low_score_leads_saved}`);
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error("[merchant-discovery] run failed", error);
    process.exitCode = 1;
  });
}
