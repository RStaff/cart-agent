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

function buildTarget(candidate, runStamp) {
  const domain = normalizeDomain(candidate?.domain);
  const signals = inferSignals(candidate);
  const score = scoreSignals(signals);

  return {
    domain,
    source: String(candidate?.source || "manual"),
    notes: String(candidate?.notes || ""),
    score,
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

function main() {
  const candidates = readJson(CANDIDATES_PATH, []);
  const runStamp = Date.now();

  const scored = candidates
    .map((candidate) => buildTarget(candidate, runStamp))
    .filter((candidate) => candidate.domain)
    .sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain));

  const topTargets = scored.slice(0, TOP_TARGET_LIMIT);

  writeJson(SCORED_PATH, scored);
  writeJson(TOP_TARGETS_PATH, topTargets);

  console.log("Top Targets:\n");
  topTargets.forEach((target, index) => {
    console.log(`${index + 1}. ${target.domain} → score ${target.score}`);
    console.log(`   audit: ${target.audit_link}`);
    console.log(`   experience: ${target.experience_link}`);
  });

  if (topTargets.length === 0) {
    console.log("No candidate stores found.");
  }
}

main();
