#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"
test -f "$TARGET" || { echo "❌ Missing $TARGET"; exit 1; }

TS="$(date +%s)"
cp "$TARGET" "$TARGET.bak_$TS"
echo "📦 Backup: $TARGET.bak_$TS"

PATCH="scripts/.tmp_patch_gdpr_hmac_v3.js"

cat <<'NODE' > "$PATCH"
const fs = require("fs");
const path = require("path");

const filePath = path.resolve("web/src/index.js");
let src = fs.readFileSync(filePath, "utf8");

// 1) Ensure crypto import exists (ESM style)
if (!src.includes('import crypto from "crypto";') && !src.includes('from "crypto"')) {
  const importsMatch = src.match(/^(?:import .+\n)+/m);
  const cryptoLine = 'import crypto from "crypto";\n';
  if (importsMatch) {
    src = src.replace(importsMatch[0], importsMatch[0] + cryptoLine);
  } else {
    src = cryptoLine + src;
  }
  console.log("✅ Added crypto import");
} else {
  console.log("✅ crypto import already present (or equivalent)");
}

// 2) Add helper if missing
if (!src.includes("function verifyShopifyWebhookHmac")) {
  const helper =
`function verifyShopifyWebhookHmac(req) {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256") || "";
  const secret =
    process.env.SHOPIFY_API_SECRET ||
    process.env.SHOPIFY_API_SECRET_KEY ||
    process.env.SHOPIFY_SECRET ||
    "";

  if (!secret || !hmacHeader) return false;

  const body = req.body;
  if (!Buffer.isBuffer(body)) return false;

  const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(hmacHeader, "utf8");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

`;

  const importsMatch = src.match(/^(?:import .+\n)+/m);
  if (importsMatch) {
    src = src.replace(importsMatch[0], importsMatch[0] + "\n" + helper);
  } else {
    src = helper + src;
  }
  console.log("✅ Added verifyShopifyWebhookHmac helper");
} else {
  console.log("✅ verifyShopifyWebhookHmac already exists");
}

// 3) Patch existing GDPR webhook handler to enforce verification
// We expect something like:
// app.post("/api/webhooks/gdpr", express.raw({ type: "*/*" }), (_req, res) => {
const gdprRouteRe = /app\.post\(\s*["']\/api\/webhooks\/gdpr["']\s*,\s*express\.raw\(\s*\{\s*type:\s*["'][^"']+["']\s*\}\s*\)\s*,\s*\(\s*(_req|req)\s*,\s*res\s*\)\s*=>\s*\{/m;

const m = src.match(gdprRouteRe);
if (!m) {
  console.error("❌ Could not find app.post('/api/webhooks/gdpr', express.raw(...), (req,res)=>{ ... })");
  process.exit(2);
}

const currentReqName = m[1];

// Replace the handler header to (req, res) and inject HMAC check right after the opening {
src = src.replace(gdprRouteRe, (full) => {
  // Ensure we normalize to (req, res)
  const normalized = full.replace(`(${currentReqName}, res)`, `(req, res)`);
  // Inject guard right after "{"
  const insertPoint = normalized.lastIndexOf("{") + 1;
  const guard =
`
  if (!verifyShopifyWebhookHmac(req)) {
    console.error("❌ GDPR webhook HMAC verification failed");
    return res.status(401).send("Invalid webhook");
  }
`;
  return normalized.slice(0, insertPoint) + guard + normalized.slice(insertPoint);
});

console.log("✅ Patched GDPR webhook route to verify HMAC");

// 4) Write back
fs.writeFileSync(filePath, src);
console.log("✅ Wrote:", filePath);
NODE

node "$PATCH"
rm -f "$PATCH" || true

echo
echo "🔎 Sanity checks:"
grep -n "verifyShopifyWebhookHmac" "$TARGET" || true
grep -n "/api/webhooks/gdpr" "$TARGET" || true
echo
echo "✅ Patch complete."
