#!/usr/bin/env bash
set -euo pipefail

ROOT="${HOME}/projects/cart-agent"

echo "📂 Using repo root: $ROOT"

# 1) Minimal root entrypoint for Render
cat << 'JS' > "$ROOT/server.js"
"use strict";

// Thin wrapper – Render runs `node server.js`,
// this just boots the real API in ./api/server.js
require("./api/server");
JS

echo "✅ Wrote root server.js entrypoint."

# 2) Clean api/server.js with single logEvent import + routes
mkdir -p "$ROOT/api"

cat << 'JS' > "$ROOT/api/server.js"
"use strict";

const express = require("express");
const cors = require("cors");
const { logEvent } = require("./lib/eventLogger");

const app = express();

// --- AbandoHealthTelemetry middleware ---
// Logs whenever /api/health is hit.
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

// --- CORS + JSON ---
const allowed = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowed ? [allowed] : "*",
    credentials: false,
  })
);
app.use(express.json());

// --- Render health endpoints ---
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
app.get("/healthz", (_req, res) => res.sendStatus(200));

// --- Primary API health for app + telemetry ---
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    service: "abando-backend",
    connected_to: "staffordmedia.ai",
  });
});

// --- Demo generate-copy endpoint (used by playground) ---
app.post("/api/generate-copy", (req, res) => {
  try {
    const { cartId = "demo", items = [] } = req.body || {};
    const total = items.reduce(
      (sum, it) =>
        sum +
        Number(it.unitPrice || 0) * Number(it.quantity || 0),
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

// --- Simple backend test-event endpoint ---
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
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- Unified /api/log-test endpoint for your scripts ---
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
    res.status(500).json({ ok: false, error: "log-test-failed" });
  }
});

// --- IMPORTANT: bind to Render's port (MUST be last) ---
const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
JS

echo "✅ Wrote clean api/server.js."

cd "$ROOT"
git add server.js api/server.js || true
git commit -m "Reset backend entry + clean api/server.js with unified routes" || echo "(no changes)"

echo "✅ reset_backend_server.sh complete."
