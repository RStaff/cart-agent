#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "✅ Backup created"

node - <<'NODE'
import fs from "node:fs";

const file = "web/src/routes/webhooks.js";
let s = fs.readFileSync(file, "utf8");

// Insert policy block after secret/hmacOk calculation (after line containing 'let hmacOk = false;')
if (!s.includes("ABANDO_HMAC_POLICY")) {
  s = s.replace(
    /let hmacOk = false;\n([\s\S]*?)\n\s*const headerKeys/s,
    (match, inner) => {
      return `let hmacOk = false;\n${inner}\n\n    // === ABANDO_HMAC_POLICY ===\n    // Dev convenience: allow unsigned/invalid HMAC for local testing.\n    // Prod safety: reject invalid signatures.\n    const allowInsecure = (\n      process.env.ABANDO_ALLOW_INSECURE_WEBHOOKS === "1" ||\n      process.env.NODE_ENV !== "production"\n    );\n\n    // If Shopify sent an HMAC header, require it to validate unless insecure mode is allowed.\n    // If no HMAC header, we only allow it in insecure mode (local curl/CLI experimentation).\n    if (!allowInsecure) {\n      if (!hmac) {\n        return res.status(401).send("missing hmac");\n      }\n      if (!hmacOk) {\n        return res.status(401).send("invalid hmac");\n      }\n    }\n    // === /ABANDO_HMAC_POLICY ===\n\n    const headerKeys`;
    }
  );
}

fs.writeFileSync(file, s);
console.log("✅ Patched HMAC policy in:", file);
NODE

echo "🔍 Sanity:"
node --check "$FILE"
echo "✅ ESM syntax OK"

echo
echo "NEXT:"
cat <<'NEXT'
lsof -ti tcp:3000 | xargs -r kill -9
lsof -ti tcp:3001 | xargs -r kill -9

# allow insecure webhooks for local testing (keeps curl working)
export ABANDO_ALLOW_INSECURE_WEBHOOKS=1
./scripts/dev.sh cart-agent-dev.myshopify.com

# local trigger (still succeeds)
curl -i -X POST "http://localhost:3000/api/webhooks?shop=cart-agent-dev.myshopify.com&topic=checkouts/update" \
  -H 'Content-Type: application/json' \
  -d '{"ping":true}'

# DB proof
./scripts/81_verify_webhook_db.sh
NEXT
