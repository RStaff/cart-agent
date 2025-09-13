import { Router } from "express";
import Stripe from "stripe";

export const router = Router();

/**
 * DEV-ONLY bypass for Stripe checkout.
 * Active only if (a) DEV_AUTH_TOKEN is set AND (b) Authorization: Bearer <token> matches.
 * Falls through to the real handler otherwise.
 */
router.post("/api/billing/checkout", async (req, res, next) => {
  try {
    if (!process.env.DEV_AUTH_TOKEN) return next();

    const auth = req.headers.authorization || "";
    const ok =
      auth.startsWith("Bearer ") &&
      auth.slice(7).trim() === process.env.DEV_AUTH_TOKEN;
    if (!ok) return next();

    const email =
      (req.body && req.body.email) ||
      req.query?.email ||
      "dev@example.com";

    // Allow dynamic price; fallback to env.
    const bodyPrice = req.body?.priceId || req.query?.price_id;
    const envPrice = process.env.STRIPE_PRICE_ID;
    const priceId = (typeof bodyPrice === "string" && bodyPrice.startsWith("price_"))
      ? bodyPrice
      : envPrice;

    if (!process.env.STRIPE_SECRET_KEY || !priceId) {
      return res.status(500).json({ error: "stripe_env_missing_or_bad_price" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const appUrl = process.env.APP_URL || "https://example.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: appUrl + "/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: appUrl + "/billing/cancel",
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return res.json({ url: session.url, devBypass: true, priceId });
  } catch (e) {
    console.error("[dev checkout bypass]", e);
    return res.status(500).json({ error: "dev_checkout_failed" });
  }
});

export default router;
