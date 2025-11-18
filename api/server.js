const { logEvent } = require("./lib/eventLogger");
const express = require('express');
const { logEvent } = require('./lib/eventLogger');
const cors = require('cors');

const app = express();

// AbandoHealthTelemetry middleware
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


// CORS: allow specific origin (Render dashboard: set ALLOWED_ORIGIN to your Vercel URL)
// Fallback to * during bring-up (OK for now; tighten later)
const allowed = process.env.ALLOWED_ORIGIN;
app.use(cors({
  origin: allowed ? [allowed] : '*',
  credentials: false,
}));
app.use(express.json());

// Health endpoints for Render
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));
app.get('/healthz', (_req, res) => res.sendStatus(200));

// Demo generate-copy endpoint
app.post('/api/generate-copy', (req, res) => {
  try {
    const { cartId = 'demo', items = [] } = req.body || {};
    const total = items.reduce((sum, it) => sum + (Number(it.unitPrice || 0) * Number(it.quantity || 0)), 0);
    const subject = `We saved your cart ${cartId} — ${items[0]?.title || 'your items'} are waiting`;
    res.json({
      ok: true,
      subject,
      totalComputed: Number(total.toFixed(2)),
      lines: items.map(i => `${i.quantity} × ${i.title} @ ${i.unitPrice}`),
    });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e) });
  }
});

// IMPORTANT: bind to Render's port
const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});

// Health check for Render (pay.abando.ai) and status scripts.
// Safe to call unauthenticated and used for uptime/telemetry.
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    service: "abando-backend",
    connected_to: "staffordmedia.ai",
  });
});

app.post("/api/test-event", async (req, res) => {
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
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/log-test", async (req, res) => {
  try {
    await logEvent({
      storeId: "debug-store",
      eventType: "debug_log_test",
      eventSource: "api/log-test",
      customerId: null,
      cartId: null,
      checkoutId: null,
      value: null,
      aiLabel: { reason: "manual-test" },
      metadata: { ts: new Date().toISOString() },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("[log-test] failed:", err);
    res.status(500).json({ ok: false, error: "log-test-failed" });
  }
});
