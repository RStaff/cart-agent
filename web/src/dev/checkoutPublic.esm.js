import express from "express";
import Stripe from "stripe";
const router = express.Router();

const API_VERSION = "2023-10-16";
const ok = (v) => typeof v === "string" && v.trim().length > 0;

// Health/status JSON
router.get("/_status", (req, res) => {
  res.json({
    ok: true,
    public: String(process.env.ALLOW_PUBLIC_CHECKOUT || ""),
    price: process.env.STRIPE_PRICE_ID ? "set" : "missing",
  });
});

// Create checkout session
router.post("/", async (req, res) => {
  try {
    // 1) Gate
    const allow = String(process.env.ALLOW_PUBLIC_CHECKOUT || "").toLowerCase() === "true";
    if (!allow) return res.status(403).json({ error: "public_checkout_disabled" });

    const key = process.env.STRIPE_SECRET_KEY;
    if (!ok(key)) return res.status(500).json({ error: "stripe_key_missing" });

    const stripe = new Stripe(key, { apiVersion: API_VERSION });

    // 2) Get minimal inputs (with fallback if body parser wasn’t mounted earlier)
    let email = req?.body?.email || req?.query?.email;
    if (!email) {
      try {
        let raw = "";
        await new Promise((r) => { req.on("data", (c) => raw += c); req.on("end", r); });
        if (raw) email = JSON.parse(raw).email;
      } catch {}
    }
    email = email || "customer@example.com";

    const givenPrice = req?.body?.priceId;
    const priceId = (typeof givenPrice === "string" && /^price_[A-Za-z0-9]+$/.test(givenPrice))
      ? givenPrice
      : process.env.STRIPE_PRICE_ID;

    if (!ok(priceId)) return res.status(400).json({ error: "price_id_missing" });

    // 3) Optional lightweight origin check (tighten if you want)
    const appUrl = process.env.APP_URL || "https://abando.ai";
    const origin = req.get("Origin");
    if (origin && appUrl && !origin.includes(new URL(appUrl).hostname)) {
      // Not blocking for now; flip to 403 to enforce.
      // return res.status(403).json({ error: "bad_origin" });
    }

    // 4) Create session
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

export default router;
