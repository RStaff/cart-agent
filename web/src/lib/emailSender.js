import nodemailer from "nodemailer";

let transporterPromise = null;

function env(name) {
  return String(process.env[name] || "").trim();
}

function fromEmail() {
  return env("FROM_EMAIL") || env("DEFAULT_FROM") || "hello@abando.ai";
}

export function resolveFromEmail() {
  return fromEmail();
}

function emailRuntimeState() {
  return {
    SMTP_HOST: Boolean(env("SMTP_HOST")),
    SMTP_PORT: Boolean(env("SMTP_PORT")),
    SMTP_USER: Boolean(env("SMTP_USER")),
    SMTP_PASS: Boolean(env("SMTP_PASS")),
    FROM_EMAIL: Boolean(fromEmail()),
    secure: String(env("SMTP_SECURE") || "").trim() === "true",
    host: env("SMTP_HOST") || null,
    port: Number(env("SMTP_PORT") || 587),
  };
}

function getMissingEmailKeys() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "FROM_EMAIL"];
  return required.filter((name) => {
    if (name === "FROM_EMAIL") {
      return !fromEmail();
    }
    return !env(name);
  });
}

function requireEmailConfig() {
  const missing = getMissingEmailKeys();
  if (missing.length > 0) {
    console.log("[smtp] provider missing", { missing });
    throw new Error(`SMTP NOT CONFIGURED: missing ${missing.join(", ")}`);
  }
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
  requireEmailConfig();

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

  try {
    const transporter = await getTransporter();
    console.log("[email-send] attempting send", {
      to: recipient,
      from: fromEmail(),
      subject: String(subject || "").trim(),
      runtime: emailRuntimeState(),
    });
    try {
      const verifyResult = await transporter.verify();
      console.log("[smtp] connection success", {
        to: recipient,
        verified: verifyResult === true,
      });
    } catch (error) {
      console.log("[smtp] auth failed", {
        to: recipient,
        code: error instanceof Error ? error.code || null : null,
        responseCode: error instanceof Error ? error.responseCode || null : null,
        response: error instanceof Error ? error.response || null : null,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    const info = await transporter.sendMail({
      from: fromEmail(),
      to: recipient,
      subject: String(subject || "").trim(),
      html: String(html || "").trim(),
      text: String(text || "").trim() || undefined,
    });
    const acceptedCount = Array.isArray(info?.accepted) ? info.accepted.length : 0;
    const rejectedCount = Array.isArray(info?.rejected) ? info.rejected.length : 0;
    console.log("[smtp] send success", {
      to: recipient,
      response: info?.response || null,
      accepted: acceptedCount,
      rejected: rejectedCount,
      messageId: info?.messageId || null,
    });

    if (acceptedCount < 1) {
      return {
        success: false,
        error: "smtp_not_accepted",
        provider: "smtp",
        details: info?.response || null,
      };
    }

    return {
      success: true,
      messageId: info?.messageId || null,
      provider: "smtp",
      details: info?.response || null,
    };
  } catch (error) {
    console.log("[email-send] send failed", {
      to: recipient,
      runtime: emailRuntimeState(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        code: error.code || null,
        command: error.command || null,
        response: error.response || null,
        responseCode: error.responseCode || null,
      } : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      provider: "smtp",
      details: error instanceof Error
        ? `code=${error.code || "unknown"} responseCode=${error.responseCode || "unknown"}`
        : String(error),
    };
  }
}
