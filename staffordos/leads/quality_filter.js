#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const LEADS_DIR = path.join(ROOT, "staffordos", "leads");
const SCORED_PATH = path.join(LEADS_DIR, "scored_stores.json");
const TOP_TARGETS_PATH = path.join(LEADS_DIR, "top_targets.json");
const QUALIFIED_PATH = path.join(LEADS_DIR, "qualified_targets.json");
const QUALIFIED_LIMIT = 10;
const FILLER_TOKENS = ["example", "test", "demo"];
const BAD_SUFFIXES = ["official-co", "shop-store"];
const VARIATION_TOKENS = ["home", "shop", "store", "goods", "co", "usa", "official"];

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
    .split("#")[0];
}

function domainSlug(domain = "") {
  return normalizeDomain(domain).replace(/\.myshopify\.com$/, "");
}

function hasRepeatedTokens(tokens) {
  for (let index = 1; index < tokens.length; index += 1) {
    if (tokens[index] === tokens[index - 1]) {
      return true;
    }
  }
  return false;
}

function hasRepeatedSuffixChain(tokens) {
  if (tokens.length < 4) return false;
  const tail = tokens.slice(-4);
  return new Set(tail).size <= 2;
}

function isLowQualityDomain(domain = "") {
  const slug = domainSlug(domain);
  const tokens = slug.split("-").filter(Boolean);
  const hyphenCount = tokens.length > 0 ? tokens.length - 1 : 0;
  const suffixTokens = tokens.slice(1);

  if (!slug) return true;
  if (FILLER_TOKENS.some((token) => tokens.includes(token) || slug.includes(token))) return true;
  if (hasRepeatedTokens(tokens)) return true;
  if (hyphenCount > 3) return true;
  if (BAD_SUFFIXES.some((suffix) => slug.endsWith(suffix))) return true;
  if (hasRepeatedSuffixChain(tokens)) return true;
  if (suffixTokens.length > 0 && suffixTokens.every((token) => VARIATION_TOKENS.includes(token))) return true;
  if (tokens.length > 1 && VARIATION_TOKENS.includes(tokens[tokens.length - 1])) return true;

  return false;
}

function toQualifiedEntry(entry) {
  return {
    domain: normalizeDomain(entry?.domain || ""),
    score: Number(entry?.score || 0),
    quality: "high",
    audit_link: String(entry?.audit_link || ""),
    experience_link: String(entry?.experience_link || ""),
  };
}

function main() {
  const scored = readJson(SCORED_PATH, []);
  const topTargets = readJson(TOP_TARGETS_PATH, []);
  const scoredByDomain = new Map(scored.map((entry) => [normalizeDomain(entry?.domain || ""), entry]));
  const combined = [];
  const seen = new Set();

  topTargets.forEach((entry) => {
    const domain = normalizeDomain(entry?.domain || "");
    if (!domain || seen.has(domain)) return;
    seen.add(domain);
    combined.push(entry);
  });

  scored.forEach((entry) => {
    const domain = normalizeDomain(entry?.domain || "");
    if (!domain || seen.has(domain)) return;
    seen.add(domain);
    combined.push(entry);
  });

  const filteredTopTargets = combined
    .filter((entry) => !isLowQualityDomain(entry?.domain || ""))
    .slice(0, QUALIFIED_LIMIT);

  const qualifiedTargets = filteredTopTargets.map((entry) =>
    toQualifiedEntry(scoredByDomain.get(normalizeDomain(entry?.domain || "")) || entry),
  );

  writeJson(QUALIFIED_PATH, qualifiedTargets);

  console.log(`Quality filter complete: input=${topTargets.length} qualified=${qualifiedTargets.length}`);
  qualifiedTargets.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.domain} → score ${entry.score} (${entry.quality})`);
  });
  console.log(`Qualified targets written to: ${QUALIFIED_PATH}`);
}

main();
