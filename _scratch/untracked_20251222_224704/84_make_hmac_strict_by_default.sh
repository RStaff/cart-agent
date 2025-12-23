#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

node <<'NODE'
const fs = require("fs");
const file = "web/src/routes/webhooks.js";
let s = fs.readFileSync(file, "utf8");

// Replace allowInsecure definition block to be env-flag only
s = s.replace(
  /const\s+allowInsecure\s*=\s*\([\s\S]*?\);\n\s*\n\s*\/\/ If Shopify sent an HMAC header,[\s\S]*?if\s*\(!allowInsecure\)\s*\{\n\s*if\s*\(!hmac\)\s*\{[\s\S]*?\}\n\s*if\s*\(!hmacOk\)\s*\{[\s\S]*?\}\n\s*\}\n/s,
`const allowInsecure = (process.env.ABANDO_ALLOW_INSECURE_WEBHOOKS === "1");

// If Shopify sent an HMAC header, require it to validate unless insecure mode is enabled.
// If no HMAC header, we only allow it in insecure mode (local curl/CLI experimentation).
if (!allowInsecure) {
  if (!hmac) return res.status(401).send("missing hmac");
  if (!hmacOk) return res.status(401).send("invalid hmac");
}
`
);

fs.writeFileSync(file, s);
console.log("✅ Patched strict HMAC-by-default:", file);
NODE

echo "🔍 Sanity:"
node --check "$FILE"
grep -n "const allowInsecure" -n "$FILE" || true
