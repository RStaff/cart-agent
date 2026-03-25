#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const LEADS_DIR = path.join(ROOT, "staffordos", "leads");
const DISCOVERED_PATH = path.join(LEADS_DIR, "discovered_stores.json");
const CANDIDATES_PATH = path.join(LEADS_DIR, "candidate_stores.json");
const ENRICHED_PATH = path.join(LEADS_DIR, "enriched_stores.json");

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

function hashString(value = "") {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function inferCategory(domain = "") {
  if (domain.includes("kitchen") || domain.includes("bath") || domain.includes("home") || domain.includes("goods")) {
    return "home_goods";
  }
  if (domain.includes("pets")) {
    return "pets";
  }
  if (domain.includes("fit") || domain.includes("gear")) {
    return "fitness";
  }
  return "general";
}

function inferTrafficSignal(hash) {
  const bucket = hash % 3;
  if (bucket === 0) return "low";
  if (bucket === 1) return "medium";
  return "high";
}

function inferEstimatedAov(domain, category, hash) {
  if (category === "home_goods") return 60 + (hash % 16);
  if (category === "pets") return 42 + (hash % 12);
  if (category === "fitness") return 68 + (hash % 18);
  if (domain.includes("lux")) return 90 + (hash % 20);
  return 50 + (hash % 15);
}

function enrichDomain(entry) {
  const domain = normalizeDomain(entry?.domain || entry || "");
  const hash = hashString(domain);
  const category = inferCategory(domain);

  return {
    domain,
    source: String(entry?.source || "generated"),
    priority: String(entry?.priority || "synthetic"),
    has_checkout: true,
    has_cart: true,
    estimated_aov: inferEstimatedAov(domain, category, hash),
    traffic_signal: inferTrafficSignal(hash),
    category,
  };
}

function main() {
  const discovered = readJson(DISCOVERED_PATH, []);
  const candidates = readJson(CANDIDATES_PATH, []);
  const candidateDomains = new Set(
    candidates.map((entry) => normalizeDomain(entry?.domain || "")).filter(Boolean),
  );

  const enriched = discovered
    .map((entry) => ({
      domain: normalizeDomain(entry?.domain || ""),
      source: String(entry?.source || "generated"),
      priority: String(entry?.priority || "synthetic"),
    }))
    .filter((entry) => entry.domain)
    .filter((entry) => !candidateDomains.has(entry.domain))
    .map((entry) => enrichDomain(entry));

  writeJson(ENRICHED_PATH, enriched);

  console.log(`Enriched stores: ${enriched.length}`);
  enriched.slice(0, 12).forEach((entry) => {
    console.log(`- ${entry.domain} (${entry.category}, aov=${entry.estimated_aov}, traffic=${entry.traffic_signal})`);
  });
}

main();
