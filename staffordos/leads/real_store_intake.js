#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const LEADS_DIR = path.join(ROOT, "staffordos", "leads");
const REAL_STORE_CANDIDATES_PATH = path.join(LEADS_DIR, "real_store_candidates.json");
const CANDIDATES_PATH = path.join(LEADS_DIR, "candidate_stores.json");
const REJECT_TOKENS = ["example", "test", "demo", "sample"];

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

function isValidStorefrontDomain(domain = "") {
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(domain);
}

function isRejectedPlaceholder(domain = "") {
  const value = normalizeDomain(domain);
  return REJECT_TOKENS.some((token) => value.includes(token));
}

function cleanRealStoreEntry(entry = {}) {
  const domain = normalizeDomain(entry?.domain || entry || "");
  if (!domain || !isValidStorefrontDomain(domain) || isRejectedPlaceholder(domain)) {
    return null;
  }

  return {
    domain,
    source: "real_store",
    priority: "real",
  };
}

function dedupeByDomain(entries = []) {
  const seen = new Map();
  entries.forEach((entry) => {
    const cleaned = cleanRealStoreEntry(entry);
    if (!cleaned) return;
    seen.set(cleaned.domain, cleaned);
  });
  return Array.from(seen.values()).sort((a, b) => a.domain.localeCompare(b.domain));
}

function loadRealStores() {
  return dedupeByDomain(readJson(REAL_STORE_CANDIDATES_PATH, []));
}

function saveRealStores(entries) {
  writeJson(REAL_STORE_CANDIDATES_PATH, dedupeByDomain(entries));
}

function printUsageAndExit() {
  console.error("Usage:");
  console.error("  node staffordos/leads/real_store_intake.js add <domain>");
  console.error("  node staffordos/leads/real_store_intake.js sync");
  process.exit(1);
}

function commandAdd(domainArg) {
  const cleaned = cleanRealStoreEntry({ domain: domainArg });
  if (!cleaned) {
    console.error("Invalid or placeholder domain");
    process.exit(1);
  }

  const existing = loadRealStores();
  const before = existing.length;
  existing.push(cleaned);
  const next = dedupeByDomain(existing);
  saveRealStores(next);

  console.log("Real Store Intake:");
  console.log(`- added: ${next.length > before ? 1 : 0}`);
  console.log(`- total real stores: ${next.length}`);
}

function commandSync() {
  const realStores = loadRealStores();
  const candidates = readJson(CANDIDATES_PATH, []);
  const merged = new Map();

  candidates.forEach((entry) => {
    const domain = normalizeDomain(entry?.domain || "");
    if (!domain || !isValidStorefrontDomain(domain)) return;
    merged.set(domain, entry);
  });

  realStores.forEach((entry) => {
    merged.set(entry.domain, {
      domain: entry.domain,
      source: "real_store",
      priority: "real",
      notes: "real_store",
      status: "new",
    });
  });

  const nextCandidates = Array.from(merged.values()).sort((a, b) =>
    normalizeDomain(a.domain).localeCompare(normalizeDomain(b.domain)),
  );

  writeJson(CANDIDATES_PATH, nextCandidates);

  console.log("Sync complete:");
  console.log("- merged into candidate_stores.json");
  console.log(`- real stores synced: ${realStores.length}`);
}

function main() {
  const [, , command, arg] = process.argv;

  if (command === "add") {
    commandAdd(arg);
    return;
  }

  if (command === "sync") {
    commandSync();
    return;
  }

  printUsageAndExit();
}

main();
