import {
  bindPacketPayment,
  createPacket,
  getPacket,
  listPackets,
  normalizeStoreDomain,
  updatePacketLifecycle,
} from "../lib/packetRepository.js";

function sendPacketNotFound(res) {
  return res.status(404).json({ ok: false, error: "packet_not_found" });
}

function resolveMerchantWorkspaceOrigin() {
  const raw =
    process.env.ABANDO_PUBLIC_APP_ORIGIN ||
    process.env.NEXT_PUBLIC_ABANDO_PUBLIC_APP_ORIGIN ||
    process.env.APP_URL ||
    "http://127.0.0.1:3001";

  try {
    return new URL(String(raw)).origin;
  } catch {
    return String(raw).replace(/\/+$/, "");
  }
}

export function installPacketAuthority(app) {
  app.post("/api/packets/prepare", async (req, res) => {
    try {
      const packet = await createPacket({
        store_domain: req.body?.store_domain || req.body?.storeDomain || req.body?.store,
        payment_reference: req.body?.payment_reference || req.body?.paymentReference,
      });

      return res.status(200).json({ ok: true, packet });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/packets/:packetId", async (req, res) => {
    const packet = await getPacket(req.params.packetId);
    if (!packet) return sendPacketNotFound(res);
    return res.status(200).json({ ok: true, packet });
  });

  app.get("/api/operator/packets", async (req, res) => {
    const packets = await listPackets({ store: req.query.store });
    return res.status(200).json({ ok: true, packets });
  });

  app.get("/api/operator/packets/:packetId", async (req, res) => {
    const packet = await getPacket(req.params.packetId);
    if (!packet) return sendPacketNotFound(res);
    return res.status(200).json({ ok: true, packet });
  });

  app.post("/api/packets/:packetId/execution", async (req, res) => {
    const packet = await updatePacketLifecycle(req.params.packetId, {
      status: req.body?.status,
      execution_status: req.body?.execution_status || req.body?.executionStatus,
      proof_status: req.body?.proof_status || req.body?.proofStatus,
      completion_status: req.body?.completion_status || req.body?.completionStatus,
    });

    if (!packet) return sendPacketNotFound(res);
    return res.status(200).json({ ok: true, packet });
  });

  app.get("/payment-return", async (req, res) => {
    try {
      const packetId = String(req.query.packet_id || req.query.packet || "").trim();
      const paymentReference = String(req.query.session_id || req.query.payment_reference || "").trim();
      const storeDomain = normalizeStoreDomain(req.query.store || req.query.store_domain || "");

      const existing = packetId ? await getPacket(packetId) : null;
      const effectiveStore = storeDomain || existing?.store_domain || "";
      const nextStatus = existing?.status === "payment_received" ? existing.status : "payment_pending";

      if (!packetId || !paymentReference || !effectiveStore) {
        return res.status(400).json({
          ok: false,
          error: "missing_payment_return_context",
          required: ["packet_id", "session_id"],
        });
      }

      const packet = await bindPacketPayment({
        packet_id: packetId,
        store_domain: effectiveStore,
        payment_reference: paymentReference,
        status: nextStatus,
      });

      const statusUrl = new URL("/fix-status", resolveMerchantWorkspaceOrigin());
      statusUrl.searchParams.set("packet_id", packet.packet_id);
      statusUrl.searchParams.set("session_id", paymentReference);
      statusUrl.searchParams.set("store", packet.store_domain);
      if (packet.reservation_id) {
        statusUrl.searchParams.set("reservation_id", packet.reservation_id);
      }

      return res.redirect(302, statusUrl.toString());
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: "payment_return_failed",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
