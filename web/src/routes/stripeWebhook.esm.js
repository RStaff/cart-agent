import express from "express";
import Stripe from "stripe";
import { bindPacketPayment, getPacket, normalizeStoreDomain } from "../lib/packetRepository.js";

function getStripeClient() {
  const key = process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "";
  if (!key) throw new Error("missing_stripe_secret_key");
  return new Stripe(key, { apiVersion: "2024-09-30.acacia" });
}

/**
 * Canonical Stripe webhook receiver at POST /stripe/webhook.
 * Packet lifecycle updates require:
 * - raw request body
 * - valid Stripe signature
 * - STRIPE_WEBHOOK_SECRET
 * - pre-existing canonical packet
 */
export function installStripeWebhook(app) {
  app.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] || "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    if (!webhookSecret) {
      console.error("[stripe:webhook] missing STRIPE_WEBHOOK_SECRET; refusing lifecycle mutation");
      return res.status(500).json({ ok: false, error: "missing_stripe_webhook_secret" });
    }

    let event;
    try {
      const stripe = getStripeClient();
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (error) {
      console.error("[stripe:webhook] signature verification failed", error?.message || error);
      return res.status(400).send(`Webhook Error: ${error?.message || String(error)}`);
    }

    try {
      const evtType = event?.type || "unknown";
      const evtId = event?.id || "unknown";

      console.log("[stripe:webhook] verified event", { id: evtId, type: evtType });

      if (evtType === "checkout.session.completed") {
        const session = event.data?.object || {};
        const packetId = String(session?.metadata?.packet_id || session?.client_reference_id || "");
        const metadataStoreDomain = normalizeStoreDomain(session?.metadata?.store_domain || "");
        const paymentReference = String(session?.id || evtId || "");

        if (!packetId || !paymentReference) {
          console.warn("[stripe:webhook] checkout.session.completed missing packet binding", {
            eventId: evtId,
            hasPacketId: Boolean(packetId),
            hasPaymentReference: Boolean(paymentReference),
          });
        } else {
          const packet = await getPacket(packetId);
          if (!packet) {
            console.warn("[stripe:webhook] packet missing; skipping payment lifecycle update", {
              eventId: evtId,
              packetId,
            });
          } else if (metadataStoreDomain && metadataStoreDomain !== packet.store_domain) {
            console.warn("[stripe:webhook] packet store mismatch; skipping payment lifecycle update", {
              eventId: evtId,
              packetId,
              metadataStoreDomain,
              packetStoreDomain: packet.store_domain,
            });
          } else {
            await bindPacketPayment({
              packet_id: packet.packet_id,
              store_domain: packet.store_domain,
              payment_reference: paymentReference,
              status: "payment_received",
            });
          }
        }
      }

      return res.status(200).json({ ok: true, received: true });
    } catch (error) {
      console.error("[stripe:webhook] verified event handling error", error?.message || error);
      return res.status(500).json({ ok: false, error: "stripe_webhook_handling_failed" });
    }
  });
}
