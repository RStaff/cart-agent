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

function buildFixPageUrl(store) {
  const clean = String(store || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");

  return `https://staffordmedia.ai/fix?store=${encodeURIComponent(clean)}`;
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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildWhyThisMatters(payload) {
  const auditPayload = assertAuditPayload(payload);
  const normalized = auditPayload.top_issue.toLowerCase();

  if (normalized.includes("cart recovery")) {
    return "Purchase intent is leaving without a recovery path, so revenue is likely leaking after interest is already created.";
  }

  if (normalized.includes("checkout")) {
    return "Friction is interrupting purchase intent near the decision stage, where buyers should already be closing.";
  }

  return "The clearest friction point is likely suppressing conversion and deserves focused testing first.";
}

function getScoreBand(score) {
  if (score <= 39) return "Critical";
  if (score <= 59) return "Weak";
  if (score <= 79) return "Fair";
  return "Strong";
}

function buildEmailBody(payload) {
  const auditPayload = assertAuditPayload(payload);
  const auditUrl = buildAuditResultUrl(auditPayload.store_domain);
  const fixUrl = buildFixPageUrl(auditPayload.store_domain);
  const whyThisMatters = buildWhyThisMatters(auditPayload);
  const scoreBand = getScoreBand(auditPayload.audit_score);

  return [
    `Your ShopiFixer audit: the clearest issue holding back ${auditPayload.store_domain}`,
    "",
    `The clearest issue holding back ${auditPayload.store_domain} surfaced quickly.`,
    "",
    `Estimated 30-day revenue opportunity: ${auditPayload.estimated_revenue_loss}`,
    `Top issue: ${auditPayload.top_issue}`,
    `Why this matters: ${whyThisMatters}`,
    "",
    `Audit score: ${auditPayload.audit_score}`,
    `Score band: ${scoreBand}`,
    `Recommended action: ${auditPayload.recommended_action}`,
    `Store domain: ${auditPayload.store_domain}`,
    "",
    "Issues surfaced:",
    ...auditPayload.issues.map((issue) => `- ${issue}`),
    "",
    "Why this matters:",
    whyThisMatters,
    "",
    "In the full review you'll see:",
    "- The strongest issue surfaced first",
    "- The recommended next move preserved from the audit",
    "- Storefront proof tied to the same review",
    "",
    `Open the full review: ${auditUrl}`,
    `See what you pay for: ${fixUrl}`,
    "",
    `Generated at: ${auditPayload.generated_at}`,
    "",
    "Official Shopify Partner",
  ].join("\n");
}

function buildEmailHtml(payload) {
  const auditPayload = assertAuditPayload(payload);
  const auditUrl = buildAuditResultUrl(auditPayload.store_domain);
  const fixUrl = buildFixPageUrl(auditPayload.store_domain);
  const whyThisMatters = buildWhyThisMatters(auditPayload);
  const scoreBand = getScoreBand(auditPayload.audit_score);
  const issueItems = auditPayload.issues
    .map(
      (issue) =>
        `<li style="margin:0 0 8px;color:#cbd5e1;line-height:1.6;">${escapeHtml(issue)}</li>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#020617;color:#e2e8f0;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:680px;margin:0 auto;border:1px solid rgba(148,163,184,0.22);border-radius:28px;background:#0f172a;overflow:hidden;">
      <div style="padding:28px 28px 20px;border-bottom:1px solid rgba(148,163,184,0.16);">
        <p style="margin:0 0 12px;color:#facc15;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">ShopiFixer Full Review</p>
        <h1 style="margin:0 0 10px;font-size:28px;line-height:1.15;color:#f8fafc;">The clearest issue holding back ${escapeHtml(auditPayload.store_domain)}</h1>
        <p style="margin:0;color:#cbd5e1;font-size:16px;line-height:1.65;">This audit surfaced the strongest issue likely suppressing conversion, the 30-day revenue opportunity attached to it, and the first move worth acting on.</p>
      </div>
      <div style="padding:28px;">
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:22px;">
          <div style="padding:16px;border-radius:18px;background:#111827;border:1px solid rgba(148,163,184,0.14);">
            <div style="margin:0 0 6px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Audit score</div>
            <div style="color:#f8fafc;font-size:17px;font-weight:600;">${escapeHtml(auditPayload.audit_score)}</div>
          </div>
          <div style="padding:16px;border-radius:18px;background:#111827;border:1px solid rgba(148,163,184,0.14);">
            <div style="margin:0 0 6px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Score band</div>
            <div style="color:#f8fafc;font-size:17px;font-weight:600;">${escapeHtml(scoreBand)}</div>
          </div>
          <div style="padding:16px;border-radius:18px;background:#111827;border:1px solid rgba(148,163,184,0.14);grid-column:span 2;">
            <div style="margin:0 0 6px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Estimated 30-day revenue opportunity</div>
            <div style="color:#f8fafc;font-size:17px;font-weight:600;">${escapeHtml(auditPayload.estimated_revenue_loss)}</div>
          </div>
        </div>
        <div style="padding:20px;border-radius:22px;background:#111827;border:1px solid rgba(148,163,184,0.14);margin-bottom:18px;">
          <div style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Store domain</div>
          <div style="margin:0;color:#f8fafc;font-size:18px;font-weight:600;line-height:1.35;">${escapeHtml(auditPayload.store_domain)}</div>
        </div>
        <div style="padding:20px;border-radius:22px;background:#111827;border:1px solid rgba(148,163,184,0.14);margin-bottom:18px;">
          <div style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Top issue</div>
          <div style="margin:0;color:#f8fafc;font-size:20px;font-weight:600;line-height:1.35;">${escapeHtml(auditPayload.top_issue)}</div>
        </div>
        <div style="padding:20px;border-radius:22px;background:#111827;border:1px solid rgba(148,163,184,0.14);margin-bottom:18px;">
          <div style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Recommended action</div>
          <div style="margin:0;color:#f8fafc;font-size:18px;font-weight:600;line-height:1.35;">${escapeHtml(auditPayload.recommended_action)}</div>
        </div>
        <div style="padding:20px;border-radius:22px;background:#111827;border:1px solid rgba(148,163,184,0.14);margin-bottom:18px;">
          <div style="margin:0 0 10px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Issues surfaced</div>
          <ul style="margin:0;padding-left:18px;">${issueItems}</ul>
        </div>
        <div style="padding:20px;border-radius:22px;background:#111827;border:1px solid rgba(148,163,184,0.14);margin-bottom:18px;">
          <div style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Why this matters</div>
          <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">${escapeHtml(whyThisMatters)}</p>
        </div>
        <div style="padding:20px;border-radius:22px;background:#082f49;border:1px solid rgba(34,211,238,0.22);margin-bottom:22px;">
          <p style="margin:0;color:#e2e8f0;font-size:15px;line-height:1.7;">Open the full review to see the strongest issue in context, then use the pricing page to understand exactly what is included if you want this fixed for you.</p>
        </div>
        <div style="padding:20px;border-radius:22px;background:#111827;border:1px solid rgba(148,163,184,0.14);margin-bottom:22px;">
          <div style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">In your full review</div>
          <ul style="margin:0;padding-left:18px;color:#cbd5e1;line-height:1.7;">
            <li style="margin:0 0 8px;">The strongest issue surfaced first</li>
            <li style="margin:0 0 8px;">The recommended next move preserved from the audit</li>
            <li style="margin:0;">Storefront proof tied to the same review</li>
          </ul>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          <a href="${auditUrl}" style="display:inline-block;padding:14px 20px;border-radius:14px;background:#facc15;color:#111827;font-weight:700;text-decoration:none;">Open the full review</a>
          <a href="${fixUrl}" style="display:inline-block;padding:14px 20px;border-radius:14px;border:1px solid rgba(148,163,184,0.24);background:#111827;color:#f8fafc;font-weight:700;text-decoration:none;">See what you pay for</a>
        </div>
        <p style="margin:18px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">Generated at ${escapeHtml(auditPayload.generated_at)}</p>
      </div>
      <div style="padding:18px 28px;border-top:1px solid rgba(148,163,184,0.16);background:#020617;">
        <p style="margin:0;color:#e2e8f0;font-size:13px;font-weight:600;">Official Shopify Partner</p>
        <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Stafford Media Consulting</p>
      </div>
    </div>
  </body>
</html>`;
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
    subject: `Your ShopiFixer audit: the clearest issue holding back ${auditPayload.store_domain}`,
    text: buildEmailBody(auditPayload),
    html: buildEmailHtml(auditPayload),
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
