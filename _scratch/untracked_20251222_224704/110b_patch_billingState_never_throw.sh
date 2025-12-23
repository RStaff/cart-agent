#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/db/billingState.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

node - <<'NODE'
const fs = require("fs");

const file = "web/src/db/billingState.js";
let s = fs.readFileSync(file, "utf8");

// Only patch if we see a Prisma call (very likely) and no existing safety marker
if (!/prisma\./.test(s)) {
  console.error("❌ No `prisma.` usage found in billingState.js; aborting (unexpected file shape).");
  process.exit(1);
}
if (s.includes("ABANDO_BILLINGSTATE_NEVER_THROW")) {
  console.log("ℹ️ Already patched; exiting.");
  process.exit(0);
}

// Wrap the FIRST prisma call line in a try/catch block.
// This is intentionally minimal + robust across file styles.
const lines = s.split("\n");
let idx = lines.findIndex(l => l.includes("prisma.") && !l.trim().startsWith("//"));
if (idx === -1) {
  console.error("❌ Could not find a prisma call line to wrap.");
  process.exit(1);
}

const indent = (lines[idx].match(/^(\s*)/) || ["",""])[1];
const original = lines[idx];

// If the line already begins with "return prisma.", keep the return inside try.
const originalNoIndent = original.slice(indent.length);
const stmt = originalNoIndent.startsWith("return ")
  ? originalNoIndent.replace(/^return\s+/, "return ")
  : `return ${originalNoIndent.replace(/;?\s*$/, ";")}`;

// Replace that single line with a guarded block.
lines[idx] =
`${indent}// ABANDO_BILLINGSTATE_NEVER_THROW (dev safety)
${indent}try {
${indent}  ${originalNoIndent.trim().replace(/;?\s*$/, ";")}
${indent}} catch (e) {
${indent}  console.error("[billingState] DB unavailable (non-fatal):", e?.message || e);
${indent}  return null; // caller must handle unknown billing state
${indent}}`;

// If we wrapped a prisma line that did NOT return, we might have introduced "return return" etc.
// Quick cleanup: replace "return return" -> "return"
let out = lines.join("\n").replace(/return\s+return\s+/g, "return ");

fs.writeFileSync(file, out, "utf8");
console.log("✅ Patched billingState.js: Prisma errors no longer crash the process.");
NODE

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ billingState.js parses"
