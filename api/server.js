const { getRecommendation } = require("./recommendationPolicy");

"use strict";

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const { logEvent } = require("./lib/eventLogger");
const { classifyCartEvent } = require("./lib/aiLabeler");

const app = express();


// === ABANDO_WHOAMI_PROBE ===
// Prove which code/entrypoint is running in production.
app.get("/__whoami", (_req, res) => {
  res.set("X-Abando-Whoami", "api/server.js");
  res.status(200).type("text/plain").send("api/server.js");
});
// === END_ABANDO_WHOAMI_PROBE ===

// === ABANDO_GDPR_WEBHOOK_ROUTE ===
// Shopify GDPR webhooks: Shopify's automated checks often do GET/HEAD.
// We return 200 for GET/HEAD and 401 for POST when HMAC is missing/invalid.
// NOTE: Shopify's real GDPR topics are posted to your configured webhook path.
function _abandoVerifyShopifyWebhookHmac(req) {
  // NOTE: Shopify sends base64 HMAC in header.
  const hmacHeader = (req.get("X-Shopify-Hmac-Sha256") || "").trim();
  const secret =
    process.env.SHOPIFY_API_SECRET ||
    process.env.SHOPIFY_API_SECRET_KEY ||
    process.env.SHOPIFY_SECRET ||
    "";
  if (!secret || !hmacHeader) return false;

  // Raw body: ensure express.raw for this route.
  const crypto = require("crypto");
  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ""), "utf8");
  const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");
  // timing-safe compare
  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// GET/HEAD: prove route exists (Shopify check friendliness)
app.all("/api/webhooks/gdpr", (req, res, next) => {
  res.set("X-Abando-GDPR-Guard", "api/server.js");
  if (req.method === "GET" || req.method === "HEAD") return res.status(200).send("ok");
  return next();
});

// POST: must be raw for HMAC verification
app.post("/api/webhooks/gdpr", require("express").raw({ type: "*/*" }), (req, res) => {
  if (!_abandoVerifyShopifyWebhookHmac(req)) {
    return res.status(401).send("Invalid webhook");
  }
  return res.status(200).send("ok");
});
// === END_ABANDO_GDPR_WEBHOOK_ROUTE ===


app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------------
// Health check (include version so we can confirm deploy)
// -----------------------------------------------------------------------------
app.get("/healthz", (req, res) => {
  res.json({ ok: true, service: "cart-agent-api", version: "ai-segments-v1" });
});

// Shopify app/uninstalled webhook
app.post("/webhooks/shopify/app-uninstalled", express.json(), (req, res) => {
  const shopDomain = req.headers["x-shopify-shop-domain"];
  const topic = req.headers["x-shopify-topic"];

  console.log("[Shopify] app/uninstalled webhook received", {
    shopDomain,
    topic,
    receivedAt: new Date().toISOString(),
  });

  try {
    const payload =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    console.log("[Shopify] app/uninstalled payload:", payload);
  } catch (err) {
    console.warn(
      "[Shopify] app/uninstalled: could not parse payload as JSON, continuing."
    );
  }

  // IMPORTANT: always respond quickly with 200 so Shopify is happy.
  return res.status(200).send("OK");
});

