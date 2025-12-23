#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
SCHEMA="web/prisma/schema.prisma"
MIGRATION_NAME="abando_webhook_events_v1"

test -f "$SCHEMA" || { echo "❌ Prisma schema not found: $SCHEMA"; exit 1; }

ts() { date +"%Y%m%d_%H%M%S"; }

echo "🧱 STEP 3 — DB-backed webhook events (Prisma migration + wiring)"
echo "Repo: $ROOT"
echo "Schema: $SCHEMA"
echo "Migration: $MIGRATION_NAME"
echo

# ------------------------------------------------------------------------------
# 1) Backup schema + append model (idempotent)
# ------------------------------------------------------------------------------
cp "$SCHEMA" "$SCHEMA.bak_$(ts)"
echo "✅ Backup: $SCHEMA.bak_*"

if grep -q "model AbandoWebhookEvent" "$SCHEMA"; then
  echo "ℹ️ Prisma model AbandoWebhookEvent already exists (skipping append)."
else
  cat <<'PRISMA' >> "$SCHEMA"

//
// ABANDO — webhook event persistence
//
model AbandoWebhookEvent {
  id          String   @id @default(cuid())
  shop        String
  topic       String
  apiVersion  String?
  bytes       Int      @default(0)
  hmacOk      Boolean  @default(false)

  // Raw request capture (useful for debugging signature + payload)
  headers     Json
  query       Json?
  bodyJson    Json?
  bodyText    String?
  rawBody     Bytes?

  receivedAt  DateTime @default(now())

  @@index([shop, receivedAt])
  @@index([topic, receivedAt])
}
PRISMA
  echo "✅ Appended model AbandoWebhookEvent to schema.prisma"
fi

# ------------------------------------------------------------------------------
# 2) Write DB helper lib (ESM) – recordWebhookEvent + query helpers
# ------------------------------------------------------------------------------
LIB="web/src/lib/webhook_events.js"
cp -f "$LIB" "$LIB.bak_$(ts)" 2>/dev/null || true

cat <<'JS' > "$LIB"
// web/src/lib/webhook_events.js (ESM)
// DB-backed webhook event store via Prisma

import { PrismaClient } from "@prisma/client";

// Prisma singleton (safe for nodemon reload)
const prisma =
  globalThis.__abandoPrisma ||
  new PrismaClient({
    log: process.env.ABANDO_PRISMA_LOGS ? ["query", "error", "warn"] : ["error"],
  });

globalThis.__abandoPrisma = prisma;

export async function recordWebhookEvent(e) {
  // Keep this function resilient: never throw to the webhook responder.
  try {
    if (!e?.shop || !e?.topic) return null;

    return await prisma.abandoWebhookEvent.create({
      data: {
        shop: String(e.shop),
        topic: String(e.topic),
        apiVersion: e.apiVersion ? String(e.apiVersion) : null,
        bytes: Number.isFinite(e.bytes) ? e.bytes : 0,
        hmacOk: Boolean(e.hmacOk),
        headers: e.headers ?? {},
        query: e.query ?? null,
        bodyJson: e.bodyJson ?? null,
        bodyText: e.bodyText ?? null,
        rawBody: e.rawBody ?? null,
        // receivedAt default now()
      },
    });
  } catch (_err) {
    return null;
  }
}

export async function hasWebhookEventsForShop(shop) {
  try {
    const n = await prisma.abandoWebhookEvent.count({
      where: { shop: String(shop) },
    });
    return n > 0;
  } catch (_err) {
    return false;
  }
}

export async function lastWebhookEventForShop(shop) {
  try {
    return await prisma.abandoWebhookEvent.findFirst({
      where: { shop: String(shop) },
      orderBy: { receivedAt: "desc" },
      select: { topic: true, receivedAt: true, hmacOk: true, bytes: true },
    });
  } catch (_err) {
    return null;
  }
}
JS

echo "✅ Wrote DB helper: $LIB"

# ------------------------------------------------------------------------------
# 3) Patch webhook route to persist to DB
# ------------------------------------------------------------------------------
ROUTE="web/src/routes/webhooks.js"
test -f "$ROUTE" || { echo "❌ Missing route file: $ROUTE"; exit 1; }
cp "$ROUTE" "$ROUTE.bak_$(ts)"

# Rewrite the whole route file to eliminate drift/leftovers.
cat <<'JS' > "$ROUTE"
// web/src/routes/webhooks.js (ESM)
// Clean webhook receiver that records events to DB (Prisma)

import express from "express";
import { createHmac } from "node:crypto";
import { recordWebhookEvent } from "../lib/webhook_events.js";

const router = express.Router();

