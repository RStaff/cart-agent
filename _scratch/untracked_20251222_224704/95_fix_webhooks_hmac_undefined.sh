#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "✅ Backup created"

node <<'NODE'
import fs from "node:fs";

const file = "web/src/routes/webhooks.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("const hmac = computedHmac;") || s.includes("let hmac = computedHmac;")) {
  console.log("ℹ️ hmac alias already present. No change.");
  process.exit(0);
}

// Insert `const hmac = computedHmac;` right after computedHmac is set.
const re = /(const\s+computedHmac\s*=\s*createHmac\([^\n]+\)\.update\([^\n]+\)\.digest\("base64"\)\s*;)/m;

if (!re.test(s)) {
  console.error("❌ Could not find computedHmac assignment to anchor the patch.");
  console.error("   Quick check: grep -n 'computedHmac' web/src/routes/webhooks.js");
  process.exit(1);
}

s = s.replace(re, `$1\n    const hmac = computedHmac; // alias for legacy references`);

fs.writeFileSync(file, s);
console.log("✅ Patched: added `hmac` alias to prevent ReferenceError");
NODE

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ ESM syntax OK"

echo "🔎 Confirm alias exists:"
grep -nE "const hmac = computedHmac" "$FILE" || true
