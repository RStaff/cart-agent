"use strict";

const express = require("express");
const cors = require("cors");

const { logEvent } = require("./lib/eventLogger");
const { classifyCartEvent } = require("./lib/aiLabeler");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------------
– Health check
// -----------------------------------------------------------------------------
app.get("/healthz", (req, res) => {
  res.json({ ok: true, service: "cart-agent-api" });
});

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

app.get("/api/ai-segments/:storeId", async (req, res) => {
  const storeId = req.params.storeId || "unknown-store";

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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
