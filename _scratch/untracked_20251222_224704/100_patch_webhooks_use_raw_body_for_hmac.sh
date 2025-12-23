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

// Ensure express import exists (needed for express.raw)
if (!s.match(/from\s+["']express["']/)) {
  console.error("❌ Could not find express import in webhooks.js");
  process.exit(1);
}

// If already patched, exit
if (s.includes("ABANDO_RAW_WEBHOOK_BODY")) {
  console.log("ℹ️ Already patched for raw webhook body.");
  process.exit(0);
}

// 1) Add a raw-body middleware for the webhook route.
// We anchor on router.post( ... "/api/webhooks" ... ) and inject express.raw as first middleware.
const postRe = /(router\.post\(\s*["']\/api\/webhooks["']\s*,)/;
if (!postRe.test(s)) {
  console.error("❌ Could not find router.post('/api/webhooks'...) to patch.");
  console.error("   Quick check: grep -n \"router.post(\\\"/api/webhooks\\\"\" web/src/routes/webhooks.js");
  process.exit(1);
}

s = s.replace(
  postRe,
  `$1\n  // === ABANDO_RAW_WEBHOOK_BODY ===\n  // Shopify signs the raw bytes. Use express.raw so HMAC matches.\n  express.raw({ type: "*/*" }),\n`
);

// 2) Ensure we compute HMAC from raw Buffer.
// Anchor on hmacHeader line and inject a canonical raw buffer variable right after.
const hmacHeaderRe = /(const hmacHeader\s*=\s*\(req\.get\(["']x-shopify-hmac-sha256["']\)[\s\S]*?\)\.trim\(\);)/;
if (!hmacHeaderRe.test(s)) {
  console.error("❌ Could not find `const hmacHeader = (req.get('x-shopify-hmac-sha256')...)` anchor.");
  console.error("   Run: grep -n \"hmacHeader\" web/src/routes/webhooks.js");
  process.exit(1);
}

s = s.replace(
  hmacHeaderRe,
  `$1\n\n    // === ABANDO_RAW_WEBHOOK_BODY ===\n    const raw = Buffer.isBuffer(req.body)\n      ? req.body\n      : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}));\n`
);

// 3) Make sure we use `raw` when hashing.
// Anchor on createHmac(...).update(...) and force `.update(raw)` if we can find a reasonable line.
const updateRe = /createHmac\(\s*["']sha256["']\s*,\s*secretKeyUsed\s*\)\s*\.update\([\s\S]*?\)\s*\.digest\(["']base64["']\)/;
if (!updateRe.test(s)) {
  // If we can't find it reliably, don't fail — just warn.
  console.log("⚠️ Could not find createHmac(...).update(...) digest('base64') to force raw usage.");
  console.log("   The earlier patch may already be using rawBody; proceed to verify with debug logs.");
} else {
  s = s.replace(
    updateRe,
    `createHmac("sha256", secretKeyUsed).update(raw).digest("base64")`
  );
}

fs.writeFileSync(file, s);
console.log("✅ Patched webhook route to use raw body bytes for HMAC.");
NODE

echo "🔍 Sanity:"
node --check "$FILE"
echo "✅ ESM syntax OK"

echo "🔎 Confirm raw middleware + raw buffer:"
grep -n "ABANDO_RAW_WEBHOOK_BODY" -n "$FILE" | head
