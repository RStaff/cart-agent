/**
 * Public checkout endpoints used by /pricing and curl tests.
 * - GET  /__public-checkout/_status : shows env wiring
 * - POST /__public-checkout         : creates Stripe Checkout session
 */
export default function installPublicCheckout(app) {
  // Lazy-load stripe to avoid startup cost when unused
  async function getStripe() {
    const key = process.env.STRIPE_LIVE_SECRET_KEY
      || process.env.STRIPE_SECRET_KEY
      || "";
    if (!key) throw new Error("Missing STRIPE_LIVE_SECRET_KEY");
    const Stripe = (await import("stripe")).default;
    return new Stripe(key, { apiVersion: "2024-09-30.acacia" });
  }

  function pickPrice(plan) {
    const P = (n) => process.env[n];
    const map = {
      starter: P("PRICE_STARTER") || P("STRIPE_PRICE_STARTER") || P("STRIPE_PRICE_STARTER_LIVE"),
      pro:     P("PRICE_PRO")     || P("STRIPE_PRICE_PRO")     || P("STRIPE_PRICE_PRO_LIVE"),
      scale:   P("PRICE_SCALE")   || P("STRIPE_PRICE_SCALE")   || P("STRIPE_PRICE_SCALE_LIVE"),
    };
    return map[String(plan || "").toLowerCase()] || null;
  }

  const successUrl =
    process.env.CHECKOUT_SUCCESS_URL
    || "https://cart-agent-backend.onrender.com/success?session_id={CHECKOUT_SESSION_ID}";
  const cancelUrl =
    process.env.CHECKOUT_CANCEL_URL
    || "https://cart-agent-backend.onrender.com/cancel";

  app.get("/__public-checkout/_status", (req, res) => {
    res.json({
      ok: true,
      live: Boolean(process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY),
      hasPrices: {
        starter: Boolean(pickPrice("starter")),
        pro: Boolean(pickPrice("pro")),
        scale: Boolean(pickPrice("scale")),
      },
      successUrl,
      cancelUrl,
    });
  });

  app.post("/__public-checkout", express.json(), async (req, res) => {
    try {
      const plan = (req.body && req.body.plan) || "starter";
      const price = pickPrice(plan);
      if (!price) return res.status(400).json({ ok:false, code:"missing_price", plan });

      const stripe = await getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price, quantity: 1 }],
        allow_promotion_codes: true,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return res.json({ ok: true, plan, sessionId: session.id, url: session.url });
    } catch (e) {
      console.error("[public-checkout] error:", e?.message || e);
      return res.status(500).json({ ok:false, code:"server_error", message:String(e?.message||e) });
    }
  });
}

// NOTE: this file is imported dynamically from index.js; no side effects here.
import express from "express";
