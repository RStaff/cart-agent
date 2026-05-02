import nodemailer from "nodemailer";

export function getAbandoEmailReadiness() {
  const missing = [];
  if (!process.env.SMTP_HOST) missing.push("SMTP_HOST");
  if (!process.env.SMTP_PORT) missing.push("SMTP_PORT");
  if (!process.env.SMTP_USER) missing.push("SMTP_USER");
  if (!process.env.SMTP_PASS) missing.push("SMTP_PASS");

  return {
    ready: missing.length === 0,
    missing,
    sender: process.env.FROM_EMAIL || "hello@abando.ai",
  };
}

export async function sendAbandoRecoveryEmail({ to, shop }) {
  const readiness = getAbandoEmailReadiness();

  if (!readiness.ready) {
    return { success: false, error: "smtp_not_configured" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const subject = `You left something behind at ${shop}`;

  const text = `You started checkout at ${shop} but didn’t finish.

Return here to complete your purchase:
https://${shop}/checkout

— Abando`;

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || "hello@abando.ai",
      to,
      subject,
      text,
    });

    return { success: true, messageId: info.messageId || null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
