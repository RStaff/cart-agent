import express from "express";
import Stripe from "stripe";

const router = express.Router();
const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
if (!stripeSecret) {
  console.warn("[checkoutPublic] STRIPE_SECRET_KEY not set");
}
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2024-06-20" }) : null;

// POST-only JSON endpoint: expects { email?, priceId }.
// NOTE: plan->priceId is enforced by planToPrice middleware upstream.
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const priceId = (body.priceId || "").trim();
    const email = (body.email || "").trim() || undefined;

    if (!priceId) {
      return res.status(400).json({ error: "price_required" });
    }
    if (!stripe) {
      return res.status(500).json({ error: "stripe_not_configured" });
    }

    const mode = "subscription"; // adjust if you sell one-time
    const success_url = process.env.CHECKOUT_SUCCESS_URL || "https://example.com/success";
    const cancel_url  = process.env.CHECKOUT_CANCEL_URL  || "https://example.com/cancel";

    const session = await stripe.checkout.sessions.create({
      mode,
      success_url,
      cancel_url,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
    });

    return res.json({ url: session.url, priceId });
  } catch (err) {
    console.error("[checkoutPublic] error", err);
    return res.status(500).json({ error: "unhandled", detail: String(err?.message || err) });
  }
});

// Do not respond to GET here; _status is handled in index.js
export default router;
