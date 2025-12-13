#!/usr/bin/env bash
set -euo pipefail

ROUTE_PATH="web/src/routes/billing_create.js"

echo "📦 Rewriting billing switcher at: $ROUTE_PATH"

cat > "$ROUTE_PATH" << 'FILEEOF'
import express from "express";

const router = express.Router();

// Billing mode:
//  - "stub"   → use internal fake confirmationUrl (safe in dev)
//  - "shopify" → placeholder for real Shopify billing (to be wired)
const BILLING_MODE = process.env.ABANDO_BILLING_MODE || "stub";

// --- STUB IMPLEMENTATION (CURRENTLY ACTIVE) -------------------
async function handleStubBilling(req, res) {
  const { planKey } = req.body || {};
  const effectivePlan = planKey || "starter";

  const confirmationUrl =
    `https://abando.dev/billing/confirm-stub?plan=${encodeURIComponent(effectivePlan)}`;

  return res.json({
    ok: true,
    mode: "stub",
    stub: true,
    planKey: effectivePlan,
    confirmationUrl,
    debug: {
      received: planKey ?? null,
    },
  });
}

// --- REAL SHOPIFY BILLING PLACEHOLDER -------------------------
// NOTE: This is intentionally a stub for now so we don't crash
// when BILLING_MODE is switched to "shopify". We'll wire the
// real appSubscriptionCreate logic here next.
async function handleRealShopifyBilling(_req, res) {
  return res.status(501).json({
    ok: false,
    mode: "shopify",
    error: "Real Shopify billing not implemented yet. (Placeholder handler)",
  });
}

// --- MAIN ROUTE -----------------------------------------------
router.post("/create", async (req, res) => {
  try {
    if (BILLING_MODE === "shopify") {
      return await handleRealShopifyBilling(req, res);
    }

    // Default: stub mode
    return await handleStubBilling(req, res);
  } catch (err) {
    console.error("[billing] /billing/create unexpected error", err);
    return res.status(500).json({
      ok: false,
      error: "Billing create failed unexpectedly.",
    });
  }
});

export default router;
FILEEOF

echo "✅ Fixed billing switcher at: $ROUTE_PATH"
