import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatCheckoutBenchmark,
  generateCheckoutBenchmark,
} from "./checkout_benchmark_intelligence/index.js";

const DEFAULT_STORES = [
  "store1.myshopify.com",
  "store2.myshopify.com",
  "store3.myshopify.com",
];

const REPORTS_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "reports");

function normalizeStore(store) {
  return String(store || "").trim().toLowerCase();
}

function parseStoresArg() {
  const rawArg = process.argv[2];
  if (!rawArg) return DEFAULT_STORES;

  try {
    const parsed = JSON.parse(rawArg);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeStore).filter(Boolean);
    }
  } catch {
    // Fall back to comma-separated parsing below.
  }

  return rawArg
    .split(",")
    .map(normalizeStore)
    .filter(Boolean);
}

async function generateReports(stores) {
  await mkdir(REPORTS_DIR, { recursive: true });

  for (const store of stores) {
    const report = await generateCheckoutBenchmark(store);
    const formatted = formatCheckoutBenchmark(report);
    const outputPath = join(REPORTS_DIR, `${store}.txt`);

    await writeFile(outputPath, formatted + "\n", "utf8");
    console.log(`Generated report for ${store} -> ${outputPath}`);
  }

  console.log(`Finished generating ${stores.length} report(s).`);
}

const stores = parseStoresArg();

if (stores.length === 0) {
  console.error("No stores provided.");
  process.exit(1);
}

generateReports(stores).catch((error) => {
  console.error("Failed to generate reports:", error);
  process.exit(1);
});
