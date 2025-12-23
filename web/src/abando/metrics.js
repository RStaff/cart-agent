/**
 * Abando Metrics
 * This is the value-signal endpoint your frontend /status page will consume.
 * For now it returns env-based placeholders + entitlement info.
 * Later: wire to DB (Prisma models) and real recovered revenue.
 */

const { computeEntitlement, getBillingMode } = require("./entitlement");

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v, fallback = "") {
  const s = (v ?? "").toString().trim();
  return s.length ? s : fallback;
}

function metricsRoutes(app) {
  app.get("/api/abando/metrics", (req, res) => {
    const e = computeEntitlement(req);

    // Placeholder values (wire to real data next)
    const recoveredRevenue = str(process.env.ABANDO_DEMO_RECOVERED_REVENUE, "0");
    const recoveredOrders  = num(process.env.ABANDO_DEMO_RECOVERED_ORDERS, 0);
    const cartsDetected    = num(process.env.ABANDO_DEMO_CARTS_DETECTED, 0);

    res.json({
      ok: true,
      ts: new Date().toISOString(),
      billingMode: getBillingMode(),
      entitled: e.entitled,
      entitlementReason: e.reason,

      // Value signals (placeholder)
      recoveredRevenue,
      recoveredOrders,
      cartsDetected,

      // Helpful env hints
      app: "cart-agent",
      shop: str(process.env.SHOPIFY_SHOP, "UNKNOWN"),
    });
  });
}

module.exports = { metricsRoutes };
