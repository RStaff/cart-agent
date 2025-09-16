/**
 * Minimal Stripe webhook receiver at POST /stripe/webhook
 * - Returns 200 quickly so Stripe marks events delivered
 * - Logs event type & id
 * - Signature verification is recommended in production,
 *   but this minimal version focuses on a working endpoint first.
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
      let evtType = "unknown", evtId = "unknown";
      try {
        const j = JSON.parse(payload || "{}");
        evtType = j?.type || j?.data?.object?.type || "unknown";
        evtId = j?.id || "unknown";
      } catch {}

      console.log("[stripe:webhook] got event",
        { id: evtId, type: evtType, sig: String(sig).slice(0,32) + "…" });

      // TODO: handle specific events, e.g. checkout.session.completed
      // For now just acknowledge so Stripe stops retrying
      return res.status(200).json({ ok:true });
    } catch (e) {
      console.error("[stripe:webhook] error:", e?.message || e);
      return res.status(200).json({ ok:true }); // still 200 to avoid retries while we iterate
    }
  });
}
