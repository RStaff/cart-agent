#!/usr/bin/env bash
set -euo pipefail

ROUTE_PATH="web/src/routes/billing_create.js"

echo "📦 Replacing $ROUTE_PATH with dev-safe stub billing route..."

cat << 'FILEEOF' > "$ROUTE_PATH"
import express from "express";

const router = express.Router();

// Dev-only stub plan prices (in cents)
const PLAN_PRICES = {
  starter: 4900,
  growth: 9900,
  scale: 19900,
};

router.post("/create", async (req, res) => {
  try {
    const body = req.body || {};
    const planKey = body.planKey;

    if (!planKey || !PLAN_PRICES[planKey]) {
      console.error("[billing_stub] Invalid planKey:", planKey);
      return res.status(400).json({
        ok: false,
        error: "Invalid planKey",
      });
    }

    const amountCents = PLAN_PRICES[planKey];

    // For now, return a fake confirmation URL so the
    // front end + tests have something to follow.
    const baseUrl = process.env.SHOPIFY_APP_URL || "https://example.com";
    const fakeUrl = `${baseUrl}/billing/confirm/dev-stub?plan=${encodeURIComponent(
      planKey
    )}&cents=${amountCents}`;

    console.log(
      "[billing_stub] Returning fake confirmation URL for plan:",
      planKey,
      "amountCents:",
      amountCents
    );

    return res.status(200).json({
      ok: true,
      mode: "dev-stub",
      planKey,
      amountCents,
      confirmationUrl: fakeUrl,
    });
  } catch (err) {
    console.error("[billing_stub] Unexpected error:", err);
    return res.status(500).json({
      ok: false,
      error: "Billing stub failed unexpectedly.",
    });
  }
});

export default router;
FILEEOF

echo "✅ Stub billing route written to: $ROUTE_PATH"
