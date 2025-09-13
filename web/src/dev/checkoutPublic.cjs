const express = require("express");
const router = express.Router();
const Stripe = require("stripe");

/**
 * Public checkout when ALLOW_PUBLIC_CHECKOUT === "true"
 * Uses STRIPE_SECRET_KEY and STRIPE_PRICE_ID (or body.priceId if provided).
 */
router.post("/", async (req, res) => {
  try {
    const allow = String(process.env.ALLOW_PUBLIC_CHECKOUT || "").toLowerCase() === "true";
    if (!allow) return res.status(403).json({ error: "public_checkout_disabled" });

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return res.status(500).json({ error: "stripe_key_missing" });

    const stripe = Stripe(key);

    // robust email extraction even if body parser is missing
    let email = (req.body && req.body.email) || (req.query && req.query.email);
    if (!email) {
      try {
        let raw = "";
        await new Promise((resolve) => { req.on("data", c => raw += c); req.on("end", resolve); });
        if (raw) email = JSON.parse(raw).email;
      } catch (_) {}
    }
    email = email || "customer@example.com";

    const bodyPrice = req.body && req.body.priceId;
    const priceId = (typeof bodyPrice === "string" && bodyPrice.startsWith("price_"))
      ? bodyPrice
      : process.env.STRIPE_PRICE_ID;

    if (!priceId) return res.status(400).json({ error: "price_id_missing" });

    const appUrl = process.env.APP_URL || "https://abando.ai";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
    });

    return res.json({ url: session.url, priceId });
  } catch (err) {
    console.error("[public checkout]", err);
    return res.status(500).json({ error: "checkout_failed" });
  }
});

module.exports = router;
