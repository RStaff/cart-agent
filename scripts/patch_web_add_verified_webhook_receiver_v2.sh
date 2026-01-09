#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"
test -f "$TARGET" || { echo "❌ Missing $TARGET"; exit 1; }

TS="$(date +%s)"
cp "$TARGET" "$TARGET.bak_$TS"
echo "📦 Backup: $TARGET.bak_$TS"

node --input-type=module <<'NODE'
import fs from "fs";

const filePath = "web/src/index.js";
let src = fs.readFileSync(filePath, "utf8");

const MARKER = "ABANDO_WEBHOOK_HMAC_RECEIVER_V2";

// Ensure crypto import exists (ESM)
if (!src.match(/^\s*import\s+crypto\s+from\s+["']crypto["'];/m)) {
  const firstImport = src.match(/^\s*import .*;$/m);
  if (firstImport) {
    src = src.replace(firstImport[0], firstImport[0] + `\nimport crypto from "crypto";`);
  } else {
    src = `import crypto from "crypto";\n` + src;
  }
  console.log("✅ Added crypto import");
} else {
  console.log("ℹ️ crypto import already present");
}

// Add helper if missing
if (!src.includes("function verifyShopifyWebhookHmac(req)")) {
  src += `\n\n// ${MARKER}\nfunction verifyShopifyWebhookHmac(req) {\n  const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || process.env.SHOPIFY_CLIENT_SECRET;\n  if (!secret) {\n    console.error("❌ Missing SHOPIFY_API_SECRET env var");\n    return false;\n  }\n\n  const shopifyHmac = req.headers["x-shopify-hmac-sha256"];\n  if (!shopifyHmac) return false;\n\n  const raw = req.body;\n  if (!raw || !(raw instanceof Buffer)) return false;\n\n  const digest = crypto.createHmac("sha256", secret).update(raw).digest("base64");\n  try {\n    return crypto.timingSafeEqual(\n      Buffer.from(digest, "base64"),\n      Buffer.from(String(shopifyHmac), "base64")\n    );\n  } catch {\n    return false;\n  }\n}\n`;
  console.log("✅ Added verifyShopifyWebhookHmac helper");
} else {
  console.log("ℹ️ verifyShopifyWebhookHmac already present");
}

// Add /api/webhooks receiver if missing
const hasReceiver =
  src.includes('app.post("/api/webhooks"') ||
  src.includes("app.post('/api/webhooks'");

if (!hasReceiver) {
  const route = `\n\n// ${MARKER}\n// Generic webhook receiver used by automated checks + non-GDPR topics\napp.post(\n  "/api/webhooks",\n  express.raw({ type: "*/*" }),\n  (req, res) => {\n    if (!verifyShopifyWebhookHmac(req)) {\n      console.error("❌ Webhook HMAC verification failed", {\n        topic: req.headers["x-shopify-topic"],\n        shop: req.headers["x-shopify-shop-domain"],\n        id: req.headers["x-shopify-webhook-id"],\n      });\n      return res.status(401).send("Invalid webhook");\n    }\n    return res.status(200).send("OK");\n  }\n);\n`;

  const patterns = [
    /const\\s+app\\s*=\\s*express\\(\\)\\s*;?/,
    /let\\s+app\\s*=\\s*express\\(\\)\\s*;?/,
    /var\\s+app\\s*=\\s*express\\(\\)\\s*;?/
  ];

  let inserted = false;
  for (const re of patterns) {
    const m = src.match(re);
    if (m) {
      src = src.replace(re, m[0] + route);
      inserted = true;
      break;
    }
  }
  if (!inserted) src += route;

  console.log("✅ Added POST /api/webhooks receiver");
} else {
  console.log("ℹ️ /api/webhooks receiver already exists");
}

fs.writeFileSync(filePath, src);
console.log("✅ Wrote:", filePath);
NODE

echo
echo "🔎 Sanity checks:"
rg -n 'ABANDO_WEBHOOK_HMAC_RECEIVER_V2|verifyShopifyWebhookHmac|app\.post\("/api/webhooks"' "$TARGET" || true
echo
echo "✅ Patch complete."
