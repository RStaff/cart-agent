import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { classifyNoisePath } from "./noise_classifier_v1.js";
import {
  CANONICAL_ROOT,
  getHygieneOutputPath,
  isHygieneOutputPath,
} from "./runtime_support_v1.js";

const HYGIENE_DIR = path.join(CANONICAL_ROOT, "staffordos/hygiene");
const REPORT_PATH = getHygieneOutputPath("branch_scope_report.md");

function runGit(args) {
  return execFileSync("git", ["-C", CANONICAL_ROOT, ...args], {
    encoding: "utf8",
  }).trimEnd();
}

function uniqueSorted(values) {
  return [...new Set((values || []).filter(Boolean))].sort();
}

function parsePorcelainLine(line) {
  const rawPath = line.slice(3).trim();
  return rawPath.includes(" -> ") ? rawPath.split(" -> ").at(-1) : rawPath;
}

function concernFor(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");

  if (classifyNoisePath(normalized) === "GENERATED_NOISE") {
    return "experimental/future";
  }

  if (
    normalized.startsWith("staffordos/hygiene/") ||
    normalized.startsWith("staffordos/governance/") ||
    normalized.startsWith("staffordos/docs/")
  ) {
    return "governance/hygiene";
  }

  if (
    normalized === "package.json" ||
    normalized === "package-lock.json" ||
    normalized === "web/package.json" ||
    normalized === "web/package-lock.json" ||
    normalized === "shopify.app.toml" ||
    normalized === "shopify.app.r12b-dev.toml" ||
    normalized.startsWith("staffordos/deploy/") ||
    normalized === "abando-frontend/vercel.json" ||
    normalized === "abando-frontend/deploy_prod.sh" ||
    normalized === "abando-frontend/next.config.mjs" ||
    normalized === "abando-frontend/middleware.ts"
  ) {
    return "deploy/config";
  }

  if (
    normalized.startsWith("abando-frontend/app/") ||
    normalized.startsWith("abando-frontend/src/") ||
    normalized.startsWith("web/src/") ||
    normalized.startsWith("web/dev/") ||
    normalized.startsWith("web/src/content/")
  ) {
    return "proof-loop/product";
  }

  return "experimental/future";
}

function buildConcernMap(paths) {
  const map = {
    "governance/hygiene": [],
    "proof-loop/product": [],
    "deploy/config": [],
    "experimental/future": [],
  };

  for (const filePath of paths) {
    map[concernFor(filePath)].push(filePath);
  }

  for (const key of Object.keys(map)) {
    map[key] = uniqueSorted(map[key]);
  }

  return map;
}

function summarizeScope(concernMap) {
  const entries = Object.entries(concernMap)
    .map(([concern, paths]) => ({ concern, count: paths.length }))
    .sort((a, b) => b.count - a.count);

  const primary = entries[0] || { concern: "unknown", count: 0 };
  const nonZero = entries.filter((entry) => entry.count > 0);
  const heavyConcerns = entries.filter((entry) => entry.count >= 5);
  const mixedHeavy = heavyConcerns.length > 1;

  return {
    primaryConcern: primary.concern,
    nonZeroConcerns: nonZero,
    heavyConcerns,
    status: mixedHeavy ? "MIXED_SCOPE" : "CLEAN_SCOPE",
  };
}

function buildPromotionRisk(scopeSummary) {
  if (scopeSummary.status === "MIXED_SCOPE") {
    return "High. Promotion trust is weak because multiple major concerns are changing on the same branch.";
  }
  return "Lower. Current branch is mostly concentrated in one concern area.";
}

function buildSplitStrategy(scopeSummary) {
  if (scopeSummary.status === "MIXED_SCOPE") {
    const primary = scopeSummary.primaryConcern;
    const secondary = scopeSummary.heavyConcerns
      .filter((entry) => entry.concern !== primary)
      .map((entry) => entry.concern);
    return [
      `Keep ${primary} on the current branch.`,
      ...secondary.map((concern) => `Move ${concern} changes to a dedicated follow-up branch.`),
      "Do not attempt promotion from this branch until only one major concern remains active.",
    ];
  }

  return [
    `Keep working within ${scopeSummary.primaryConcern}.`,
    "Avoid adding a second major concern before the next promotion attempt.",
  ];
}

function toBulletList(items) {
  if (!items.length) return "- None";
  return items.map((item) => `- ${item}`).join("\n");
}

export function runBranchScopeGate() {
  const branchName = runGit(["branch", "--show-current"]);
  const porcelain = runGit(["status", "--porcelain=v1"]);
  const changedPaths = uniqueSorted(
    porcelain
      .split("\n")
      .filter(Boolean)
      .map(parsePorcelainLine)
      .filter((filePath) => !isHygieneOutputPath(filePath)),
  );
  const concernMap = buildConcernMap(changedPaths);
  const scopeSummary = summarizeScope(concernMap);

  return {
    branchName,
    changedPaths,
    concernMap,
    scopeSummary,
    promotionRisk: buildPromotionRisk(scopeSummary),
    recommendedBranchSplitStrategy: buildSplitStrategy(scopeSummary),
  };
}

export function renderBranchScopeReport(result) {
  return `# Branch Scope Report

## Branch Name

- \`${result.branchName}\`

## Primary Concern

- ${result.scopeSummary.primaryConcern}

## Mixed Concerns Detected

${toBulletList(
  result.scopeSummary.nonZeroConcerns.map(
    (entry) => `${entry.concern}: ${entry.count} changed path(s)`,
  ),
)}

## Promotion Risk

- Status: \`${result.scopeSummary.status}\`
- ${result.promotionRisk}

## Recommended Branch Split Strategy

${toBulletList(result.recommendedBranchSplitStrategy)}
`;
}

export function writeBranchScopeReport(markdown) {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, markdown, "utf8");
  if (!fs.existsSync(REPORT_PATH)) {
    throw new Error(`branch_scope_report.md was not created at ${REPORT_PATH}`);
  }
  const stats = fs.statSync(REPORT_PATH);
  if (!stats.isFile()) {
    throw new Error(`branch_scope_report.md path is not a file: ${REPORT_PATH}`);
  }
  return REPORT_PATH;
}

export { REPORT_PATH };
