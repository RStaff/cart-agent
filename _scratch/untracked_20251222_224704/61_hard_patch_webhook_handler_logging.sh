#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

BK="$FILE.bak_$(date +%Y%m%d_%H%M%S)"
cp "$FILE" "$BK"
echo "✅ Backup: $BK"

node - <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// Replace the FIRST /api/webhooks handler block we previously inserted.
const re = /app\.post\("\/api\/webhooks"[\s\S]*?\n\}\);\n/;

if (!re.test(s)) {
  console.error("❌ Could not find existing app.post(\"/api/webhooks\"...) block to replace.");
  process.exit(2);
}

const replacement = `
app.post("/api/webhooks", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    const headerKeys = Object.keys(req.headers || {}).sort();
    const topic = req.get("x-shopify-topic");
    const shop = req.get("x-shopify-shop-domain");
    const hmac = req.get("x-shopify-hmac-sha256");
    const apiVersion = req.get("x-shopify-api-version");
    const bytes = (req.body && req.body.length) ? req.body.length : 0;

    console.log("[webhooks] received", {
      bytes,
      topic,
      shop,
      apiVersion,
      has_hmac: Boolean(hmac),
      headerKeys
    });

    res.status(200).send("ok");
  } catch (e) {
    console.error("[webhooks] error", e);
    res.status(500).send("error");
  }
});
`;

s = s.replace(re, replacement);
fs.writeFileSync(file, s);
console.log("✅ Patched webhook handler in", file);
NODE

echo
echo "Sanity (should show /api/webhooks):"
grep -nE 'app\.post\("/api/webhooks"|headerKeys|x-shopify-topic|x-shopify-shop-domain' "$FILE" || true
