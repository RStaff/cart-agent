import nodemailer from "nodemailer";
import { getEmailReadiness } from "../lib/emailSender.js";

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

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || "support@staffordmedia.ai",
        to: email,
        subject,
        text: body
      });

      return res.status(200).json({
        ok: true,
        status: "OFFER_SENT",
        to: email,
        provider: "smtp",
        messageId: info.messageId || null,
        accepted: info.accepted || [],
        rejected: info.rejected || []
      });

    } catch (err) {
      console.error("[send-offer] error:", err);
      return res.status(500).json({
        ok: false,
        error: "offer_send_failed",
        detail: err instanceof Error ? err.message : String(err)
      });
    }
  });
}
