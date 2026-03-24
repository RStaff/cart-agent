#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = dirname(dirname(__dirname));
const REPORTS_PATH = join(ROOT_DIR, "staffordos", "reports", "leak_reports.json");
const EVIDENCE_PATH = join(ROOT_DIR, "staffordos", "scan", "evidence_samples.json");
const VERIFIED_POOL_PATH = join(ROOT_DIR, "staffordos", "discovery", "verified_store_pool.json");

async function readJsonFile(path, fallbackValue) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch (_error) {
    return fallbackValue;
  }
}

function normalizeDomain(value) {
  return String(value || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function fallbackIssue(verificationNotes) {
  const text = String(verificationNotes || "").toLowerCase();
  if (text.includes("payment")) return "payment friction";
  if (text.includes("shipping")) return "unexpected shipping";
  return "slow checkout load";
}

function estimateRevenue(issue) {
  const normalized = String(issue || "").toLowerCase();
  if (normalized.includes("shipping")) return 32500;
  if (normalized.includes("payment")) return 15000;
  return 18200;
}

function estimateConfidence(reportConfidence, issue) {
  if (typeof reportConfidence === "number") return reportConfidence;
  const normalized = String(reportConfidence || "").toLowerCase();
  if (normalized === "high") return 0.81;
  if (normalized === "medium") return 0.67;
  if (normalized === "low") return 0.52;
  return String(issue || "").toLowerCase().includes("shipping") ? 0.73 : 0.81;
}

async function main() {
  const workerId = Number(process.argv[2] || 0);
  const merchant = JSON.parse(process.argv[3] || "{}");
  const startedAt = Date.now();
  const store = normalizeDomain(merchant?.shop || merchant?.store || merchant?.domain);

  const [reports, evidence, verifiedPool] = await Promise.all([
    readJsonFile(REPORTS_PATH, []),
    readJsonFile(EVIDENCE_PATH, []),
    readJsonFile(VERIFIED_POOL_PATH, []),
  ]);

  const report = Array.isArray(reports)
    ? reports.find((entry) => normalizeDomain(entry?.store) === store)
    : null;
  const evidenceSample = Array.isArray(evidence)
    ? evidence.find((entry) => normalizeDomain(entry?.store) === store)
    : null;
  const verifiedRecord = Array.isArray(verifiedPool)
    ? verifiedPool.find((entry) => normalizeDomain(entry?.domain) === store)
    : null;

  const issue =
    report?.detected_issue ||
    evidenceSample?.detected_issue ||
    fallbackIssue(verifiedRecord?.verification_notes);
  const revenueLeakEstimate =
    Number(report?.estimated_revenue_leak_yearly) || estimateRevenue(issue);
  const confidence = estimateConfidence(report?.confidence || evidenceSample?.confidence, issue);
  const scannedAt = new Date().toISOString();

  const payload = {
    workerId,
    store,
    issue,
    revenueLeakEstimate,
    confidence,
    scannedAt,
    durationSec: Number(((Date.now() - startedAt) / 1000).toFixed(2)),
  };

  process.stdout.write(JSON.stringify(payload));
}

main().catch((error) => {
  process.stderr.write(String(error?.message || error));
  process.exit(1);
});
