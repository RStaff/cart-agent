import nodemailer from "nodemailer";

function buildAuditResultUrl(store) {
  const clean = String(store || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");

  return `https://staffordmedia.ai/audit-result?store=${encodeURIComponent(clean)}`;
}

function assertAuditPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.store_domain !== "string" || payload.store_domain.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.audit_score !== "number" || Number.isNaN(payload.audit_score)) {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.estimated_revenue_loss !== "string" || payload.estimated_revenue_loss.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.top_issue !== "string" || payload.top_issue.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.recommended_action !== "string" || payload.recommended_action.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (!Array.isArray(payload.issues) || payload.issues.some((issue) => typeof issue !== "string" || issue.trim() === "")) {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.generated_at !== "string" || payload.generated_at.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  return payload;
}

function buildEmailBody(payload) {
  const auditPayload = assertAuditPayload(payload);
  const auditUrl = buildAuditResultUrl(auditPayload.store_domain);

  return [
    `Your ShopiFixer audit for ${auditPayload.store_domain}`,
    "",
    `Audit score: ${auditPayload.audit_score}`,
    `Estimated revenue loss: ${auditPayload.estimated_revenue_loss}`,
    `Top issue: ${auditPayload.top_issue}`,
    `Recommended action: ${auditPayload.recommended_action}`,
    "",
    "Issues:",
    ...auditPayload.issues.map((issue) => `- ${issue}`),
    "",
    `View the same audit result: ${auditUrl}`,
    "",
    `Generated at: ${auditPayload.generated_at}`,
    "",
    "— ShopiFixer",
  ].join("\n");
}

function getEmailReadiness() {
  const missing = [];

  if (!process.env.SMTP_HOST) missing.push("SMTP_HOST");
  if (!process.env.SMTP_PORT) missing.push("SMTP_PORT");
  if (!process.env.SMTP_USER) missing.push("SMTP_USER");
  if (!process.env.SMTP_PASS) missing.push("SMTP_PASS");

  return {
    ready: missing.length === 0,
    missing,
    sender: process.env.FROM_EMAIL || "support@staffordmedia.ai",
  };
}

async function sendRecoveryEmail({ to, payload }) {
  const auditPayload = assertAuditPayload(payload);
  const readiness = getEmailReadiness();

  if (!readiness.ready) {
    console.log("EMAIL NOT SENT — SMTP NOT CONFIGURED");
    console.log("PAYLOAD:", auditPayload);
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

  const mailOptions = {
    from: process.env.FROM_EMAIL || "support@staffordmedia.ai",
    to,
    subject: `Your ShopiFixer audit for ${auditPayload.store_domain}`,
    text: buildEmailBody(auditPayload),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("EMAIL SENT:", info.messageId);
    return { success: true, messageId: info.messageId || null };
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export {
  assertAuditPayload,
  buildAuditResultUrl,
  buildEmailBody,
  getEmailReadiness,
  sendRecoveryEmail,
};
