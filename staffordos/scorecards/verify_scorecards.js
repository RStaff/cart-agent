#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateScorecards } from "./generate_scorecards.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_PATH = path.resolve(__dirname, "scorecards_output.json");

function fail(message, context = {}) {
  console.error(JSON.stringify({ ok: false, message, context }, null, 2));
  process.exit(1);
}

const result = generateScorecards();

if (!fs.existsSync(OUTPUT_PATH)) {
  fail("scorecards_output.json was not created");
}

const scorecards = Array.isArray(result?.scorecards) ? result.scorecards : [];
if (scorecards.length < 3) {
  fail("Expected at least 3 scorecard entries from current input", { count: scorecards.length });
}

for (const entry of scorecards) {
  if (!entry.domain || !entry.slug || !entry.publicUrl || typeof entry.revenueOpportunityCents !== "number" || !entry.installPath) {
    fail("Scorecard entry missing required fields", { entry });
  }
}

const sample = scorecards.slice(0, 3).map((entry) => ({
  domain: entry.domain,
  slug: entry.slug,
  publicUrl: entry.publicUrl,
  revenueOpportunityCents: entry.revenueOpportunityCents,
  installPath: entry.installPath,
}));

console.log(JSON.stringify({
  ok: true,
  outputPath: OUTPUT_PATH,
  count: scorecards.length,
  sample,
}, null, 2));
