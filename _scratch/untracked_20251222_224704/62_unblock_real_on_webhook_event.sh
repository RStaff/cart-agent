#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
WEBHOOK_FILE="web/src/index.js"
RESCUE_FILE="web/src/routes/rescue.js"
LIB_DIR="web/src/lib"
LIB_FILE="$LIB_DIR/webhook_events.js"

ts() { date +"%Y%m%d_%H%M%S"; }

test -f "$WEBHOOK_FILE" || { echo "❌ Missing $WEBHOOK_FILE"; exit 1; }
test -f "$RESCUE_FILE"  || { echo "❌ Missing $RESCUE_FILE"; exit 1; }

mkdir -p "$LIB_DIR"

cp "$WEBHOOK_FILE" "$WEBHOOK_FILE.bak_$(ts)"
cp "$RESCUE_FILE"  "$RESCUE_FILE.bak_$(ts)"

cat << 'JS' > "$LIB_FILE"
const fs = require("fs");
const path = require("path");

const STORE_PATH = path.resolve(process.cwd(), ".abando_webhook_events.json");

function loadStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return { byShop: {} };
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  } catch {
    return { byShop: {} };
  }
}

function saveStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function recordWebhookEvent({ shop, topic, has_hmac, bytes, headerKeys }) {
  const store = loadStore();
  const key = shop || "unknown";
  const now = new Date().toISOString();

  if (!store.byShop[key]) {
    store.byShop[key] = { count: 0, last_topic: null, last_at: null, last_has_hmac: null };
  }

  store.byShop[key].count += 1;
  store.byShop[key].last_topic = topic || "unknown";
  store.byShop[key].last_at = now;
  store.byShop[key].last_has_hmac = Boolean(has_hmac);

  // keep some lightweight debug info
  store.byShop[key].last_bytes = bytes ?? null;
  store.byShop[key].last_header_keys = Array.isArray(headerKeys) ? headerKeys : null;

  saveStore(store);
  return store.byShop[key];
}

function getShopStats(shop) {
  const store = loadStore();
  return store.byShop?.[shop] || null;
}

function hasWebhookEvents(shop) {
  const stats = getShopStats(shop);
  return Boolean(stats && stats.count > 0);
}

module.exports = {
  STORE_PATH,
  recordWebhookEvent,
  getShopStats,
  hasWebhookEvents,
};
JS

# --- Patch web/src/index.js: require helper + record inside /api/webhooks handler
node - <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

if (!s.includes('require("./lib/webhook_events")') && !s.includes('require("./lib/webhook_events.js")')) {
  // Insert require near the top, after express import if possible
  const re = /(const\s+express\s*=\s*require\(["']express["']\);\s*\n)/;
  if (re.test(s)) {
    s = s.replace(re, `$1const { recordWebhookEvent } = require("./lib/webhook_events");\n`);
  } else {
    // fallback: put at very top
    s = `const { recordWebhookEvent } = require("./lib/webhook_events");\n` + s;
  }
}

if (!s.includes('app.post("/api/webhooks"')) {
  console.error("❌ Could not find app.post(\"/api/webhooks\" in web/src/index.js");
  process.exit(2);
}

// Ensure handler captures query fallback and records store
// We will inject a recordWebhookEvent(...) call right after topic/shop are computed (or add them if missing).
if (!s.includes('recordWebhookEvent({')) {
  // find the /api/webhooks block opening
  const blockRe = /app\.post\("\/api\/webhooks"[\s\S]*?async\s*\(req,\s*res\)\s*=>\s*\{\n([\s\S]*?)\n\}\);\n/;
  const m = s.match(blockRe);
  if (!m) {
    console.error("❌ Could not parse /api/webhooks handler block for patching.");
    process.exit(3);
  }

  let block = m[0];

  // Add topic/shop extraction if not present
  if (!block.includes('const topic =') || !block.includes('const shop =')) {
    block = block.replace(
      /try\s*\{\n/,
      `try {\n    const topic = req.get("x-shopify-topic") || (req.query && req.query.topic) || "unknown";\n    const shop = req.get("x-shopify-shop-domain") || (req.query && req.query.shop) || "unknown";\n    const hmac = req.get("x-shopify-hmac-sha256");\n    const headerKeys = Object.keys(req.headers || {}).sort();\n`
    );
  }

  // Insert recordWebhookEvent call after those consts exist
  block = block.replace(
    /(const\s+headerKeys\s*=\s*Object\.keys\(req\.headers[\s\S]*?\);\n)/,
    `$1    const stats = recordWebhookEvent({ shop, topic, has_hmac: Boolean(hmac), bytes: (req.body && req.body.length) || 0, headerKeys });\n    console.log("[webhooks] recorded", { shop, topic, stats });\n`
  );

  s = s.replace(blockRe, block);
}

fs.writeFileSync(file, s);
console.log("✅ Patched webhook handler to record events:", file);
NODE

# --- Patch rescue gating in web/src/routes/rescue.js
node - <<'NODE'
const fs = require("fs");

const file = "web/src/routes/rescue.js";
let s = fs.readFileSync(file, "utf8");

// Add require at top if missing
if (!s.includes('require("../lib/webhook_events")') && !s.includes('require("../lib/webhook_events.js")')) {
  s = s.replace(
    /(const\s+router\s*=\s*require\(["']express["']\)\.Router\(\);\s*\n)/,
    `$1const { hasWebhookEvents, getShopStats } = require("../lib/webhook_events");\n`
  );
}

// Replace hasEvents logic around the "No webhook events yet" reason.
// We will conservatively replace the specific reason line pattern you showed.
s = s.replace(
  /reason:\s*hasEvents\s*\?\s*"Simulated events present"\s*:\s*"No webhook events yet",/g,
  `reason: (hasEvents || hasWebhookEvents(shop)) ? "Events present" : "No webhook events yet",`
);

// Ensure ready flips true if webhook events exist (even if simulated is false).
// Try to patch `ready: hasEvents` patterns.
s = s.replace(
  /ready:\s*hasEvents\b/g,
  `ready: (hasEvents || hasWebhookEvents(shop))`
);

// Add optional fields if not already present (non-breaking)
if (!s.includes("webhook_stats")) {
  s = s.replace(
    /res\.json\(\{\n/,
    `res.json({\n`
  );
  // best-effort: insert into response object if it has "shop:" field
  s = s.replace(
    /(shop:\s*shop,\s*\n)/,
    `$1      webhook_stats: getShopStats(shop) || null,\n`
  );
}

fs.writeFileSync(file, s);
console.log("✅ Patched rescue gating to accept webhook events:", file);
NODE

echo "✅ Wrote: $LIB_FILE"
echo
echo "NEXT:"
echo "  1) lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  2) ./scripts/dev.sh cart-agent-dev.myshopify.com"
echo "  3) Trigger webhook with query fallback so shop/topic are NOT undefined:"
echo "       shopify app webhook trigger --topic checkouts/update --api-version 2025-07 --delivery-method http --address \"https://waterproof-propose-wit-gage.trycloudflare.com/api/webhooks?shop=cart-agent-dev.myshopify.com&topic=checkouts/update\""
echo "  4) tail -n 120 .dev_express.log"
echo "  5) curl -fsS \"http://localhost:3001/api/rescue/real?shop=cart-agent-dev.myshopify.com\" | cat"
