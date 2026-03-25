#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const LEADS_DIR = path.join(ROOT, "staffordos", "leads");
const ENRICHED_PATH = path.join(LEADS_DIR, "enriched_stores.json");
const CANDIDATES_PATH = path.join(LEADS_DIR, "candidate_stores.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeDomain(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .replace(/\/+$/, "");
}

function main() {
  const enriched = readJson(ENRICHED_PATH, []);
  const candidates = readJson(CANDIDATES_PATH, []);
  const existingDomains = new Set(
    candidates.map((entry) => normalizeDomain(entry?.domain || "")).filter(Boolean),
  );

  let added = 0;

  for (const entry of enriched) {
    const domain = normalizeDomain(entry?.domain || "");
    if (!domain || existingDomains.has(domain)) {
      continue;
    }

    candidates.push({
      domain,
      source: String(entry?.source || "generated"),
      priority: String(entry?.priority || "synthetic"),
      notes: "auto_discovered",
      status: "new",
    });
    existingDomains.add(domain);
    added += 1;
  }

  writeJson(CANDIDATES_PATH, candidates);

  console.log(`Ingested candidates: ${added}`);
  console.log(`Total candidates: ${candidates.length}`);
}

main();
