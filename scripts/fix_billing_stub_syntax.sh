#!/usr/bin/env bash
set -euo pipefail

ROUTE_PATH="web/src/routes/billing_create.js"

echo "📦 Rewriting dev billing stub at: $ROUTE_PATH"

cat > "$ROUTE_PATH" << 'FILEEOF'
import express from "express";

const router = express.Router();

// Dev-only billing stub for Abando embedded billing.
// Always responds with ok: true and a fake confirmationUrl,
// so you can exercise the embedded billing UI safely in dev.
router.post("/create", (req, res) => {
  const { planKey } = req.body || {};
  const effectivePlan = planKey || "starter";

  const confirmationUrl =
    `https://abando.dev/billing/confirm-stub?plan=${encodeURIComponent(effectivePlan)}`;

  return res.json({
    ok: true,
    stub: true,
    planKey: effectivePlan,
    confirmationUrl,
    debug: {
      received: planKey ?? null,
    },
  });
});

export default router;
FILEEOF

echo "✅ Fixed dev billing stub at: $ROUTE_PATH"
