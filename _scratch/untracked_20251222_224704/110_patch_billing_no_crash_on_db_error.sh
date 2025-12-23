#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/billing.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

node - <<'NODE'
const fs = require("fs");

const file = "web/src/routes/billing.js";
let s = fs.readFileSync(file, "utf8");

// Heuristic: wrap the existing handler body in try/catch if it calls getBillingState()
// and does not already have a try/catch around it.
if (!s.includes("getBillingState")) {
  console.error("❌ billing.js does not reference getBillingState(); aborting patch.");
  process.exit(1);
}

if (s.includes("db_unavailable") || s.includes("ABANDO_DB_UNAVAILABLE")) {
  console.log("ℹ️ Looks already patched; exiting.");
  process.exit(0);
}

// Try to find an async route handler and inject try/catch at top-level of handler.
const re = /(router\.(get|post)\([^)]*\)\s*,\s*async\s*\(req,\s*res\)\s*=>\s*\{\s*)([\s\S]*?)(\n\}\)\s*;?)/m;
const m = s.match(re);

if (!m) {
  console.error("❌ Could not locate async router handler to patch in billing.js");
  console.error("   Open the file and we’ll patch with a tighter anchor.");
  process.exit(1);
}

const head = m[1];
const body = m[3];
const tail = m[4];

// If body already starts with try {, don't double wrap.
if (/^\s*try\s*\{/.test(body)) {
  console.log("ℹ️ Handler already wrapped in try/catch; exiting.");
  process.exit(0);
}

const wrapped =
`${head}
  try {
${body.replace(/^/gm, "    ")}
  } catch (e) {
    console.error("[billing] DB unavailable (non-fatal):", e?.message || e);
    return res.status(200).json({
      ok: true,
      billing: "unknown",
      db: "unavailable",
      note: "Dev safety: billing endpoint returned without crashing server"
    });
  }
${tail}`;

s = s.replace(re, wrapped);

fs.writeFileSync(file, s, "utf8");
console.log("✅ Patched billing route: Prisma errors no longer crash dev server.");
NODE

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ billing.js parses"
