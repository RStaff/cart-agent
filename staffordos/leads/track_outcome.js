#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const LEADS_DIR = path.join(ROOT, "staffordos", "leads");
const TOP_TARGETS_PATH = path.join(LEADS_DIR, "top_targets.json");
const OUTCOMES_PATH = path.join(LEADS_DIR, "outcomes.json");

const STATUS_ORDER = [
  "routed",
  "audit_opened",
  "experience_opened",
  "recovery_sent",
  "return_tracked",
  "closed",
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

function computeStatus(entry) {
  if (entry.status === "closed") return "closed";
  if (entry.return_tracked) return "return_tracked";
  if (entry.recovery_sent) return "recovery_sent";
  if (entry.experience_opened) return "experience_opened";
  if (entry.audit_opened) return "audit_opened";
  return "routed";
}

function buildOutcome(target, existing = null) {
  const base = {
    domain: normalizeDomain(target?.domain),
    score: Number(target?.score || 0),
    audit_link: String(target?.audit_link || ""),
    experience_link: String(target?.experience_link || ""),
    audit_opened: false,
    experience_opened: false,
    recovery_sent: false,
    return_tracked: false,
    status: "routed",
    notes: "",
    updated_at: new Date().toISOString(),
  };

  const merged = existing
    ? {
        ...base,
        ...existing,
        domain: base.domain,
        score: base.score,
        audit_link: base.audit_link,
        experience_link: base.experience_link,
      }
    : base;

  merged.status = computeStatus(merged);
  merged.updated_at = new Date().toISOString();
  return merged;
}

function loadOutcomes() {
  const parsed = readJson(OUTCOMES_PATH, []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveOutcomes(outcomes) {
  writeJson(OUTCOMES_PATH, outcomes);
}

function findOutcome(outcomes, domain) {
  const normalized = normalizeDomain(domain);
  return outcomes.find((entry) => normalizeDomain(entry?.domain) === normalized) || null;
}

function requireDomain(value) {
  const domain = normalizeDomain(value);
  if (!domain) {
    console.error("Domain is required.");
    process.exit(1);
  }
  return domain;
}

function seedOutcomes() {
  const topTargets = readJson(TOP_TARGETS_PATH, []);
  const outcomes = loadOutcomes();
  const byDomain = new Map(outcomes.map((entry) => [normalizeDomain(entry?.domain), entry]));

  const next = topTargets.map((target) => {
    const domain = normalizeDomain(target?.domain);
    return buildOutcome(target, byDomain.get(domain) || null);
  });

  saveOutcomes(next);
  console.log(`Seeded outcomes: ${next.length}`);
}

function markField(command, domainInput, field) {
  const domain = requireDomain(domainInput);
  const outcomes = loadOutcomes();
  const existing = findOutcome(outcomes, domain);

  if (!existing) {
    console.error(`No outcome found for ${domain}`);
    process.exit(1);
  }

  existing[field] = true;
  existing.status = computeStatus(existing);
  existing.updated_at = new Date().toISOString();
  saveOutcomes(outcomes);
  console.log(`${command}: ${domain} → ${existing.status}`);
}

function addNote(domainInput, note) {
  const domain = requireDomain(domainInput);
  const outcomes = loadOutcomes();
  const existing = findOutcome(outcomes, domain);

  if (!existing) {
    console.error(`No outcome found for ${domain}`);
    process.exit(1);
  }

  existing.notes = String(note || "").trim();
  existing.status = computeStatus(existing);
  existing.updated_at = new Date().toISOString();
  saveOutcomes(outcomes);
  console.log(`note: ${domain}`);
}

function printSummary() {
  const outcomes = loadOutcomes();
  const counts = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0]));

  for (const entry of outcomes) {
    const status = computeStatus(entry);
    counts[status] = (counts[status] || 0) + 1;
  }

  const advanced = outcomes
    .map((entry) => ({ ...entry, status: computeStatus(entry) }))
    .filter((entry) => entry.status !== "routed")
    .sort((a, b) => STATUS_ORDER.indexOf(b.status) - STATUS_ORDER.indexOf(a.status) || a.domain.localeCompare(b.domain));

  console.log("Outcome Summary:");
  STATUS_ORDER.slice(0, 5).forEach((status) => {
    console.log(`- ${status}: ${counts[status] || 0}`);
  });

  console.log("\nTop advanced targets:");
  if (advanced.length === 0) {
    console.log("None");
    return;
  }

  advanced.slice(0, 5).forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.domain} → ${entry.status}`);
  });
}

function printUsage() {
  console.log("Usage:");
  console.log("  node staffordos/leads/track_outcome.js seed");
  console.log("  node staffordos/leads/track_outcome.js mark-audit-opened <domain>");
  console.log("  node staffordos/leads/track_outcome.js mark-experience-opened <domain>");
  console.log("  node staffordos/leads/track_outcome.js mark-recovery-sent <domain>");
  console.log("  node staffordos/leads/track_outcome.js mark-return-tracked <domain>");
  console.log("  node staffordos/leads/track_outcome.js note <domain> \"note\"");
  console.log("  node staffordos/leads/track_outcome.js summary");
}

function main() {
  const command = String(process.argv[2] || "").trim();

  if (command === "seed") {
    seedOutcomes();
    return;
  }

  if (command === "mark-audit-opened") {
    markField(command, process.argv[3], "audit_opened");
    return;
  }

  if (command === "mark-experience-opened") {
    markField(command, process.argv[3], "experience_opened");
    return;
  }

  if (command === "mark-recovery-sent") {
    markField(command, process.argv[3], "recovery_sent");
    return;
  }

  if (command === "mark-return-tracked") {
    markField(command, process.argv[3], "return_tracked");
    return;
  }

  if (command === "note") {
    addNote(process.argv[3], process.argv[4]);
    return;
  }

  if (command === "summary") {
    printSummary();
    return;
  }

  printUsage();
  process.exit(1);
}

main();
