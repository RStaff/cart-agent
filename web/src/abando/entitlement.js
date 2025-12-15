/**
 * Abando Entitlement (billing gate)
 * BILLING_MODE:
 *   - "stub": always entitled (for dev / review)
 *   - "shopify": TODO: verify active subscription via Shopify billing
 *
 * This is the hook point for "real software" gating.
 */

function getBillingMode() {
  return (process.env.BILLING_MODE || process.env.NEXT_PUBLIC_BILLING_MODE || "stub").toLowerCase();
}

function computeEntitlement(req) {
  const mode = getBillingMode();

  // Hard override (emergency)
  if (process.env.ABANDO_FORCE_ENTITLED === "1") {
    return { entitled: true, mode, reason: "ABANDO_FORCE_ENTITLED=1" };
  }

  // STUB mode: always entitled
  if (mode === "stub") {
    return { entitled: true, mode, reason: "BILLING_MODE=stub" };
  }

  // SHOPIFY mode: placeholder hook
  // You will replace this with: check shop session -> billing subscription -> entitled
  // For now: default false unless explicitly signaled (dev only)
  const header = (req.headers["x-abando-entitled"] || "").toString();
  const entitled = header === "1";

  return {
    entitled,
    mode,
    reason: entitled ? "x-abando-entitled=1 (temporary dev hook)" : "Not entitled (shopify mode placeholder)",
  };
}

function entitlementRoutes(app) {
  app.get("/api/abando/entitlement", (req, res) => {
    const e = computeEntitlement(req);
    res.json({ ok: true, ...e });
  });
}

module.exports = {
  getBillingMode,
  computeEntitlement,
  entitlementRoutes,
};
