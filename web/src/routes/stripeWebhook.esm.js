import { bindPacketPayment, getPacket, normalizeStoreDomain } from "../lib/packetRepository.js";

/**
 * Minimal Stripe webhook receiver at POST /stripe/webhook.
 * Packet lifecycle updates require a pre-existing canonical packet.
 */
export function installStripeWebhook(app) {
  // Route-specific raw parser would be ideal, but we keep it simple here.
  app.post("/stripe/webhook", async (req, res) => {
    try {
      // Best-effort read body whether pre-parsed or not
      let payload;
      if (typeof req.body === "string") payload = req.body;
      else if (Buffer.isBuffer(req.body)) payload = req.body.toString("utf8");
      else payload = JSON.stringify(req.body || {});

      const sig = req.headers["stripe-signature"] || "";
      let evtType = "unknown", evtId = "unknown", parsed = {};
      try {
        parsed = JSON.parse(payload || "{}");
        evtType = parsed?.type || parsed?.data?.object?.type || "unknown";
        evtId = parsed?.id || "unknown";
      } catch {}

      console.log("[stripe:webhook] got event",
        { id: evtId, type: evtType, sig: String(sig).slice(0,32) + "…" });

      if (evtType === "checkout.session.completed") {
        const session = parsed?.data?.object || {};
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

      return res.status(200).json({ ok:true });
    } catch (e) {
      console.error("[stripe:webhook] error:", e?.message || e);
      return res.status(200).json({ ok:true }); // still 200 to avoid retries while we iterate
    }
  });
}
