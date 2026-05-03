import { getEmailReadiness, sendRecoveryEmail } from "../lib/emailSender.js";

export function installRecoveryExecution(app) {

  // 1. Email readiness check
  app.get("/api/recovery-actions/email-readiness", (_req, res) => {
    try {
      const readiness = getEmailReadiness();

      return res.json({
        ok: true,
        ready: readiness.ready,
        missing: readiness.missing,
        sender: readiness.sender || null
      });

    } catch (err) {
      console.error("❌ EMAIL READINESS ERROR:", err);
      return res.status(500).json({
        ok: false,
        error: "email_readiness_failed"
      });
    }
  });

  // 2. Send recovery message
  app.post("/api/recovery-actions/send-live-test", async (req, res) => {
    try {
      const { shop, email } = req.body;

      if (!shop || !email) {
        return res.status(400).json({
          ok: false,
          error: "missing_shop_or_email"
        });
      }

      const readiness = getEmailReadiness();

      if (!readiness.ready) {
        return res.json({
          ok: true,
          status: "not_configured",
          missing: readiness.missing
        });
      }

      const result = await sendRecoveryEmail({
        to: email,
        subject: "You left something behind 👀",
        html: `<p>We noticed you started checkout but didn’t finish.</p>
               <p><a href="https://example.com">Return to your cart</a></p>`
      });

      return res.json({
        ok: true,
        status: "sent",
        result
      });

    } catch (err) {
      console.error("❌ SEND RECOVERY ERROR:", err);
      return res.status(500).json({
        ok: false,
        error: "recovery_send_failed"
      });
    }
  });
}
