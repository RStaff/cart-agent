import express from "express";
import Stripe from "stripe";
export const billingPublicRouter = express.Router();

billingPublicRouter.post("/checkout", async (req, res) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const priceStarter = process.env.STRIPE_PRICE_STARTER;
    const pricePro = process.env.STRIPE_PRICE_PRO;
    if (!stripeKey) return res.status(500).json({ error: "stripe_not_configured" });

    const plan = (req.body && req.body.plan) || "starter";
    const price = plan === "pro" ? pricePro : priceStarter;
    if (!price) return res.status(500).json({ error: "price_not_configured" });

    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: "https://abando.ai/onboarding/",
      cancel_url: "https://abando.ai/pricing/",
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error("[billing_public] error", e);
    res.status(500).json({ error: "checkout_failed" });
  }
});
