#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const LEADS_DIR = path.join(ROOT, "staffordos", "leads");
const CANDIDATES_PATH = path.join(LEADS_DIR, "candidate_stores.json");
const SCORED_PATH = path.join(LEADS_DIR, "scored_stores.json");
const TOP_TARGETS_PATH = path.join(LEADS_DIR, "top_targets.json");
const TOP_TARGET_LIMIT = 10;
const ABANDO_PUBLIC_BASE = "https://pay.abando.ai";
const REAL_PRIORITY_BOOST = 1000;

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
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

function isLikelyStoreDomain(domain = "") {
  return /^[a-z0-9][a-z0-9-]*\.[a-z0-9.-]+\.[a-z]{2,}$/.test(domain);
}

function inferSignals(candidate) {
  const domain = normalizeDomain(candidate?.domain);
  const notes = String(candidate?.notes || "").trim().toLowerCase();

  const loadsSuccessfully = isLikelyStoreDomain(domain) && !notes.includes("down") && !notes.includes("broken");
  const hasProducts = loadsSuccessfully && !notes.includes("no_products") && !domain.includes("empty");
  const hasCart = loadsSuccessfully && !notes.includes("no_cart") && !domain.includes("catalog-only");
  const recoveryVisible = notes.includes("recovery_visible") || notes.includes("recovery enabled");
  const siteQuality = notes.includes("enterprise")
    ? "enterprise"
    : notes.includes("broken")
      ? "broken"
      : "mid";

  return {
    has_products: hasProducts,
    has_cart: hasCart,
    recovery_visible: recoveryVisible,
    site_quality: siteQuality,
    loads_successfully: loadsSuccessfully,
  };
}

function scoreSignals(signals) {
  let score = 0;
  if (signals.has_products) score += 30;
  if (signals.has_cart) score += 20;
  if (!signals.recovery_visible) score += 25;
  if (signals.site_quality === "mid") score += 15;
  if (signals.loads_successfully) score += 10;
  return score;
}

function getPriority(candidate = {}) {
  return String(candidate?.priority || (String(candidate?.source || "").toLowerCase() === "real_store" ? "real" : "synthetic")).toLowerCase();
}

function getPriorityRank(priority = "") {
  return priority === "real" ? 2 : 1;
}

function getQualityRank(candidate = {}, signals = {}) {
  if (getPriority(candidate) === "real") return 3;
  if (String(candidate?.source || "").toLowerCase() === "manual") return 2;
  if (signals.site_quality === "mid") return 1;
  return 0;
}

function buildTarget(candidate, runStamp) {
  const domain = normalizeDomain(candidate?.domain);
  const signals = inferSignals(candidate);
  const priority = getPriority(candidate);
  const score = scoreSignals(signals) + (priority === "real" ? REAL_PRIORITY_BOOST : 0);
  const qualityRank = getQualityRank(candidate, signals);

  return {
    domain,
    source: String(candidate?.source || "manual"),
    priority,
    notes: String(candidate?.notes || ""),
    score,
    quality_rank: qualityRank,
    signals: {
      has_products: signals.has_products,
      has_cart: signals.has_cart,
      recovery_visible: signals.recovery_visible,
      site_quality: signals.site_quality,
    },
    audit_link: `${ABANDO_PUBLIC_BASE}/audit?shop=${encodeURIComponent(domain)}`,
    experience_link: `${ABANDO_PUBLIC_BASE}/experience?shop=${encodeURIComponent(domain)}&eid=auto-${runStamp}`,
  };
}

function compareTargets(a, b) {
  return (
    getPriorityRank(b.priority) - getPriorityRank(a.priority) ||
    b.score - a.score ||
    (b.quality_rank || 0) - (a.quality_rank || 0) ||
    a.domain.localeCompare(b.domain)
  );
}

function main() {
  const candidates = readJson(CANDIDATES_PATH, []);
  const runStamp = Date.now();

  const scored = candidates
    .map((candidate) => buildTarget(candidate, runStamp))
    .filter((candidate) => candidate.domain)
    .sort(compareTargets);

  const realTargets = scored.filter((target) => target.priority === "real");
  const syntheticTargets = scored.filter((target) => target.priority !== "real");
  const topTargets = [...realTargets, ...syntheticTargets].slice(0, TOP_TARGET_LIMIT);

  writeJson(SCORED_PATH, scored);
  writeJson(TOP_TARGETS_PATH, topTargets);

  console.log("REAL TARGETS:\n");
  realTargets.slice(0, TOP_TARGET_LIMIT).forEach((target, index) => {
    console.log(`${index + 1}. ${target.domain} → score ${target.score}`);
    console.log(`   audit: ${target.audit_link}`);
    console.log(`   experience: ${target.experience_link}`);
  });

  if (realTargets.length === 0) {
    console.log("None");
  }

  console.log("\nSYNTHETIC TARGETS:\n");
  syntheticTargets.slice(0, TOP_TARGET_LIMIT).forEach((target, index) => {
    console.log(`${index + 1}. ${target.domain} → score ${target.score}`);
    console.log(`   audit: ${target.audit_link}`);
    console.log(`   experience: ${target.experience_link}`);
  });

  if (syntheticTargets.length === 0) {
    console.log("None");
  }

  if (topTargets.length === 0) {
    console.log("No candidate stores found.");
  }
}

main();
