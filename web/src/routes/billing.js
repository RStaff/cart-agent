import express from "express";
import { getBillingState, entitlementsForPlan } from "../db/billingState.js";
import { getShopFromReq } from "./_shop_context.js";

const router = express.Router();

/**
 * Source-of-truth billing state.
 * Replace this with DB lookup (Shop table) when ready.
 */


router.get("/status", async (req, res) => {
  const shop = String(req.query.shop || "").trim().toLowerCase();
  if (!shop) return res.status(400).json({ error: "Missing shop" });

  const b = await getBillingState(shop);
  const ent = entitlementsForPlan(b.plan, b.active);

  return res.json({
    shop,
    plan: ent.plan,
    active: ent.active,
    trial: false,
    can_auto_rescue: ent.can_auto_rescue,
    can_send_messages: ent.can_send_messages,
    needs_subscription: ent.needs_subscription,
    source: b.source,
  });
});
export default router;
