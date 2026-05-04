import { getEmailReadiness, sendRecoveryEmail } from "../lib/emailSender.js";

export function installSendOffer(app) {
  app.post("/api/shopifixer/send-offer", async (req, res) => {
    try {
      const { email, subject, body } = req.body || {};

      if (!email || !subject || !body) {
        return res.status(400).json({
          ok: false,
          error: "missing_email_subject_or_body"
        });
      }

      const readiness = getEmailReadiness();

      if (!readiness.ready) {
        return res.status(400).json({
          ok: false,
          error: "email_not_configured",
          missing: readiness.missing
        });
      }

      const result = await sendRecoveryEmail({
        to: email,
        subject,
        text: body
      });

      return res.status(200).json({
        ok: true,
        status: "OFFER_SENT",
        to: email,
        provider: "smtp",
        result
      });

    } catch (err) {
      console.error("[send-offer] error:", err);
      return res.status(500).json({
        ok: false,
        error: "offer_send_failed"
      });
    }
  });
}
