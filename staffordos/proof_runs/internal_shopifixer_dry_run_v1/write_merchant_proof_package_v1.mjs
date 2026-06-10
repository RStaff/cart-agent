import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractSection(text, label) {
  const pattern = new RegExp(
    `^${label}:\\s*$([\\s\\S]*?)(?=^\\w[\\w -]+:\\s*$|\\Z)`,
    "m"
  );
  const match = text.match(pattern);
  return match ? match[1].trim() : "";
}

function clean(value, fallback = "") {
  const text = String(value ?? fallback).trim();
  return text.length ? text : fallback;
}

const args = process.argv.slice(2);
const outputArgIndex = args.findIndex((arg) => arg === "--output");
const outputPath = path.resolve(
  process.cwd(),
  outputArgIndex >= 0 && args[outputArgIndex + 1]
    ? args[outputArgIndex + 1]
    : "staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md"
);

const baseDir = path.resolve(process.cwd(), "staffordos/proof_runs/internal_shopifixer_dry_run_v1");
const beforePath = path.join(baseDir, "before_evidence.md");
const fixScopePath = path.join(baseDir, "fix_scope.md");
const afterPath = path.join(baseDir, "after_evidence.md");

const before = readText(beforePath);
const fixScope = readText(fixScopePath);
const after = readText(afterPath);

const store = clean(extractSection(before, "Store"), extractSection(fixScope, "Store"));
const beforeIssue = clean(extractSection(before, "Issue"), "unavailable");
const whyItMattered = clean(extractSection(before, "Why It Matters"), "unavailable");
const scopedFix = clean(extractSection(fixScope, "Scoped Fix"), "unavailable");
const whatWasChanged = [
  scopedFix,
  clean(extractSection(after, "What Changed"), "")
].filter(Boolean).join(" ");
const beforeEvidence = clean(before.replace(/^# BEFORE EVIDENCE\s*/m, "").trim(), "unavailable");
const afterEvidence = clean(after.replace(/^# AFTER EVIDENCE\s*/m, "").trim(), "unavailable");
const proofSummary = clean(extractSection(after, "Observed Improvement"), "unavailable");
const nextWatchItem = clean(
  extractSection(after, "Remaining Limitations"),
  "Complete a real merchant proof run with before screenshot, scoped fix, after screenshot, and merchant-facing summary."
);

const completionStatus = "proof_package_composed_from_existing_evidence";

const content = [
  "# MERCHANT PROOF PACKAGE",
  "",
  "Store:",
  store,
  "",
  "Problem Found:",
  beforeIssue,
  "",
  "Why It Mattered:",
  whyItMattered,
  "",
  "What Was Changed:",
  whatWasChanged || "unavailable",
  "",
  "Before Evidence:",
  beforeEvidence,
  "",
  "After Evidence:",
  afterEvidence,
  "",
  "Proof Summary:",
  proofSummary,
  "",
  "Recommended Next Watch Item:",
  nextWatchItem,
  "",
  "Completion Status:",
  completionStatus,
  ""
].join("\n");

fs.writeFileSync(outputPath, content, "utf8");

console.log(`Wrote ${outputPath}`);
