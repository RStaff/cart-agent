const nodemailer = require("nodemailer");

function buildAuditResultUrl(store) {
  const clean = String(store || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");

  return `https://staffordmedia.ai/audit-result?store=${encodeURIComponent(clean)}`;
}

function buildEmailBody(payload) {
  const store = payload.store_domain || "your store";
  const score = payload.audit_score || "N/A";
  const issue = payload.top_issue || "Key issue detected";
  const action = payload.recommended_action || "Recommended fix available";

  const auditUrl = buildAuditResultUrl(store);

  return `
We ran a quick audit on your store.

Store: ${store}
Score: ${score}

Top Issue:
${issue}

Why it matters:
This issue is likely blocking conversions or repeat buyers.

👉 View your full audit:
${auditUrl}

We’ll show you the strongest first fix to test:

${action}

— ShopiFixer
`;
}

async function sendRecoveryEmail({ to, payload }) {
  if (!process.env.SMTP_HOST) {
    console.log("EMAIL NOT SENT — SMTP NOT CONFIGURED");
    console.log("PAYLOAD:", payload);
    return { ok: false, reason: "smtp_not_configured" };
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

  const store = payload.store_domain || "your store";

  const mailOptions = {
    from: process.env.FROM_EMAIL || "support@staffordmedia.ai",
    to,
    subject: `We found a revenue leak in ${store}`,
    text: buildEmailBody(payload),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("EMAIL SENT:", info.messageId);
    return { ok: true };
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  sendRecoveryEmail,
};
