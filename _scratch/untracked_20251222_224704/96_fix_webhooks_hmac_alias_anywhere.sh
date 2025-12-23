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

// If any `const hmac = ...` already exists, don't add a duplicate.
if (/\bconst\s+hmac\s*=/.test(s) || /\blet\s+hmac\s*=/.test(s)) {
  console.log("ℹ️ hmac already defined in file. No change.");
  process.exit(0);
}

// Anchor: after `const hmacHeader = ...`
const anchor = /(const\s+hmacHeader\s*=\s*\([^\n]*x-shopify-hmac-sha256[^\n]*\)\s*;)/m;

if (!anchor.test(s)) {
  console.error("❌ Could not find `const hmacHeader = ...x-shopify-hmac-sha256...` to anchor the patch.");
  console.error("   Run: grep -n \"hmacHeader\" web/src/routes/webhooks.js");
  process.exit(1);
}

s = s.replace(anchor, `$1\n    const hmac = hmacHeader; // alias for any legacy references`);

fs.writeFileSync(file, s);
console.log("✅ Patched: inserted `const hmac = hmacHeader;` alias");
NODE

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ ESM syntax OK"

echo "🔎 Confirm alias exists:"
grep -nE "const hmac = hmacHeader" "$FILE" || true
