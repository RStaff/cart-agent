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

function listBlock(title, values) {
  const items = Array.isArray(values) ? values.map((item) => `- ${item}`) : [];
  return [title, ...items, ""];
}

const args = parseArgs(process.argv.slice(2));
const outputPath = path.resolve(
  process.cwd(),
  clean(args.output, "staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md")
);

const store = clean(args.store, "unavailable");
const scopedFix = clean(args.scoped_fix, "unavailable");
const inScope = clean(args.in_scope, "[]").split("|").filter(Boolean);
const outOfScope = clean(args.out_of_scope, "[]").split("|").filter(Boolean);
const merchantApprovalNeeded = clean(args.merchant_approval_needed, "no");
const changeMade = clean(args.change_made, "unavailable");
const locationChanged = clean(args.location_changed, "unavailable");
const implementationNotes = clean(args.implementation_notes, "unavailable");
const successCriteria = clean(args.success_criteria, "unavailable");

const content = [
  "# FIX SCOPE",
  "",
  "Store:",
  store,
  "",
  "Scoped Fix:",
  scopedFix,
  "",
  ...listBlock("In Scope:", inScope),
  ...listBlock("Out of Scope:", outOfScope),
  "Merchant Approval Needed:",
  merchantApprovalNeeded,
  "",
  "Change Made:",
  changeMade,
  "",
  "Location Changed:",
  locationChanged,
  "",
  "Implementation Notes:",
  implementationNotes,
  "",
  "Success Criteria:",
  successCriteria,
  ""
].join("\n");

fs.writeFileSync(outputPath, content, "utf8");

console.log(`Wrote ${outputPath}`);
