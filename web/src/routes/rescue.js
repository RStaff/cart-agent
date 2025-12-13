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
  const shop = String(req.query.shop || "").trim() || "unknown";

  // Shared dev-store lives on globalThis so both index.js simulators and the router can see it.
  const g = globalThis;
  if (!g.__abandoDevStore) g.__abandoDevStore = { byShop: new Map() };
  if (!g.__abandoDevStore.byShop) g.__abandoDevStore.byShop = new Map();

  const byShop = g.__abandoDevStore.byShop;

  const getShopStore = (s) => {
    if (!byShop.has(s)) {
      byShop.set(s, { events: [], recoveredUsd: 0, lastAbandonedAt: null, lastRescueAt: null });
    }
    return byShop.get(s);
  };

  const store = byShop.get(shop) || getShopStore(shop);

  const hasEvents = !!(store?.events?.length);
  const recoveredUsd = Number(store?.recoveredUsd || 0);

  return res.json({
    kind: "real",
    shop,
    ready: hasEvents,
    reason: hasEvents ? "Simulated events present" : "No webhook events yet",
    recovered_usd_total: recoveredUsd,
    last_abandoned_at: store?.lastAbandonedAt || null,
    last_rescue_at: store?.lastRescueAt || null,
    next_step: hasEvents ? "Wire real webhooks + DB next" : "Trigger a test abandoned cart, then a rescue",
    gating: {
      plan: "starter",
      can_auto_rescue: false,
      can_send_messages: true,
      needs_subscription: false,
    },
  });
});

export default router;
