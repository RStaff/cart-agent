import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md"
);

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
const store = clean(args.store, "unavailable");
const date = clean(args.date, new Date().toISOString().slice(0, 10));
const affected = clean(args.affected, "unavailable");
const issue = clean(args.issue, "unavailable");
const why = clean(args.why, "unavailable");
const screenshot = clean(args.screenshot, "[pending]");
const notes = clean(args.notes, "unavailable");

const markdown = [
  "# BEFORE EVIDENCE",
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
  "Issue:",
  issue,
  "",
  "Why It Matters:",
  why,
  "",
  "Screenshot:",
  screenshot,
  "",
  "Notes:",
  notes
].join("\n") + "\n";

fs.writeFileSync(OUTPUT_PATH, markdown, "utf8");

console.log(`Wrote ${OUTPUT_PATH}`);