// -----------------------------------------------------------------------------
// Simple log-test route (used by test_unified_events.sh)
// -----------------------------------------------------------------------------
// Simple log-test route (used by test_unified_events.sh)
// -----------------------------------------------------------------------------
app.post("/api/log-test", async (req, res) => {
  try {
    await logEvent({
      storeId: "test-store-log",
      eventType: "log_test",
      eventSource: "log-test-endpoint",
      customerId: null,
      cartId: null,
      checkoutId: null,
      value: 0,
      metadata: {
        note: "log-test ping",
        at: new Date().toISOString(),
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("[/api/log-test] error:", err && err.message ? err.message : err);
    res.status(500).json({
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
});

// -----------------------------------------------------------------------------
// Unified cart-event ingress + AI labeler
// This is what Shopify / your app will POST to.
// -----------------------------------------------------------------------------
app.post("/api/cart-event", async (req, res) => {
  try {
    const body = req.body || {};

    const {
      storeId,
      eventType,
      eventSource,
      customerId,
      cartId,
      checkoutId,
      value,
      aiLabel: incomingAiLabel,
      metadata: rawMetadata,
    } = body;

    const finalStoreId = storeId || "unknown-store";
    const finalEventType = eventType || "cart_event";
    const finalEventSource = eventSource || "cart-event-endpoint";

    // Normalized metadata object
    const baseMetadata =
      rawMetadata && typeof rawMetadata === "object" ? rawMetadata : {};

    // --- AI label: use incoming if provided, otherwise classify ---
    let finalAiLabel = incomingAiLabel || null;

    try {
      if (!finalAiLabel) {
        finalAiLabel = await classifyCartEvent({
          storeId: finalStoreId,
          eventType: finalEventType,
          eventSource: finalEventSource,
          customerId,
          cartId,
          checkoutId,
          value,
          metadata: baseMetadata,
        });
      }
      console.log("[/api/cart-event] classified:", finalAiLabel);
    } catch (err) {
      console.error(
        "[/api/cart-event] classifyCartEvent error:",
        err && err.message ? err.message : err
      );
      // Do NOT fail the request if the AI labeler has issues.
    }

    // Attach AI label into metadata so it's always queryable via metadata->'aiLabel'
    const metadataWithAi = {
      ...baseMetadata,
      aiLabel: finalAiLabel || null,
    };

    console.log("[/api/cart-event] metadataWithAi about to log:", metadataWithAi);

    await logEvent({
      storeId: finalStoreId,
      eventType: finalEventType,
      eventSource: finalEventSource,
      customerId,
      cartId,
      checkoutId,
      value,
      metadata: metadataWithAi,
    });

    res.json({
      ok: true,
      storeId: finalStoreId,
      eventType: finalEventType,
      eventSource: finalEventSource,
      aiLabel: finalAiLabel || null,
      metadata: metadataWithAi,
    });
  } catch (err) {
    console.error(
      "[/api/cart-event] error:",
      err && err.message ? err.message : err
    );
    res.status(500).json({
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
});

// -----------------------------------------------------------------------------
// /api/ai-segments/:storeId → JSON summary + recent labeled events
// -----------------------------------------------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


/**
 * recommendationMiddleware
 * - Wraps res.json for /api/ai-segments/:storeId
 * - Injects a `recommendation` object into each recent event before sending
 */
app.use("/api/ai-segments/:storeId", (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    try {
      if (body && Array.isArray(body.recent)) {
        const recentWithRecommendations = body.recent.map((event) => {
          const recommendation = getRecommendation({
            segment: event.segment,
            urgency: event.urgency,
            risk: event.risk,
            eventType: event.event_type || event.eventType,
            value: Number(event.value || 0),
          });

          return {
            ...event,
            recommendation,
          };
        });

        body = {
          ...body,
          recent: recentWithRecommendations,
        };
      }
    } catch (err) {
      console.error("[recommendationMiddleware] error:", err && err.message ? err.message : err);
    }

    return originalJson(body);
  };

  next();
});


/**
 * recommendationMiddleware
 * - Wraps res.json for /api/ai-segments/:storeId
 * - Injects a `recommendation` object into:
 *   - each item in `recent` (if present), OR
 *   - `first_recent` (if present)
 */
app.use("/api/ai-segments/:storeId", (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    try {
      // Case 1: array of recent events
      if (body && Array.isArray(body.recent)) {
        const recentWithRecommendations = body.recent.map((event) => {
          const recommendation = getRecommendation({
            segment: event.segment,
            urgency: event.urgency,
            risk: event.risk,
            eventType: event.event_type || event.eventType,
            value: Number(event.value || 0),
          });

          return {
            ...event,
            recommendation,
          };
        });

        body = {
          ...body,
          recent: recentWithRecommendations,
        };
      }

      // Case 2: single first_recent object (defensive)
      if (body && body.first_recent && typeof body.first_recent === "object") {
        const e = body.first_recent;
        const recommendation = getRecommendation({
          segment: e.segment,
          urgency: e.urgency,
          risk: e.risk,
          eventType: e.event_type || e.eventType,
          value: Number(e.value || 0),
        });

        body = {
          ...body,
          first_recent: {
            ...e,
            recommendation,
          },
        };
      }
    } catch (err) {
      console.error("[recommendationMiddleware] error:", err && err.message ? err.message : err);
    }

    return originalJson(body);
  };

  next();
});


/**
 * recommendationMiddleware
 * - Wraps res.json for /api/ai-segments/:storeId
 * - Injects a `recommendation` object into:
 *   - each item in `recent` (if present), OR
 *   - `first_recent` (if present)
 */
app.use("/api/ai-segments/:storeId", (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    try {
      // Case 1: array of recent events
      if (body && Array.isArray(body.recent)) {
        const recentWithRecommendations = body.recent.map((event) => {
          const recommendation = getRecommendation({
            segment: event.segment,
            urgency: event.urgency,
            risk: event.risk,
            eventType: event.event_type || event.eventType,
            value: Number(event.value || 0),
          });

          return {
            ...event,
            recommendation,
          };
        });

        body = {
          ...body,
          recent: recentWithRecommendations,
        };
      }

      // Case 2: single first_recent object (defensive)
      if (body && body.first_recent && typeof body.first_recent === "object") {
        const e = body.first_recent;
        const recommendation = getRecommendation({
          segment: e.segment,
          urgency: e.urgency,
          risk: e.risk,
          eventType: e.event_type || e.eventType,
          value: Number(e.value || 0),
        });

        body = {
          ...body,
          first_recent: {
            ...e,
            recommendation,
          },
        };
      }
    } catch (err) {
      console.error("[recommendationMiddleware] error:", err && err.message ? err.message : err);
    }

    return originalJson(body);
  };

  next();
});

app.get("/api/ai-segments/:storeId", async (req, res) => {
  const storeId = req.params.storeId || "unknown-store";
  console.log("[/api/ai-segments] hit for storeId =", storeId);

  try {
    // Summary stats by segment / urgency / risk
    const summaryText = `
      SELECT
        metadata->'aiLabel'->>'segment'   AS segment,
        metadata->'aiLabel'->>'urgency'   AS urgency,
        metadata->'aiLabel'->>'risk'      AS risk,
        COUNT(*)                          AS event_count,
        ROUND(SUM(value)::numeric, 2)     AS total_value
      FROM events
      WHERE store_id = $1
        AND metadata->'aiLabel' IS NOT NULL
      GROUP BY 1,2,3
      ORDER BY event_count DESC
    `;

    const summaryResult = await pool.query(summaryText, [storeId]);

    // Recent labeled events
    const recentText = `
      SELECT
        created_at,
        event_type,
        value,
        metadata->'aiLabel'->>'segment'   AS segment,
        metadata->'aiLabel'->>'urgency'   AS urgency,
        metadata->'aiLabel'->>'risk'      AS risk,
        metadata->>'note'                 AS note
      FROM events
      WHERE store_id = $1
        AND metadata->'aiLabel' IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const recentResult = await pool.query(recentText, [storeId]);

    res.json({
      ok: true,
      storeId,
      segments: summaryResult.rows,
      recent: recentResult.rows,
    });
  } catch (err) {
    console.error("[/api/ai-segments] error:", err && err.message ? err.message : err);
    res.status(500).json({
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
});

// -----------------------------------------------------------------------------
// Start server (Render calls `node server.js`, which requires this file)
// -----------------------------------------------------------------------------

// --- Abando deploy fingerprint (v1) ---
app.get("/api/version", (_req, res) => {
  res.json({
    ok: true,
    service: "cart-agent-api",
    git: process.env.RENDER_GIT_COMMIT || process.env.GIT_SHA || null,
    built_at_utc: new Date().toISOString()
  });
});

// --- Abando embedded check (v1) ---
app.get("/api/embedded-check", (req, res) => {
  const hasBearer = String(req.get("authorization") || "").includes("Bearer ");
  res.json({ ok: true, hasBearer, ts: Date.now() });
});
// --- end fingerprint + embedded-check ---
const PORT = process.env.PORT || 3001;
// === ABANDO_API_GDPR_WEBHOOKS_V1 ======================================
// These endpoints are used by Shopify mandatory privacy webhooks and/or
// automated checks. Must respond quickly.
const crypto = require("crypto");

function verifyShopifyHmac(req) {
  const secret =
    process.env.SHOPIFY_API_SECRET ||
    process.env.SHOPIFY_API_SECRET_KEY ||
    process.env.SHOPIFY_SECRET ||
    "";
  if (!secret) return false;

  const hmacHeader = (req.get("X-Shopify-Hmac-Sha256") || "").trim();
  if (!hmacHeader) return false;

  // Express raw body may not be available in this file; fall back to JSON/string.
  let body = req.body;
  let raw;
  try {
    if (Buffer.isBuffer(body)) raw = body;
    else if (typeof body === "string") raw = Buffer.from(body, "utf8");
    else raw = Buffer.from(JSON.stringify(body ?? {}), "utf8");
  } catch {
    raw = Buffer.from("", "utf8");
  }

  const digest = crypto.createHmac("sha256", secret).update(raw).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

// Health-style responses for GET/HEAD
app.head("/api/webhooks/gdpr", (_req, res) => res.status(200).end());
app.get("/api/webhooks/gdpr", (_req, res) => res.status(200).send("ok"));

// Shopify template-style: GDPR topics often post to /api/webhooks (single endpoint)
app.head("/api/webhooks", (_req, res) => res.status(200).end());
app.get("/api/webhooks", (_req, res) => res.status(200).send("ok"));

// Accept POSTs. For automated checks without HMAC, Shopify often expects 401.
// If your check expects 200, flip the 401 to 200 — but keep it consistent.
app.post("/api/webhooks/gdpr", express.raw({ type: "*/*" }), (req, res) => {
  if (!verifyShopifyHmac(req)) return res.status(401).send("Invalid webhook");
  return res.status(200).send("ok");
});

app.post("/api/webhooks", express.raw({ type: "*/*" }), (req, res) => {
  if (!verifyShopifyHmac(req)) return res.status(401).send("Invalid webhook");
  return res.status(200).send("ok");
});
// === END_ABANDO_API_GDPR_WEBHOOKS_V1 ===================================

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT} (version ai-segments-v1)`);
});

// Simple health check for Render + custom domain
app.get("/health", (req, res) => {
  res.json({
  status: "ok",
  service: "cart-agent-api",
  where: "api/server.js",
  git: process.env.RENDER_GIT_COMMIT || process.env.GIT_SHA || null,
  built_at_utc: new Date().toISOString()
});



});
