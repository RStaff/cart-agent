#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const LEADS_DIR = path.join(ROOT, "staffordos", "leads");
const CANDIDATES_PATH = path.join(LEADS_DIR, "candidate_stores.json");
const DISCOVERED_PATH = path.join(LEADS_DIR, "discovered_stores.json");
const OUTCOMES_PATH = path.join(LEADS_DIR, "outcomes.json");

const SEED_LIST = [
  "homegoodsco",
  "urbankitchen",
  "modernpets",
  "fitgearpro",
  "luxbath",
];

const VARIATIONS = ["home", "shop", "store", "goods", "co", "usa", "official"];
const MAX_VARIANTS_PER_BASE = 5;
const FILLER_TOKENS = ["example", "test", "demo", "sample"];
const KEYWORD_PARTS = [
  "home",
  "goods",
  "kitchen",
  "pets",
  "pet",
  "fit",
  "gear",
  "bath",
  "lux",
  "modern",
  "urban",
];

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

function slugify(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\.myshopify\.com$/, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDomain(slug = "") {
  const normalized = slugify(slug).replace(/-+/g, "-");
  return normalized ? `${normalized}.myshopify.com` : "";
}

function addCandidate(map, slug, source, priority = "synthetic") {
  const domain = toDomain(slug);
  if (!domain || map.has(domain)) return;
  map.set(domain, { domain, source, priority });
}

function tokenizeSlug(slug = "") {
  return slugify(slug).split("-").filter(Boolean);
}

function hasFillerToken(slug = "") {
  const tokens = tokenizeSlug(slug);
  return FILLER_TOKENS.some((token) => tokens.includes(token) || slug.includes(token));
}

function hasRepeatedAdjacentTokens(tokens = []) {
  for (let index = 1; index < tokens.length; index += 1) {
    if (tokens[index] === tokens[index - 1]) {
      return true;
    }
  }
  return false;
}

function hasRepeatedTokenReuse(tokens = []) {
  return new Set(tokens).size !== tokens.length;
}

function isCleanGeneratedSlug(slug = "") {
  const tokens = tokenizeSlug(slug);
  if (tokens.length === 0) return false;
  if (hasFillerToken(slug)) return false;
  if (tokens.length > 3) return false;
  if (hasRepeatedAdjacentTokens(tokens)) return false;
  if (hasRepeatedTokenReuse(tokens)) return false;
  return true;
}

function shouldExpandBase(slug = "", source = "", notes = "", priority = "") {
  const normalized = slugify(slug);
  if (!normalized) return false;
  if (hasFillerToken(normalized)) return false;
  if (!isCleanGeneratedSlug(normalized)) return false;
  if (String(notes || "").toLowerCase().includes("auto_discovered")) return false;
  if (String(source || "").toLowerCase() === "generated") return false;
  if (String(source || "").toLowerCase() === "real_store" || String(priority || "").toLowerCase() === "real") return false;
  return true;
}

function buildBaseVariants(base = "") {
  const tokens = tokenizeSlug(base);
  const used = new Set(tokens);
  const variants = [];

  for (const suffix of VARIATIONS) {
    if (used.has(suffix)) continue;
    const variant = `${base}-${suffix}`;
    if (!isCleanGeneratedSlug(variant)) continue;
    variants.push(variant);
    if (variants.length >= MAX_VARIANTS_PER_BASE) {
      break;
    }
  }

  return variants;
}

function extractOutcomeKeywords(domain = "") {
  const base = slugify(domain)
    .replace(/\b(store|shop|official|usa|co)\b/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const found = [];

  KEYWORD_PARTS.forEach((part) => {
    if (base.includes(part) && !found.includes(part)) {
      found.push(part);
    }
  });

  if (found.length > 0) {
    return found;
  }

  return base.split("-").filter(Boolean).slice(0, 2);
}

function generateOutcomeVariants(keywords) {
  const variants = new Set();
  const [first = "", second = ""] = keywords;

  if (first) {
    variants.add(`${first}plus`);
    variants.add(`best${first}`);
  }

  if (second) {
    variants.add(`${second}warehouse`);
    variants.add(`${second}direct`);
  }

  if (first && second) {
    variants.add(`${first}${second}plus`);
    variants.add(`best${first}${second}`);
  }

  return Array.from(variants).filter((variant) => Boolean(variant) && !hasFillerToken(variant));
}

function main() {
  const discovered = new Map();
  const candidates = readJson(CANDIDATES_PATH, []);
  const outcomes = readJson(OUTCOMES_PATH, []);

  SEED_LIST.forEach((seed) => {
    addCandidate(discovered, seed, "seed", "synthetic");
    buildBaseVariants(seed).forEach((variant) => addCandidate(discovered, variant, "generated", "synthetic"));
  });

  candidates.forEach((candidate) => {
    const base = slugify(candidate?.domain || "");
    if (!base) return;
    const source = String(candidate?.source || "");
    const priority = String(candidate?.priority || "");
    const notes = String(candidate?.notes || "");
    const isRealStore = source.toLowerCase() === "real_store" || priority.toLowerCase() === "real";

    if (isRealStore) {
      return;
    }

    if (!notes.toLowerCase().includes("auto_discovered")) {
      addCandidate(discovered, base, source || "existing", priority || "synthetic");
    }

    if (!shouldExpandBase(base, source, notes, priority)) {
      return;
    }

    buildBaseVariants(base).forEach((variant) => addCandidate(discovered, variant, "generated", "synthetic"));
  });

  outcomes
    .filter((entry) => String(entry?.status || "") === "return_tracked")
    .forEach((entry) => {
      const keywords = extractOutcomeKeywords(entry?.domain || "");
      generateOutcomeVariants(keywords).forEach((slug) => {
        addCandidate(discovered, slug, "outcome_generated", "synthetic");
      });
    });

  const output = Array.from(discovered.values()).sort((a, b) => a.domain.localeCompare(b.domain));
  writeJson(DISCOVERED_PATH, output);

  console.log("Discovery cleanup applied");
  console.log(`Discovered stores: ${output.length}`);
  output.slice(0, 12).forEach((entry) => {
    console.log(`- ${entry.domain} (${entry.source})`);
  });
}

main();
