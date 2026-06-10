import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      out[key] = "true";
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function clean(value, fallback = "") {
  const text = String(value ?? fallback).trim();
  return text.length ? text : fallback;
}

const args = parseArgs(process.argv.slice(2));
const outputPath = path.resolve(
  process.cwd(),
  clean(args.output, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md")
);

const store = clean(args.store, "unavailable");
const date = clean(args.date, new Date().toISOString().slice(0, 10));
const affected = clean(args.affected_page_or_artifact, "unavailable");
const screenshot = clean(args.after_screenshot, "[pending]");
const afterNotes = clean(args.after_notes, "unavailable");
const remaining = clean(args.remaining_limitations, "unavailable");
const observed = clean(args.observed_improvement, "unavailable");
const summary = clean(args.merchant_facing_summary, "unavailable");

const content = [
  "# AFTER EVIDENCE",
  "",
  "Store:",
  store,
  "",
  "Date:",
  date,
  "",
  "Affected Page / Artifact:",
  affected,
  "",
  "Screenshot:",
  screenshot,
  "",
  "After Notes:",
  afterNotes,
  "",
  "Observed Improvement:",
  observed,
  "",
  "Remaining Limitations:",
  remaining,
  "",
  "Merchant-Facing Summary:",
  summary,
  ""
].join("\n");

fs.writeFileSync(outputPath, content, "utf8");

console.log(`Wrote ${outputPath}`);
