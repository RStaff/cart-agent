#!/usr/bin/env bash
set -euo pipefail

ROUTE_PATH="web/src/routes/billing_create.js"

echo "📦 Writing billing switcher (stub <-> real) to: $ROUTE_PATH"

cat > "$ROUTE_PATH" << 'FILEEOF'
import express from "express";

const router = express.Router();

// Mode: "stub" (default for local dev) or "real" (Shopify billing via routes/billing.js)
const mode = process.env.SHOPIFY_BILLING_MODE || "stub";

if (mode === "real") {
  console.log("[billing] Using REAL Shopify billing for /billing/*");

  // Lazy-load so we don't require Shopify deps when running in stub mode.
  const { billingRouter } = await import("./billing.js");

  // Delegate everything under /billing/* to the existing billing router.
  router.use("/", billingRouter);
} else {
  console.log("[billing] Using DEV STUB billing for /billing/*");

  // Dev-only billing stub for Abando embedded billing.
  // Always responds with ok: true and a fake confirmationUrl,
  // so you can exercise the embedded billing UI safely in dev.
  router.post("/create", (req, res) => {
    const { planKey } = req.body || {};
    const effectivePlan = planKey || "starter";

    const confirmationUrl =
      \`https://abando.dev/billing/confirm-stub?plan=\${encodeURIComponent(effectivePlan)}\`;

    return res.json({
      ok: true,
      stub: true,
      planKey: effectivePlan,
      confirmationUrl,
      debug: {
        received: planKey ?? null,
        mode: "stub",
      },
    });
  });
}

export default router;
FILEEOF

echo "✅ Billing switcher written."
