import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const RULES_PATH = path.join(
  CANONICAL_ROOT,
  "staffordos/hygiene/noise_rules_v1.json",
);

function normalizePath(filePath) {
  return String(filePath || "").replace(/\\/g, "/").replace(/^\.\/+/, "");
}

function readRules() {
  return JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));
}

function matchesGlobLike(filePath, pattern) {
  const normalizedPath = normalizePath(filePath);
  const normalizedPattern = normalizePath(pattern);

  if (normalizedPattern.endsWith("/")) {
    const directory = normalizedPattern.slice(0, -1);
    return (
      normalizedPath === directory ||
      normalizedPath.startsWith(`${directory}/`) ||
      normalizedPath.includes(`/${directory}/`)
    );
  }

  if (normalizedPattern.startsWith("*.")) {
    return normalizedPath.endsWith(normalizedPattern.slice(1));
  }

  return (
    normalizedPath === normalizedPattern ||
    normalizedPath.startsWith(`${normalizedPattern}/`) ||
    normalizedPath.includes(`/${normalizedPattern}/`)
  );
}

function matchesAny(filePath, patterns = []) {
  return patterns.some((pattern) => matchesGlobLike(filePath, pattern));
}

export function classifyNoisePath(filePath, rules = readRules()) {
  const normalizedPath = normalizePath(filePath);

  if (matchesAny(normalizedPath, rules.never_ignore)) {
    return "VALID_SOURCE";
  }

  if (matchesAny(normalizedPath, rules.generated_noise_patterns)) {
    return "GENERATED_NOISE";
  }

  if (matchesAny(normalizedPath, rules.suspicious_noise)) {
    return "REVIEW_REQUIRED";
  }

  return "VALID_SOURCE";
}

export function classifyNoisePaths(filePaths, rules = readRules()) {
  const summary = {
    GENERATED_NOISE: [],
    VALID_SOURCE: [],
    REVIEW_REQUIRED: [],
  };

  for (const filePath of filePaths || []) {
    const classification = classifyNoisePath(filePath, rules);
    summary[classification].push(filePath);
  }

  return {
    classifications: summary,
    counts: {
      GENERATED_NOISE: summary.GENERATED_NOISE.length,
      VALID_SOURCE: summary.VALID_SOURCE.length,
      REVIEW_REQUIRED: summary.REVIEW_REQUIRED.length,
    },
  };
}
