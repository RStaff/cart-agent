const { logEvent } = require("./lib/eventLogger");
const express = require("express");
const cors = require("cors");

const app = express();

// -----------------------------------------------------------------------------
// AbandoHealthTelemetry middleware
// Logs when /api/health is hit so you can see backend uptime in Postgres.
// -----------------------------------------------------------------------------
app.use(async (req, res, next) => {
  if (req.path === "/api/health") {
    try {
      await logEvent({
        storeId: "abando-system",
        eventType: "health_check",
        eventSource: "backend",
        metadata: { path: req.path, ts: new Date().toISOString() },
      });
    } catch (e) {
      console.error("[health_check logger] error:", e.message);
    }
  }
  next();
});

// -----------------------------------------------------------------------------
// CORS + JSON
// -----------------------------------------------------------------------------
const allowed = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowed ? [allowed] : "*",
    credentials: false,
  })
);
app.use(express.json());

// -----------------------------------------------------------------------------
// Basic health endpoints for Render
// -----------------------------------------------------------------------------
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
app.get("/healthz", (_req, res) => res.sendStatus(200));

// -----------------------------------------------------------------------------
// Demo generate-copy endpoint (kept from earlier template)
// -----------------------------------------------------------------------------
app.post("/api/generate-copy", (req, res) => {
  try {
    const { cartId = "demo", items = [] } = req.body || {};
    const total = items.reduce(
      (sum, it) =>
        sum + Number(it.unitPrice || 0) * Number(it.quantity || 0),
      0
    );
    const subject = `We saved your cart ${cartId} — ${
      items[0]?.title || "your items"
    } are waiting`;
    res.json({
      ok: true,
      subject,
      totalComputed: Number(total.toFixed(2)),
      lines: items.map(
        (i) => `${i.quantity} × ${i.title} @ ${i.unitPrice}`
      ),
    });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e) });
  }
});

// -----------------------------------------------------------------------------
// JSON health for pay.abando.ai (used by your scripts)
// -----------------------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    service: "abando-backend",
    connected_to: "staffordmedia.ai",
  });
});

// -----------------------------------------------------------------------------
// ⭐ Unified cart-event ingress for real product events
// This is what Shopify / your app will POST to.
// -----------------------------------------------------------------------------
app.post("/api/cart-event", async (req, res) => {
  try {
    const body = req.body || {};

    const {
      storeId = "unknown-store",
      eventType = "cart_event",
      eventSource = "cart-event-api",
      customerId = null,
      cartId = null,
      checkoutId = null,
      value = null,
      aiLabel = null,
      metadata = {},
    } = body;

    await logEvent({
      storeId,
      eventType,
      eventSource,
      customerId,
      cartId,
      checkoutId,
      value,
      aiLabel,
      metadata,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("[/api/cart-event] error:", err);
    res
      .status(500)
      .json({ ok: false, error: String(err.message || err) });
  }
});

// -----------------------------------------------------------------------------
// Optional: keep /api/log-test so your existing test_unified_events.sh works
// -----------------------------------------------------------------------------
app.post("/api/log-test", async (_req, res) => {
  try {
    await logEvent({
      storeId: "test-store-log",
      eventType: "log_test",
      eventSource: "api/log-test",
      metadata: {
        note: "log-test route hit",
        ts: new Date().toISOString(),
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[log-test] failed:", err);
    res
      .status(500)
      .json({ ok: false, error: "log-test-failed" });
  }
});

// -----------------------------------------------------------------------------
// (Optional) simple /api/test-event for manual hits
// -----------------------------------------------------------------------------
app.post("/api/test-event", async (_req, res) => {
  try {
    await logEvent({
      storeId: "test-store",
      eventType: "test_event",
      eventSource: "backend",
      metadata: { note: "manual test hit" },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("[/api/test-event] error:", e.message);
    res.status(500).json({ ok: false, error: "test-event-failed" });
  }
});

// -----------------------------------------------------------------------------
// IMPORTANT: bind to Render's port (must be last)
// -----------------------------------------------------------------------------
const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("API listening on http://0.0.0.0:" + PORT);
});

