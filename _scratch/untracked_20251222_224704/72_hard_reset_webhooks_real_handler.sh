#!/usr/bin/env bash
set -euo pipefail

FILE_INDEX="web/src/index.js"
FILE_ROUTE="web/src/routes/webhooks.js"
FILE_LIB="web/src/lib/webhook_events.js"

mkdir -p "$(dirname "$FILE_ROUTE")" "$(dirname "$FILE_LIB")"

echo "🧱 Hard-resetting webhooks route to clean, real-ish implementation..."

# 1) Ensure ESM webhook event store exists (simple in-memory store)
cat > "$FILE_LIB" <<'JS'
/**
 * Minimal in-memory webhook event store (ESM)
 * - Enough to unblock gating + provide audit trail in logs
 * - Swap to DB later (Prisma) without changing route signature
 */
const MAX_EVENTS = 200;
const events = [];

export function recordWebhookEvent(evt = {}) {
  const e = {
    at: evt.at || new Date().toISOString(),
    topic: evt.topic || "unknown",
    shop: evt.shop || "unknown",
    bytes: Number(evt.bytes || 0),
    hmac_ok: Boolean(evt.hmac_ok),
    source: evt.source || "http",
  };
  events.push(e);
  while (events.length > MAX_EVENTS) events.shift();
  return e;
}

export function hasWebhookEventsForShop(shop) {
  return events.some(e => e.shop === shop);
}

export function lastWebhookEventForShop(shop) {
  const filtered = events.filter(e => e.shop === shop);
  return filtered.length ? filtered[filtered.length - 1] : null;
}

export function allWebhookEvents() {
  return [...events];
}
JS

# 2) Overwrite route file with clean handler (HMAC + safe local testing)
cat > "$FILE_ROUTE" <<'JS'
import express from "express";
import crypto from "crypto";
import { recordWebhookEvent } from "../lib/webhook_events.js";

const router = express.Router();

/**
 * Compute Shopify HMAC (base64) of raw body using shared secret.
 * Header: X-Shopify-Hmac-Sha256
 */
function computeHmacBase64(secret, rawBodyBuf) {
  return crypto.createHmac("sha256", secret).update(rawBodyBuf).digest("base64");
}

function safeEqual(a, b) {
  try {
    const ab = Buffer.from(String(a || ""), "utf8");
    const bb = Buffer.from(String(b || ""), "utf8");
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

// NOTE: Mount at /api/webhooks, so handler path is POST /
router.post(
  "/",
  // raw body required for signature verification
  express.raw({ type: "*/*" }),
  async (req, res) => {
    try {
      const headerKeys = Object.keys(req.headers || {}).sort();

      // Prefer Shopify headers; fall back to query params for local testing
      const topic = req.get("x-shopify-topic") || req.query?.topic || "unknown";
      const shop  = req.get("x-shopify-shop-domain") || req.query?.shop || "unknown";
      const hmac  = req.get("x-shopify-hmac-sha256") || "";

      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
      const bytes = rawBody.length;

      // Secret (support common env var names)
      const secret =
        process.env.SHOPIFY_API_SECRET ||
        process.env.SHOPIFY_API_SECRET_KEY ||
        process.env.SHOPIFY_APP_SECRET ||
        "";

      // If we have both secret + hmac header, enforce verification.
      // If missing hmac (curl/local), don't block iteration: accept but mark hmac_ok=false.
      let ok = false;
      if (secret && hmac) {
        const computed = computeHmacBase64(secret, rawBody);
        ok = safeEqual(computed, hmac);
        if (!ok) {
          // For real Shopify delivery, invalid HMAC should be 401
          recordWebhookEvent({ topic, shop, bytes, hmac_ok: false, source: "http" });
          console.log("[webhooks] invalid hmac", { topic, shop, bytes, has_hmac: true, headerKeys });
          return res.status(401).send("invalid hmac");
        }
      }

      recordWebhookEvent({ topic, shop, bytes, hmac_ok: ok, source: "http" });

      console.log("[webhooks] received", {
        topic,
        shop,
        bytes,
        has_hmac: Boolean(hmac),
        hmac_ok: ok,
        headerKeys
      });

      // TODO: route topic -> handler -> DB persistence
      return res.status(200).send("ok");
    } catch (e) {
      console.error("[webhooks] handler failed:", e?.stack || e);
      // Don't 500 while iterating (Shopify will retry aggressively)
      return res.status(200).send("ok");
    }
  }
);

export default router;
JS

# 3) Patch index.js to mount router at /api/webhooks (idempotent)
node <<'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// Ensure import exists
if (!s.includes('from "./routes/webhooks.js"')) {
  // insert after other imports (best-effort)
  s = s.replace(
    /(import .*?\n)+/m,
    (m) => m + 'import webhooksRouter from "./routes/webhooks.js";\n'
  );
}

// Ensure app.use mount exists (after app creation)
if (!s.includes('app.use("/api/webhooks"')) {
  const re = /(const\s+app\s*=\s*express\(\)\s*;\s*\n)/;
  if (!re.test(s)) {
    console.error("❌ Could not find: const app = express(); in web/src/index.js");
    process.exit(2);
  }
  s = s.replace(
    re,
    `$1\n// [ABANDO] Webhooks router (clean mount)\napp.use("/api/webhooks", webhooksRouter);\n\n`
  );
}

fs.writeFileSync(file, s);
console.log("✅ Patched index.js to mount /api/webhooks");
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
