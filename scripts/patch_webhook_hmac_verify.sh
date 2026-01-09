#!/usr/bin/env bash
set -euo pipefail

# ---- Config / discovery ----
CANDIDATES=(
  "web/src/index.js"
  "web/index.js"
  "web/server.js"
  "web/src/server.js"
)

TARGET=""
for f in "${CANDIDATES[@]}"; do
  if [ -f "$f" ]; then
    TARGET="$f"
    break
  fi
done

if [ -z "${TARGET:-}" ]; then
  echo "❌ Could not find a backend entry file to patch."
  echo "   Looked for:"
  printf "   - %s\n" "${CANDIDATES[@]}"
  echo
  echo "   Quick help: run one of these and tell me what exists:"
  echo "     ls -la web web/src 2>/dev/null || true"
  exit 1
fi

echo "🎯 Target file: $TARGET"

TS="$(date +%s)"
mkdir -p scripts

# ---- Backup ----
cp "$TARGET" "$TARGET.bak_$TS"
echo "📦 Backup created: $TARGET.bak_$TS"

# ---- Ensure body-parser dependency (backend dir guess) ----
# We assume your backend package.json is in ./web/package.json (common Shopify template).
if [ -f "web/package.json" ]; then
  echo "🔎 Ensuring body-parser exists in web/package.json ..."
  node - <<'NODE'
const fs = require("fs");
const path = require("path");

const pkgPath = path.resolve("web/package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

pkg.dependencies = pkg.dependencies || {};
if (!pkg.dependencies["body-parser"]) {
  pkg.dependencies["body-parser"] = "^1.20.2";
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("✅ Added body-parser to web/package.json");
} else {
  console.log("✅ body-parser already present in web/package.json");
}
NODE

  echo "📥 Installing deps in ./web ..."
  npm --prefix web install
else
  echo "⚠️ web/package.json not found; skipping body-parser install step."
  echo "   If your backend package.json is elsewhere, tell me the path and I’ll adapt the script."
fi

# ---- Patch webhook route + HMAC verification into TARGET ----
echo "🩹 Patching HMAC verification + raw body webhook route in $TARGET ..."
node - <<'NODE'
const fs = require("fs");
const path = require("path");

const target = process.env.TARGET || process.argv[1];
if (!target) throw new Error("Missing TARGET path");
const filePath = path.resolve(target);

let src = fs.readFileSync(filePath, "utf8");

// Safety: don't double-patch
if (src.includes("verifyShopifyWebhookHmac") || src.includes("X-Shopify-Hmac-Sha256") && src.includes("timingSafeEqual")) {
  console.log("✅ Looks like HMAC verification is already present. No changes made.");
  process.exit(0);
}

// 1) Ensure imports
function ensureImport(importLine) {
  if (!src.includes(importLine)) {
    // Insert after first import line if possible, else prepend
    const m = src.match(/^(import .+\n)/m);
    if (m) {
      src = src.replace(m[1], m[1] + importLine + "\n");
    } else {
      src = importLine + "\n" + src;
    }
  }
}

ensureImport(`import crypto from "crypto";`);
ensureImport(`import bodyParser from "body-parser";`);

// 2) Add helper function after imports block
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

  // timingSafeEqual requires equal length buffers
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(hmacHeader, "utf8");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
`.trim() + "\n\n";

// Place helper after the last import statement block
if (!src.includes("function verifyShopifyWebhookHmac")) {
  const importBlockMatch = src.match(/^(?:import .+\n)+/m);
  if (importBlockMatch) {
    src = src.replace(importBlockMatch[0], importBlockMatch[0] + "\n" + helper);
  } else {
    src = helper + src;
  }
}

// 3) Insert webhook route right after app initialization
// Try common patterns:
const appInitPatterns = [
  /const\s+app\s*=\s*express\(\)\s*;?/,
  /let\s+app\s*=\s*express\(\)\s*;?/,
  /var\s+app\s*=\s*express\(\)\s*;?/,
];

let inserted = false;

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

    // ✅ Verified webhook — continue with your existing webhook processing.
    // If you already have a router/controller for webhooks, call it here.
    return res.status(200).send("OK");
  }
);
`.trim() + "\n\n";

// If there's already an /api/webhooks route, don’t insert another.
// (You can extend this script later to wrap your existing handler.)
if (src.includes(`"/api/webhooks"`) || src.includes(`'/api/webhooks'`)) {
  console.log("⚠️ Found an existing /api/webhooks route in the file.");
  console.log("   This script did NOT add a duplicate route.");
  console.log("   Next step: we should wrap your existing handler with verifyShopifyWebhookHmac + raw body parsing.");
  fs.writeFileSync(filePath, src);
  process.exit(0);
}

for (const re of appInitPatterns) {
  const m = src.match(re);
  if (m) {
    src = src.replace(re, m[0] + "\n\n" + routeBlock.trim());
    inserted = true;
    break;
  }
}

// If we couldn't find app init, append near top as fallback (still better than nothing)
if (!inserted) {
  console.log("⚠️ Could not find express app initialization line (e.g., const app = express()).");
  console.log("   Appending webhook route near top; you may need to ensure 'app' exists before this runs.");
  src = routeBlock + src;
}

fs.writeFileSync(filePath, src);
console.log("✅ Patched:", filePath);
NODE "$TARGET"

echo
echo "🔎 Quick grep sanity check:"
grep -n "verifyShopifyWebhookHmac" -n "$TARGET" || true
grep -n "/api/webhooks" -n "$TARGET" || true

echo
echo "✅ Patch complete."
echo "Next: deploy/restart backend and re-run the Shopify automated check."
