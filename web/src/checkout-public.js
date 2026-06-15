import express from "express";
import crypto from "node:crypto";
import { bindPacketPayment, createPacket, normalizeStoreDomain } from "./lib/packetRepository.js";

const defaultCanonicalReturnUrl =
  "https://cart-agent-api.onrender.com/payment-return?packet_id={PACKET_ID}&session_id={CHECKOUT_SESSION_ID}";

function pickCanonicalSuccessUrl() {
  const canonical = process.env.CANONICAL_PAYMENT_RETURN_URL || "";
  const legacy = process.env.CHECKOUT_SUCCESS_URL || "";

  if (canonical) return canonical;
  if (legacy.includes("/payment-return")) return legacy;
  return defaultCanonicalReturnUrl;
}

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

  const canonicalReturnUrl = pickCanonicalSuccessUrl();
  const successUrl = canonicalReturnUrl;
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
      canonicalReturnUrl,
      cancelUrl,
      legacyCheckoutSuccessUrlIgnored: Boolean(
        process.env.CHECKOUT_SUCCESS_URL
        && !process.env.CHECKOUT_SUCCESS_URL.includes("/payment-return"),
      ),
    });
  });

  app.post("/__public-checkout", express.json(), async (req, res) => {
    try {
      const plan = (req.body && req.body.plan) || "starter";
      const storeDomain = normalizeStoreDomain(
        req.body?.store_domain || req.body?.storeDomain || req.body?.store,
      );
      const price = pickPrice(plan);
      if (!price) return res.status(400).json({ ok:false, code:"missing_price", plan });
      if (!storeDomain) return res.status(400).json({ ok:false, code:"missing_store_domain" });
      const reservation_id = `res_${crypto.randomUUID()}`;

      const packet = await createPacket({
        reservation_id,
        store_domain: storeDomain,
        status: "payment_pending",
      });

      const stripe = await getStripe();
      const boundSuccessUrl = successUrl.replace("{PACKET_ID}", encodeURIComponent(packet.packet_id));
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price, quantity: 1 }],
        allow_promotion_codes: true,
        client_reference_id: packet.packet_id,
        metadata: {
          packet_id: packet.packet_id,
          store_domain: storeDomain,
        },
        success_url: boundSuccessUrl,
        cancel_url: cancelUrl,
      });

      await bindPacketPayment({
        packet_id: packet.packet_id,
        store_domain: storeDomain,
        payment_reference: session.id,
        status: "payment_pending",
      });

      return res.json({ ok: true, plan, packetId: packet.packet_id, sessionId: session.id, url: session.url });
    } catch (e) {
      console.error("[public-checkout] error:", e?.message || e);
      return res.status(500).json({ ok:false, code:"server_error", message:String(e?.message||e) });
    }
  });
}

// NOTE: this file is imported dynamically from index.js; no side effects here.
