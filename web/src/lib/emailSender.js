import nodemailer from "nodemailer";

let transporterPromise = null;

function env(name) {
  return String(process.env[name] || "").trim();
}

function fromEmail() {
  return env("FROM_EMAIL") || env("DEFAULT_FROM") || env("SMTP_FROM");
}

export function isEmailSenderConfigured() {
  return Boolean(
    env("SMTP_HOST") &&
    env("SMTP_PORT") &&
    env("SMTP_USER") &&
    env("SMTP_PASS") &&
    fromEmail()
  );
}

async function getTransporter() {
  if (!isEmailSenderConfigured()) {
    return null;
  }

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: env("SMTP_HOST"),
        port: Number(env("SMTP_PORT") || 587),
        secure: String(env("SMTP_SECURE") || "").trim() === "true",
        auth: {
          user: env("SMTP_USER"),
          pass: env("SMTP_PASS"),
        },
      }),
    );
  }

  return transporterPromise;
}

export async function sendRecoveryEmail({ to, subject, html, text = "" }) {
  const recipient = String(to || "").trim();
  if (!recipient) {
    return { success: false, error: "missing_email_recipient" };
  }

  const transporter = await getTransporter();
  if (!transporter) {
    return { success: false, error: "email_not_configured" };
  }

  try {
    const info = await transporter.sendMail({
      from: fromEmail(),
      to: recipient,
      subject: String(subject || "").trim(),
      html: String(html || "").trim(),
      text: String(text || "").trim() || undefined,
    });

    return {
      success: true,
      messageId: info?.messageId || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
