import express from "express";
import { getBillingState, entitlementsForPlan } from "../db/billingState.js";
import { getShopFromReq } from "./_shop_context.js";

const router = express.Router();

// --- Replace these with DB-backed implementations ---
function getCurrencyForShop(shop) {
  return "USD";
}

function computeTypicalOrderSize(shop) {
  // TODO: compute from recent orders (Shopify Admin API) or DB snapshots.
  // Deterministic fallback so preview is stable (not random).
  return 72.50;
}

function computeEstimatedRecoverableToday(shop, typicalOrderSize) {
  // TODO: base on cart volumes once webhooks are wired.
  // For now: stable preview estimate (never presented as "real").
  return Math.round((typicalOrderSize * 0.53) * 100) / 100; // 53% of AOV, stable
}

function getRealRescueMetrics(shop) {
  // TODO: pull from Abando events table (abandoned, rescued, revenue)
  // Return null until the pipeline is live.
  return null;
}
// ---------------------------------------------------

router.get("/preview", async (req, res) => {
  const shop = getShopFromReq(req);
  if (!shop) return res.status(400).json({ error: "Missing shop context" });

  const currency = getCurrencyForShop(shop);
  const typical = computeTypicalOrderSize(shop);
  const est = computeEstimatedRecoverableToday(shop, typical);
  const b = await getBillingState(shop);
  const billing = entitlementsForPlan(b.plan, b.active);
return res.json({
    kind: "preview",
    shop,
    currency,
    typical_order_size: typical,
    estimated_recoverable_today: est,
    confidence: "low",
    disclosure: "Preview estimate. Real recovery begins after setup + first rescue.",
    gating: {
      plan: billing.plan,
      can_auto_rescue: billing.can_auto_rescue,
      can_send_messages: billing.can_send_messages,
      needs_subscription: !billing.active,
    },
  });
});

router.get("/real", async (req, res) => {
  const shop = getShopFromReq(req);
  if (!shop) return res.status(400).json({ error: "Missing shop context" });

  const b = await getBillingState(shop);
  const billing = entitlementsForPlan(b.plan, b.active);
const metrics = getRealRescueMetrics(shop);

  if (!metrics) {
    return res.json({
      kind: "real",
      shop,
      ready: false,
      reason: "No webhook events yet",
      next_step: "Trigger a test abandoned cart, then a rescue",
      gating: {
        plan: billing.plan,
        can_auto_rescue: billing.can_auto_rescue,
        can_send_messages: billing.can_send_messages,
        needs_subscription: !billing.active,
      },
    });
  }

  return res.json({
    kind: "real",
    shop,
    ready: true,
    window_days: metrics.window_days,
    currency: metrics.currency,
    abandoned_carts: metrics.abandoned_carts,
    rescues: metrics.rescues,
    recovered_revenue: metrics.recovered_revenue,
    gating: {
      plan: billing.plan,
      can_auto_rescue: billing.can_auto_rescue,
      can_send_messages: billing.can_send_messages,
      needs_subscription: !billing.active,
    },
  });
});

export default router;
