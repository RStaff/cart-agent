#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%Y%m%d_%H%M%S)"

node <<'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

if (!s.includes('app.post("/api/webhooks"')) {
  console.error("❌ No /api/webhooks route found.");
  process.exit(2);
}

// Replace the whole route block safely.
const re = /app\.post\("\/api\/webhooks"[\s\S]*?\n\}\);\n/;

const replacement = `
app.post("/api/webhooks", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    const headerKeys = Object.keys(req.headers || {}).sort();

    // ✅ DEFINE FIRST (prevents TDZ)
    const topic = req.get("x-shopify-topic") || req.query?.topic || null;
    const shop  = req.get("x-shopify-shop-domain") || req.query?.shop || null;

    const bytes =
      Buffer.isBuffer(req.body) ? req.body.length :
      (typeof req.body === "string" ? Buffer.byteLength(req.body) :
      Buffer.byteLength(JSON.stringify(req.body || {})));

    const hmac = req.get("x-shopify-hmac-sha256");

    console.log("[webhooks] received", { topic, shop, bytes, has_hmac: Boolean(hmac), headerKeys });

    // Record event if helper exists — never throw
    try {
      if (typeof recordWebhookEvent === "function") {
        recordWebhookEvent({ topic, shop, bytes });
      }
    } catch (e) {
      console.error("[webhooks] recordWebhookEvent failed:", e?.stack || e);
    }

    return res.status(200).send("ok");
  } catch (e) {
    console.error("[webhooks] handler failed:", e?.stack || e);
    // ✅ Don’t fail delivery while iterating
    return res.status(200).send("ok");
  }
});
`;

if (!re.test(s)) {
  console.error("❌ Could not match the webhook route block for replacement.");
  process.exit(3);
}

s = s.replace(re, replacement);
fs.writeFileSync(file, s);
console.log("✅ Fixed TDZ in webhook handler:", file);
NODE

echo "Sanity:"
node --check web/src/index.js
grep -nE 'app\.post\("/api/webhooks"|DEFINE FIRST|webhooks\] received' web/src/index.js || true
