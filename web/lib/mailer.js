import nodemailer from "nodemailer";
import * as ResendSDK from "resend";
import sgMail from "@sendgrid/mail";

const PROVIDER = (process.env.EMAIL_PROVIDER || "ethereal").toLowerCase();

/** sendRecoveryEmail({ to, subject, text }) */
export async function sendRecoveryEmail({ to, subject, text }) {
  if (!to) throw new Error("Missing 'to'");
  if (!subject) subject = "Complete your order";
  if (!text) text = "Finish checking out—your items are waiting.";

  if (PROVIDER === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || "Cart Agent <cart@yourdomain.com>";
    if (!apiKey) throw new Error("RESEND_API_KEY missing");
    const resend = new ResendSDK.Resend(apiKey);
    const { data, error } = await resend.emails.send({ from, to, subject, text });
    if (error) throw error;
    return { messageId: data?.id };
  }

  if (PROVIDER === "sendgrid") {
    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.SENDGRID_FROM || "cart@yourdomain.com";
    if (!apiKey) throw new Error("SENDGRID_API_KEY missing");
    sgMail.setApiKey(apiKey);
    const [resp] = await sgMail.send({ to, from, subject, text });
    return { messageId: resp?.headers?.["x-message-id"] || resp?.headers?.["x-message-id"] };
  }

  // Default: Ethereal (dev previews)
  const testAccount = await nodemailer.createTestAccount();
  const transport = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  const info = await transport.sendMail({
    from: `"Cart Agent (DEV)" <noreply@example.com>`,
    to, subject, text,
  });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`📬 Email queued: ${previewUrl || "(no preview url)"}`);
  return { messageId: info.messageId, previewUrl };
}
