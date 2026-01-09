#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"
test -f "$TARGET" || { echo "❌ Missing $TARGET"; exit 1; }

TS="$(date +%s)"
cp "$TARGET" "$TARGET.bak_$TS"
echo "📦 Backup: $TARGET.bak_$TS"

PATCH="$(mktemp)"
cat > "$PATCH" <<'NODE'
import fs from "fs";
import path from "path";

const filePath = process.argv[2];
let src = fs.readFileSync(filePath, "utf8");

const MARKER = "ABANDO_WEBHOOK_HMAC_RECEIVER_V1";

// 1) Ensure crypto import (ESM)
if (!src.match(/^\s*import\s+crypto\s+from\s+["']crypto["'];/m)) {
  // Insert after first import, else at top
  const firstImport = src.match(/^\s*import .*;$/m);
  if (firstImport) {
    src = src.replace(firstImport[0], firstImport[0] + `\nimport crypto from "crypto";`);
  } else {
    src = `import crypto from "crypto";\n` + src;
  }
  console.log("✅ Added crypto import");
}

// 2) Add helper if missing
if (!src.includes("function verifyShopifyWebhookHmac(req)")) {
  const helper = `\n\n// ${MARKER}\nfunction verifyShopifyWebhookHmac(req) {\n  const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || process.env.SHOPIFY_CLIENT_SECRET;\n  if (!secret) {\n    console.error("❌ Missing SHOPIFY_API_SECRET env var");\n    return false;\n  }\n\n  const shopifyHmac = req.headers["x-shopify-hmac-sha256"];\n  if (!shopifyHmac) return false;\n\n  // raw body buffer required\n  const raw = req.body;\n  if (!raw || !(raw instanceof Buffer)) return false;\n\n  const digest = crypto.createHmac("sha256", secret).update(raw).digest("base64");\n\n  try {\n    return crypto.timingSafeEqual(\n      Buffer.from(digest, "base64"),\n      Buffer.from(String(shopifyHmac), "base64")\n    );\n  } catch (e) {\n    return false;\n  }\n}\n`;
  src += helper;
  console.log("✅ Added verifyShopifyWebhookHmac helper");
} else {
  console.log("ℹ️ verifyShopifyWebhookHmac already present");
}

// 3) Add /api/webhooks receiver if missing
if (!src.includes('app.post("/api/webhooks"') && !src.includes("app.post('/api/webhooks'")) {
  const route = `\n\n// ${MARKER}\n// Generic webhook receiver (used by automated checks + any non-GDPR topics)\n// IMPORTANT: must use raw body BEFORE any JSON parsing for HMAC verification.\napp.post(\n  "/api/webhooks",\n  express.raw({ type: "*/*" }),\n  (req, res) => {\n    if (!verifyShopifyWebhookHmac(req)) {\n      console.error("❌ Webhook HMAC verification failed", {\n        topic: req.headers["x-shopify-topic"],\n        shop: req.headers["x-shopify-shop-domain"],\n        id: req.headers["x-shopify-webhook-id"],\n      });\n      return res.status(401).send("Invalid webhook");\n    }\n\n    // ACK fast (Shopify timeouts are strict). Queue work later if needed.\n    return res.status(200).send("OK");\n  }\n);\n`;

  // Insert after app init: const app = express()
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

  if (!inserted) {
    // fallback: append at end (still fine if app is defined by then)
    src += route;
  }

  console.log("✅ Added POST /api/webhooks receiver");
} else {
  console.log("ℹ️ /api/webhooks receiver already exists");
}

fs.writeFileSync(filePath, src);
console.log("✅ Wrote:", filePath);
NODE

node "$PATCH" "$TARGET"
rm -f "$PATCH" || true

echo
echo "🔎 Sanity checks:"
rg -n 'ABANDO_WEBHOOK_HMAC_RECEIVER_V1|verifyShopifyWebhookHmac|app\.post\("/api/webhooks"' "$TARGET" || true
echo
echo "✅ Patch complete."
