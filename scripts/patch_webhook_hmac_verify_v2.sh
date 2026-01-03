#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"
test -f "$TARGET" || { echo "❌ Missing $TARGET"; exit 1; }

TS="$(date +%s)"
cp "$TARGET" "$TARGET.bak_$TS"
echo "📦 Backup: $TARGET.bak_$TS"

# Ensure body-parser exists in web/package.json (you already added it, but this is idempotent)
if [ -f "web/package.json" ]; then
  echo "🔎 Ensuring body-parser in web/package.json ..."
  node -e '
    const fs = require("fs");
    const path = require("path");
    const pkgPath = path.resolve("web/package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.dependencies = pkg.dependencies || {};
    if (!pkg.dependencies["body-parser"]) {
      pkg.dependencies["body-parser"] = "^1.20.2";
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
      console.log("✅ Added body-parser");
    } else {
      console.log("✅ body-parser already present");
    }
  '
  echo "📥 npm install (web) ..."
  npm --prefix web install
else
  echo "⚠️ web/package.json not found; skipping body-parser dependency step."
fi

echo "🩹 Patching $TARGET to add verified HMAC webhook route (raw body)..."

node -e '
  const fs = require("fs");
  const path = require("path");

  const filePath = path.resolve("web/src/index.js");
  let src = fs.readFileSync(filePath, "utf8");

  // If you already have verify func, do nothing
  if (src.includes("function verifyShopifyWebhookHmac") || src.includes("X-Shopify-Hmac-Sha256") && src.includes("timingSafeEqual")) {
    console.log("✅ HMAC verifier appears to already exist; no changes made.");
    process.exit(0);
  }

  function ensureImport(line) {
    if (src.includes(line)) return;
    const m = src.match(/^(?:import .+\\n)+/m);
    if (m) {
      src = src.replace(m[0], m[0] + line + "\\n");
    } else {
      src = line + "\\n" + src;
    }
  }

  ensureImport(`import crypto from "crypto";`);
  ensureImport(`import bodyParser from "body-parser";`);

  const helper = `
function verifyShopifyWebhookHmac(req) {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256") || "";
  const secret =
    process.env.SHOPIFY_API_SECRET ||
    process.env.SHOPIFY_API_SECRET_KEY ||
    process.env.SHOPIFY_SECRET ||
    "";

  if (!secret || !hmacHeader) return false;

  // req.body MUST be a Buffer from bodyParser.raw()
  const body = req.body;
  if (!Buffer.isBuffer(body)) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(hmacHeader, "utf8");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
`.trim() + "\\n\\n";

  // Insert helper after imports
  if (!src.includes("function verifyShopifyWebhookHmac")) {
    const m = src.match(/^(?:import .+\\n)+/m);
    if (m) src = src.replace(m[0], m[0] + "\\n" + helper);
    else src = helper + src;
  }

  // If /api/webhooks already exists, do not add duplicate; just exit with note.
  if (src.includes(`"/api/webhooks"`) || src.includes(`\'/api/webhooks\'`) || src.includes(`"/api/webhooks`)) {
    console.log("⚠️ Found existing /api/webhooks route; not adding a duplicate.");
    console.log("   Next step: we’ll wrap your existing handler with bodyParser.raw + verifyShopifyWebhookHmac.");
    fs.writeFileSync(filePath, src);
    process.exit(0);
  }

  const routeBlock = `
/**
 * Shopify webhook receiver (HMAC verified)
 * IMPORTANT: raw body required for HMAC verification
 */
app.post(
  "/api/webhooks",
  bodyParser.raw({ type: "application/json" }),
  (req, res) => {
    if (!verifyShopifyWebhookHmac(req)) {
      console.error("❌ Webhook HMAC verification failed");
      return res.status(401).send("Invalid webhook");
    }
    // ✅ Verified webhook
    return res.status(200).send("OK");
  }
);
`.trim() + "\\n\\n";

  // Insert after app init (best effort)
  const patterns = [
    /const\\s+app\\s*=\\s*express\\(\\)\\s*;?/,
    /let\\s+app\\s*=\\s*express\\(\\)\\s*;?/,
    /var\\s+app\\s*=\\s*express\\(\\)\\s*;?/
  ];

  let inserted = false;
  for (const re of patterns) {
    const m = src.match(re);
    if (m) {
      src = src.replace(re, m[0] + "\\n\\n" + routeBlock);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    console.log("⚠️ Could not find app = express() line. Prepending route block; ensure app exists before this runs.");
    src = routeBlock + src;
  }

  fs.writeFileSync(filePath, src);
  console.log("✅ Patched:", filePath);
'

echo
echo "🔎 Sanity checks:"
grep -n "verifyShopifyWebhookHmac" "$TARGET" || true
grep -n "/api/webhooks" "$TARGET" || true
echo
echo "✅ Done."
