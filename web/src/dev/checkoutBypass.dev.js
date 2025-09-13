import { Router } from "express";
import Stripe from "stripe";

export const router = Router();

/**
 * Checkout handler that works in two modes:
 *  1) DEV BYPASS: if DEV_AUTH_TOKEN matches Authorization: Bearer <token>
 *  2) PUBLIC CHECKOUT: if ALLOW_PUBLIC_CHECKOUT === "true"
 * If neither applies, fallthrough to the real (auth) handler.
 */
router.post("/api/billing/checkout", async (req, res, next) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceFromBody = req.body?.priceId;
  const priceFromEnv = process.env.STRIPE_PRICE_ID;
  const priceId = (typeof priceFromBody === "string" && priceFromBody.startsWith("price_"))
    ? priceFromBody
    : priceFromEnv;

  if (!stripeKey || !priceId) return next(); // let real handler decide (usually 500/401)

  const allowPublic = String(process.env.ALLOW_PUBLIC_CHECKOUT || "").toLowerCase() === "true";
  const devToken = (process.env.DEV_AUTH_TOKEN || "").trim();
  const auth = req.headers.authorization || "";
  const devOK = devToken && auth.startsWith("Bearer ") && auth.slice(7).trim() === devToken;

  if (!allowPublic && !devOK) return next();

  try {
    const stripe = new Stripe(stripeKey);
    const appUrl = process.env.APP_URL || "https://www.abando.ai";
    const email = req.body?.email || req.query?.email || "customer@example.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: ,
      cancel_url: ,
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return res.json({
      url: session.url,
      priceId,
      publicCheckout: allowPublic,
      devBypass: Boolean(devOK),
    });
  } catch (err) {
    console.error("[checkout public/dev]", err);
    return res.status(500).json({ error: "checkout_failed" });
  }
});

export default router;
