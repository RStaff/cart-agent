import express from "express";
import crypto from "node:crypto";
import Stripe from "stripe";

const router = express.Router();

const secret = process.env.STRIPE_SECRET_KEY || "";
const stripe = secret ? new Stripe(secret, { apiVersion: "2024-06-20" }) : null;

// POST /__public-checkout  (mounted upstream with planToPrice)
router.post("/", async (req, res) => {
  try {
    const b = req.body || {};
    const priceId = (b.priceId || "").trim();
    const email   = (b.email   || "").trim() || undefined;

    if (!priceId) return res.status(400).json({ ok:false, code:"price_required", message:"priceId required" });
    const secret = process.env.STRIPE_SECRET_KEY || "";
    const stripe = secret ? new (Stripe)(secret, { apiVersion: "2024-06-20" }) : null;
    if (!stripe)  return res.status(500).json({ ok:false, code:"stripe_not_configured", message:"Missing STRIPE_SECRET_KEY" });

    const idem = req.headers["idempotency-key"]
      || b.idempotencyKey
      || crypto.createHash("sha256").update(`${priceId}:${email || ""}:${Date.now()}:${Math.random()}`).digest("hex");

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
    const msg = err?.message || String(err);
    return res.status(500).json({ ok:false, code:"unhandled", message: msg });
  }
});
    if (!stripe)  return res.status(500).json({ error: "stripe_not_configured" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",                          // change if one-time
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
      success_url: process.env.CHECKOUT_SUCCESS_URL || "https://example.com/success",
      cancel_url:  process.env.CHECKOUT_CANCEL_URL  || "https://example.com/cancel",
    });

    return res.json({ url: session.url, priceId });
  } catch (err) {
    console.error("[checkoutPublic] error:", err);
    return res.status(500).json({ error: "unhandled", detail: String(err?.message || err) });
  }
});

// No GETs here; /__public-checkout/_status lives in index.js
export default router;
