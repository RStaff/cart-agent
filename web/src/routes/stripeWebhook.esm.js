import express from "express";
import Stripe from "stripe";
import { bindPacketPayment, getPacket, normalizeStoreDomain } from "../lib/packetRepository.js";
import { recordStripePaymentPropagation } from "../../../staffordos/revenue/revenue_agent_v1.mjs";
import { rebuildShopifixerFulfillmentTruth } from "../../../staffordos/fulfillment/build_shopifixer_fulfillment_truth_v1.mjs";
import { appendProofEvent } from "../../../staffordos/execution/proof_authority_v1.mjs";

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
            if (!packet?.reservation_id) {
              console.warn("[stripe:webhook] packet missing reservation_id; refusing lifecycle update", {
                packet_id: packet.packet_id,
                store_domain: packet.store_domain,
                stripe_event_id: evtId,
              });
              return res.status(409).json({ ok: false, error: "missing_reservation_id" });
            }

            await appendProofEvent({
              reservation_id: packet.reservation_id,
              event_type: "reservation_confirmed",
              authority: "payment.stripe_webhook_receipt",
              packet_id: packet.packet_id,
              status: "verified",
              stripe_event_id: evtId,
              payment_reference: paymentReference,
              proof: {
                stripe_signature_verified: true,
                stripe_event_type: evtType,
                packet_lookup: true,
                store_domain_match: true,
                packet_status_before: packet.status,
              },
            });

            await bindPacketPayment({
              packet_id: packet.packet_id,
              store_domain: packet.store_domain,
              payment_reference: paymentReference,
              status: "payment_received",
            });

            await appendProofEvent({
              reservation_id: packet.reservation_id,
              event_type: "payment_received",
              authority: "payment.stripe_webhook_receipt",
              packet_id: packet.packet_id,
              status: "payment_received",
              stripe_event_id: evtId,
              payment_reference: paymentReference,
              proof: {
                stripe_signature_verified: true,
                stripe_event_type: evtType,
                packet_lookup: true,
                store_domain_match: true,
                packet_status_after: "payment_received",
              },
            });

            try {
              const propagation = recordStripePaymentPropagation({
                packet,
                session,
                eventId: evtId,
                eventType: evtType,
              });

              if (!propagation?.updated_client) {
                console.warn("[stripe:webhook] verified payment recorded on packet, but no matching client registry entry was found", {
                  eventId: evtId,
                  packetId,
                  merchantShop: packet.store_domain,
                });
              } else {
                try {
                  const fulfillmentTruth = rebuildShopifixerFulfillmentTruth();
                  const fulfillmentCount = Array.isArray(fulfillmentTruth?.items) ? fulfillmentTruth.items.length : 0;

                  if (!fulfillmentCount) {
                    console.warn("[stripe:webhook] payment propagated but fulfillment truth rebuild returned no items", {
                      eventId: evtId,
                      packetId,
                      merchantShop: packet.store_domain,
                    });
                  }
                } catch (fulfillmentError) {
                  console.error("[stripe:webhook] fulfillment truth rebuild failed after payment propagation", fulfillmentError?.message || fulfillmentError);
                }
              }
            } catch (propagationError) {
              console.error("[stripe:webhook] verified payment propagation failed after packet update", propagationError?.message || propagationError);
            }
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
