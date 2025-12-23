#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
FILE_INDEX="web/src/index.js"
FILE_ROUTE="web/src/routes/webhooks.js"
FILE_LIB="web/src/lib/webhook_events.js"

test -f "$FILE_INDEX" || { echo "❌ missing $FILE_INDEX"; exit 1; }

ts() { date +"%Y%m%d_%H%M%S"; }

echo "🧱 Hard-resetting webhooks route to a clean, real-ish structure..."

# backups
cp "$FILE_INDEX" "$FILE_INDEX.bak_$(ts)"
mkdir -p "$(dirname "$FILE_ROUTE")" "$(dirname "$FILE_LIB")"

# 1) Write an ESM webhook event store (simple in-memory, per shop)
cat << 'LIB' > "$FILE_LIB"
/**
 * In-memory webhook event store (dev-safe).
 * Replace later with DB persistence.
 */
const _events = new Map(); // shop -> [{topic, bytes, hmac_ok, at}]

export function recordWebhookEvent(evt = {}) {
  const shop = String(evt.shop || "unknown");
  const arr = _events.get(shop) || [];
  arr.push({
    topic: String(evt.topic || "unknown"),
    bytes: Number(evt.bytes || 0),
    hmac_ok: Boolean(evt.hmac_ok),
    at: String(evt.at || new Date().toISOString()),
  });
  // keep last 50
  if (arr.length > 50) arr.splice(0, arr.length - 50);
  _events.set(shop, arr);
}

export function hasWebhookEventsForShop(shop) {
  const arr = _events.get(String(shop || "unknown")) || [];
  return arr.length > 0;
}

export function lastWebhookEventForShop(shop) {
  const arr = _events.get(String(shop || "unknown")) || [];
  return arr.length ? arr[arr.length - 1] : null;
}
LIB

# 2) Write a clean webhooks route module
cat << 'ROUTE' > "$FILE_ROUTE"
import express from "express";
import { recordWebhookEvent } from "../lib/webhook_events.js";

/**
 * Registers POST /api/webhooks
 * - Uses express.raw for signature verification support
 * - Pulls topic/shop from headers, falls back to query string for CLI/testing
 * - Records events (dev) so rescue gating can see them
 *
 * NOTE: This does NOT depend on Shopify SDK yet. We'll wire shopify.processWebhooks next.
 */
export function registerWebhooksRoute(app) {
  app.post("/api/webhooks", express.raw({ type: "*/*" }), async (req, res) => {
    try {
      // ✅ DEFINE FIRST (avoid TDZ bugs)
      const headerKeys = Object.keys(req.headers || {}).sort();
      const topic = req.get("x-shopify-topic") || req.query?.topic || "unknown";
      const shop = req.get("x-shopify-shop-domain") || req.query?.shop || "unknown";
      const hmac = req.get("x-shopify-hmac-sha256");
      const bytes = req.body?.length || 0;

      // For now we do NOT reject unsigned test calls; just record what we got.
      // When we wire Shopify SDK, it will validate HMAC and route topics.
      const hmac_ok = Boolean(hmac); // placeholder (real verify comes later)

      recordWebhookEvent({
        topic,
        shop,
        bytes,
        hmac_ok,
        at: new Date().toISOString(),
      });

      console.log("[webhooks] received", {
        topic,
        shop,
        bytes,
        has_hmac: Boolean(hmac),
        hmac_ok,
        headerKeys,
      });

      return res.status(200).send("ok");
    } catch (e) {
      console.error("[webhooks] handler failed:", e?.stack || e);
      // don't 500 Shopify while iterating
      return res.status(200).send("ok");
    }
  });
}
ROUTE

# 3) Ensure index.js imports + registers route exactly once
node <<'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// Ensure import exists (ESM)
if (!s.includes('from "./routes/webhooks.js"') && !s.includes('from "./routes/webhooks"')) {
  // Insert after first import line block
  const lines = s.split("\n");
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ")) insertAt = i + 1;
  }
  lines.splice(insertAt, 0, 'import { registerWebhooksRoute } from "./routes/webhooks.js";');
  s = lines.join("\n");
}

// Remove any prior inline app.post("/api/webhooks"... stubs to avoid double routes
s = s.replace(/^\s*app\.post\("\/api\/webhooks"[\s\S]*?\n\}\);\s*\n/mi, "");

// Ensure we call registerWebhooksRoute(app) once, soon after app is created
if (!s.includes("registerWebhooksRoute(app)")) {
  const re = /(const\s+app\s*=\s*express\(\)\s*;\s*\n)/;
  if (!re.test(s)) {
    console.error("❌ Could not find `const app = express();` in web/src/index.js");
    process.exit(2);
  }
  s = s.replace(re, `$1\n// [ABANDO] Webhooks route\nregisterWebhooksRoute(app);\n`);
}

// write back
fs.writeFileSync(file, s);
console.log("✅ Patched index.js to register webhooks route cleanly");
NODE

echo "✅ Wrote:"
echo " - $FILE_LIB"
echo " - $FILE_ROUTE"
echo " - $FILE_INDEX (patched)"

echo
echo "🔍 Sanity checks:"
node --check web/src/index.js
node --check web/src/routes/webhooks.js
node --check web/src/lib/webhook_events.js
echo "✅ ESM syntax OK"

echo
echo "NEXT:"
echo "  1) lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  2) ./scripts/dev.sh cart-agent-dev.myshopify.com"
echo "  3) curl -i -X POST 'http://localhost:3000/api/webhooks?shop=cart-agent-dev.myshopify.com&topic=checkouts/update' -H 'Content-Type: application/json' -d '{\"ping\":true}'"
echo "  4) tail -n 120 .dev_express.log"
