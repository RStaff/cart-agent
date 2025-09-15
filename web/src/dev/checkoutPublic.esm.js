import express from "express";
import Stripe from "stripe";
import crypto from "node:crypto";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const priceId = (body.priceId || "").trim();
    const email   = (body.email   || "").trim() || undefined;

    if (!priceId) {
      return res.status(400).json({ ok:false, code:"price_required", message:"priceId required" });
    }

    const secret = (process.env.STRIPE_SECRET_KEY || "").trim();
    if (!secret) {
      return res.status(500).json({ ok:false, code:"stripe_not_configured", message:"Missing STRIPE_SECRET_KEY" });
    }

    const stripe = new Stripe(secret, { apiVersion: "2024-06-20" });

    // allow client to supply one, otherwise make a stable-ish hash
    const idem = req.headers["idempotency-key"]
      || body.idempotencyKey
      || crypto.createHash("sha256")
           .update(`${priceId}:${email || ""}:${Date.now()}:${Math.random()}`)
           .digest("hex");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
      success_url: process.env.CHECKOUT_SUCCESS_URL || "https://example.com/success",
      cancel_url:  process.env.CHECKOUT_CANCEL_URL  || "https://example.com/cancel",
    }, { idempotencyKey: idem });

    return res.json({ ok:true, url: session.url, priceId, idempotencyKey: idem });
  } catch (err) {
    const message = err?.message || String(err);
    return res.status(500).json({ ok:false, code:"unhandled", message });
  }
});

export default router;
