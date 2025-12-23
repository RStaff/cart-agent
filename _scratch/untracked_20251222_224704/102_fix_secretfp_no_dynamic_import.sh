#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

node - <<'NODE'
import fs from "node:fs";

const file = "web/src/routes/webhooks.js";
let s = fs.readFileSync(file, "utf8");

// 1) Ensure crypto import includes createHash
const importRe = /import\s+\{\s*([^}]+)\s*\}\s+from\s+"node:crypto";/m;
const m = s.match(importRe);
if (!m) {
  console.error("❌ Could not find node:crypto import.");
  process.exit(1);
}

let names = m[1].split(",").map(x => x.trim()).filter(Boolean);
if (!names.includes("createHash")) names.push("createHash");
const newImport = `import { ${names.join(", ")} } from "node:crypto";`;
s = s.replace(importRe, newImport);

// 2) Replace the dynamic-import secretFp line with createHash(...)
const dynRe = /secretFp:\s*\(secret\s*\?\s*\(await import\("node:crypto"\)\)\.createHash\("sha256"\)\.update\(String\(secret\)\)\.digest\("hex"\)\.slice\(0,\s*12\)\s*:\s*null\)\s*,/m;

if (!dynRe.test(s)) {
  console.error("❌ Could not find dynamic-import secretFp line to replace.");
  console.error("   Run: grep -n \"secretFp\" web/src/routes/webhooks.js");
  process.exit(1);
}

s = s.replace(
  dynRe,
  'secretFp: (secret ? createHash("sha256").update(String(secret)).digest("hex").slice(0, 12) : null),'
);

fs.writeFileSync(file, s, "utf8");
console.log("✅ Patched: secretFp now uses createHash (no dynamic import).");
NODE

echo "🔍 Sanity:"
node --check "$FILE"
echo "✅ ESM syntax OK"

echo
echo "🔎 Confirm crypto import + secretFp:"
grep -nE 'from "node:crypto"|secretFp' "$FILE" | sed -n '1,120p'
