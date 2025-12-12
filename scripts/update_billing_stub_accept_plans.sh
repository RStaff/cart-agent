#!/usr/bin/env bash
set -euo pipefail

ROUTE_PATH="web/src/routes/billing_create.js"

echo "📦 Writing improved dev billing stub to: $ROUTE_PATH"

cat << 'FILEEOF' > "$ROUTE_PATH"
import express from "express";

const router = express.Router();

// Dev-only billing stub so you can exercise the UI
// without talking to real Shopify billing.
const VALID_PLANS = ["starter", "growth", "scale"];

router.post("/create", (req, res) => {
  const { planKey } = req.body || {};

  if (!planKey || !VALID_PLANS.includes(planKey)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid planKey",
      debug: {
        received: planKey,
        validPlans: VALID_PLANS,
      },
    });
  }

  const confirmationUrl =
    `https://abando.dev/billing/confirm-stub?plan=${encodeURIComponent(planKey)}`;

  return res.json({
    ok: true,
    stub: true,
    planKey,
    confirmationUrl,
  });
});

export default router;
FILEEOF

echo "✅ Dev billing stub updated at: $ROUTE_PATH"
