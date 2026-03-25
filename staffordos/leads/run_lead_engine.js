#!/usr/bin/env node

import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const LEADS_DIR = path.join(ROOT, "staffordos", "leads");
const QUALIFIED_PATH = path.join(LEADS_DIR, "qualified_targets.json");
const CANDIDATES_PATH = path.join(LEADS_DIR, "candidate_stores.json");

const STEPS = [
  ["real_store_intake.js", "sync"],
  "discover_stores.js",
  "enrich_stores.js",
  "ingest_candidates.js",
  "router.js",
  "quality_filter.js",
];

function runStep(step) {
  const parts = Array.isArray(step) ? step : [step];
  const [scriptName, ...args] = parts;
  const scriptPath = path.join(LEADS_DIR, scriptName);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function pruneAutoDiscoveredCandidates() {
  try {
    const candidates = JSON.parse(fs.readFileSync(CANDIDATES_PATH, "utf8"));
    if (!Array.isArray(candidates)) return;
    const filtered = candidates.filter(
      (entry) => !String(entry?.notes || "").toLowerCase().includes("auto_discovered"),
    );
    const removed = candidates.length - filtered.length;
    if (removed > 0) {
      fs.writeFileSync(CANDIDATES_PATH, `${JSON.stringify(filtered, null, 2)}\n`, "utf8");
    }
    console.log(`Discovery cleanup applied: removed stale auto_discovered candidates=${removed}`);
  } catch {
    console.log("Discovery cleanup applied: candidate prune skipped");
  }
}

function main() {
  pruneAutoDiscoveredCandidates();

  for (const step of STEPS) {
    runStep(step);
  }

  console.log(`Final routing set: ${QUALIFIED_PATH}`);
  console.log("Lead engine cycle complete");
}

main();