// IMPORTANT: Shopify webhook verification requires the RAW request body.
// We mount this router at /api/webhooks, so this raw middleware is local to the route.
router.post("/", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    // 1) Identify shop/topic (prefer Shopify headers, fallback to query for CLI tests)
    const topicHeader = req.get("x-shopify-topic");
    const shopHeader = req.get("x-shopify-shop-domain");
    const apiVersion = req.get("x-shopify-api-version") || null;

    const topic = topicHeader || req.query?.topic || "unknown";
    const shop = shopHeader || req.query?.shop || "unknown";

    // 2) Capture body
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const bytes = raw.length;

    // Best-effort decode
    let bodyText = null;
    let bodyJson = null;
    try {
      bodyText = raw.toString("utf8");
      // only parse if it looks like JSON
      if (bodyText && (bodyText.startsWith("{") || bodyText.startsWith("["))) {
        bodyJson = JSON.parse(bodyText);
      }
    } catch (_e) {
      bodyText = null;
      bodyJson = null;
    }

    // 3) HMAC verification (optional during dev, but we compute it safely)
    const hmac = req.get("x-shopify-hmac-sha256");
    const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_APP_SECRET;

    let hmacOk = false;
    if (hmac && secret) {
      const digest = createHmac("sha256", secret).update(raw).digest("base64");
      hmacOk = digest === hmac;
    }

    const headerKeys = Object.keys(req.headers || {}).sort();

    // 4) Persist (never block delivery if DB write fails)
    await recordWebhookEvent({
      shop,
      topic,
      apiVersion,
      bytes,
      hmacOk,
      headers: req.headers || {},
      query: req.query || {},
      bodyJson,
      bodyText,
      rawBody: raw,
    });

    console.log("[webhooks] received", {
      shop,
      topic,
      bytes,
      has_hmac: Boolean(hmac),
      hmac_ok: hmacOk,
      headerKeys,
    });

    // Shopify expects 200 to acknowledge receipt; during dev do not 500.
    return res.status(200).send("ok");
  } catch (e) {
    console.error("[webhooks] handler failed:", e?.stack || e);
    return res.status(200).send("ok");
  }
});

export default router;
JS

echo "✅ Rewrote route to persist to DB: $ROUTE"

# ------------------------------------------------------------------------------
# 4) Patch rescue gating to read DB instead of in-memory
# ------------------------------------------------------------------------------
RESCUE="web/src/routes/rescue.js"
test -f "$RESCUE" || { echo "❌ Missing rescue file: $RESCUE"; exit 1; }
cp "$RESCUE" "$RESCUE.bak_$(ts)"

node <<'NODE'
const fs = require("fs");

const file = "web/src/routes/rescue.js";
let s = fs.readFileSync(file, "utf8");

// Ensure imports for DB helpers exist
if (!s.includes('hasWebhookEventsForShop') || !s.includes('lastWebhookEventForShop')) {
  // Insert after existing imports (best effort)
  const importLine = 'import { hasWebhookEventsForShop, lastWebhookEventForShop } from "../lib/webhook_events.js";\n';
  if (!s.includes(importLine)) {
    // place after first import statement or at top
    const m = s.match(/^import .*\n/m);
    if (m) {
      const idx = s.indexOf(m[0]) + m[0].length;
      s = s.slice(0, idx) + importLine + s.slice(idx);
    } else {
      s = importLine + s;
    }
  }
}

// Replace sync hasEvents usage with async DB calls inside the /real handler.
// We look for: const hasEvents = hasWebhookEventsForShop(shop);
// and upgrade it to await, also add lastEvent.
s = s.replace(
  /const\s+hasEvents\s*=\s*hasWebhookEventsForShop\(shop\);\s*\n/g,
  'const hasEvents = await hasWebhookEventsForShop(shop);\n'
);

// If lastEvent not present, add it near hasEvents
if (!s.includes("lastWebhookEventForShop(")) {
  s = s.replace(
    /const\s+hasEvents\s*=\s*await\s+hasWebhookEventsForShop\(shop\);\n/,
    'const hasEvents = await hasWebhookEventsForShop(shop);\n  const lastEvent = await lastWebhookEventForShop(shop);\n'
  );
}

// If response includes reason only, keep it; optional: include lastEvent
if (!s.includes('"last_webhook_event"')) {
  s = s.replace(
    /reason:\s*hasEvents\s*\?\s*"Simulated events present"\s*:\s*"No webhook events yet",/g,
    'reason: hasEvents ? "Events present" : "No webhook events yet",\n    last_webhook_event: lastEvent || null,'
  );
  s = s.replace(
    /reason:\s*hasEvents\s*\?\s*"Events present"\s*:\s*"No webhook events yet",/g,
    'reason: hasEvents ? "Events present" : "No webhook events yet",\n    last_webhook_event: lastEvent || null,'
  );
}

// Light cleanup: collapse huge blank runs
s = s.replace(/\n{6,}/g, "\n\n\n");

fs.writeFileSync(file, s);
console.log("✅ Patched rescue gating to use DB-backed webhook events:", file);
NODE

# ------------------------------------------------------------------------------
# 5) Run Prisma migration (single migration)
# ------------------------------------------------------------------------------
echo
echo "🧬 Running Prisma migration (dev): $MIGRATION_NAME"
(
  cd web
  npx prisma migrate dev --name "$MIGRATION_NAME"
  npx prisma generate
)

# ------------------------------------------------------------------------------
# 6) Sanity checks
# ------------------------------------------------------------------------------
echo
echo "🔍 Sanity checks:"
node --check web/src/lib/webhook_events.js
node --check web/src/routes/webhooks.js
node --check web/src/routes/rescue.js
node --check web/src/index.js
echo "✅ ESM syntax OK"

echo
echo "✅ STEP 3 COMPLETE."
echo
echo "NEXT (copy/paste):"
cat <<'NEXT'
lsof -ti tcp:3000 | xargs -r kill -9
lsof -ti tcp:3001 | xargs -r kill -9
./scripts/dev.sh cart-agent-dev.myshopify.com

# Trigger locally
curl -i -X POST "http://localhost:3000/api/webhooks?shop=cart-agent-dev.myshopify.com&topic=checkouts/update" \
  -H 'Content-Type: application/json' \
  -d '{"ping":true}'

# Confirm /real gate reads DB now (should be ready:true + show last_webhook_event)
curl -fsS "http://localhost:3001/api/rescue/real?shop=cart-agent-dev.myshopify.com" | cat

# (Optional) Quick DB proof via Prisma Studio
# (cd web && npx prisma studio)
NEXT
