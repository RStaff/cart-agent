import { sendEmail as defaultSendEmail } from "./mailer.js";
import crypto from "node:crypto";

export const VISITOR_ACKNOWLEDGEMENT = "VISITOR_ACKNOWLEDGEMENT";
export const ROSS_NOTIFICATION = "ROSS_NOTIFICATION";
export const EMAIL_PENDING = "PENDING";
export const EMAIL_SENT = "PROVIDER_ACCEPTED";
export const EMAIL_FAILED = "FAILED";
export const EMAIL_SUPPRESSED = "SUPPRESSED";
export const EMAIL_CLAIM_LEASE_MS = 5 * 60 * 1000;
export const RESEND_IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1000;

function clean(value) { return String(value ?? "").trim(); }
function safePlainText(value) { return clean(value).replace(/[<>]/g, "").replace(/[\u0000-\u001f\u007f]/g, ""); }

export function inboundEmailConfig(env = process.env) {
  const activationRaw = clean(env.STAFFORDOS_INBOUND_EMAIL_ACTIVATED_AT);
  const parsedActivation = activationRaw ? new Date(activationRaw) : null;
  return {
    enabled: clean(env.STAFFORDOS_INBOUND_EMAIL_ENABLED).toLowerCase() === "true",
    from: clean(env.FROM_EMAIL),
    operatorEmail: clean(env.STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL),
    replyTo: clean(env.STAFFORDOS_INQUIRY_REPLY_TO_EMAIL),
    activationAt: parsedActivation && !Number.isNaN(parsedActivation.getTime()) ? parsedActivation : null,
  };
}

export function buildInquiryMessages(inquiry, config) {
  if (!config.from || !config.operatorEmail) throw new Error("INQUIRY_EMAIL_RECIPIENT_CONFIG_MISSING");
  const replyLine = config.replyTo
    ? " You can reply to this email with any additional context."
    : "";
  return [
    {
      messageType: VISITOR_ACKNOWLEDGEMENT,
      to: inquiry.email,
      from: config.from,
      replyTo: config.replyTo || undefined,
      subject: "We received your Stafford Media inquiry",
      text: `Thanks for sharing what you’d like to improve. Your inquiry has been received for Ross to review.${replyLine}`,
      idempotencyKey: `inquiry:${inquiry.submissionId}:visitor-ack`,
    },
    {
      messageType: ROSS_NOTIFICATION,
      to: config.operatorEmail,
      from: config.from,
      subject: `New Stafford Media inquiry ${inquiry.id}`,
      text: [
        "A website automation inquiry is ready for Ross’s review.",
        `Inquiry ID: ${inquiry.id}`,
        `Source: ${inquiry.source}`,
        `Contact: ${safePlainText(inquiry.name || "Name not supplied")}`,
        `Company: ${safePlainText(inquiry.companyName || "Not supplied")}`,
      ].join("\n"),
      idempotencyKey: `inquiry:${inquiry.submissionId}:ross-notification`,
    },
  ];
}

function safeError(error) {
  const code = clean(error?.code || error?.message || "provider_error").slice(0, 160);
  return code.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[email]");
}

async function markBlocked(prisma, inquiryId, now, lastError = "inbound_email_not_enabled") {
  await prisma.staffordosInboundAutomationEmail.updateMany({
    where: { inquiryId, status: EMAIL_PENDING },
    data: { status: EMAIL_FAILED, lastError, nextAttemptAt: now, updatedAt: now },
  });
}

async function suppressBeforeActivation(prisma, activationAt, now) {
  await prisma.staffordosInboundAutomationEmail.updateMany({
    where: { createdAt: { lt: activationAt }, status: { in: [EMAIL_PENDING, EMAIL_FAILED, "SENDING"] } },
    data: { status: EMAIL_SUPPRESSED, lastError: "activation_policy_excluded", nextAttemptAt: null, claimToken: null, claimStartedAt: null, claimExpiresAt: null, updatedAt: now },
  });
}

export async function processInboundInquiryEmails({ prisma, inquiry, env = process.env, sendEmail = defaultSendEmail, now = new Date() }) {
  const config = inboundEmailConfig(env);
  if (!config.enabled) {
    await markBlocked(prisma, inquiry.id, now);
    return { attempted: 0, blocked: true };
  }
  if (!config.activationAt) {
    await markBlocked(prisma, inquiry.id, now, "inbound_email_activation_missing");
    return { attempted: 0, blocked: true };
  }
  if (inquiry.createdAt && new Date(inquiry.createdAt) < config.activationAt) {
    await suppressBeforeActivation(prisma, config.activationAt, now);
    return { attempted: 0, blocked: true };
  }
  const messages = buildInquiryMessages(inquiry, config);
  let attempted = 0;
  for (const message of messages) {
    const row = await prisma.staffordosInboundAutomationEmail.findUnique({ where: { idempotencyKey: message.idempotencyKey } });
    if (!row || row.status === EMAIL_SENT) continue;
    if (row.status === "SENDING" && row.claimExpiresAt && row.claimExpiresAt <= now) {
      if (row.createdAt && now.getTime() - new Date(row.createdAt).getTime() >= RESEND_IDEMPOTENCY_RETENTION_MS) {
        await prisma.staffordosInboundAutomationEmail.updateMany({
          where: { id: row.id, status: "SENDING", claimExpiresAt: { lte: now } },
          data: { status: "AMBIGUOUS", lastError: "idempotency_window_expired", nextAttemptAt: null, claimToken: null, claimStartedAt: null, claimExpiresAt: null, updatedAt: now },
        });
        continue;
      }
      await prisma.staffordosInboundAutomationEmail.updateMany({
        where: { id: row.id, status: "SENDING", claimExpiresAt: { lte: now } },
        data: { status: EMAIL_FAILED, lastError: "stale_claim_recovered", nextAttemptAt: now, claimToken: null, claimStartedAt: null, claimExpiresAt: null, updatedAt: now },
      });
    }
    const claimToken = crypto.randomUUID();
    const claimed = await prisma.staffordosInboundAutomationEmail.updateMany({
      where: {
        id: row.id,
        status: { in: [EMAIL_PENDING, EMAIL_FAILED] },
        attemptCount: { lt: 3 },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      data: { status: "SENDING", attemptCount: { increment: 1 }, claimToken, claimStartedAt: now, claimExpiresAt: new Date(now.getTime() + EMAIL_CLAIM_LEASE_MS), updatedAt: now },
    });
    if (claimed.count !== 1) continue;
    attempted += 1;
    try {
      const result = await sendEmail({ ...message, html: undefined });
      await prisma.staffordosInboundAutomationEmail.updateMany({
        where: { id: row.id, claimToken },
        data: { status: EMAIL_SENT, providerId: result?.id || null, sentAt: now, lastError: null, claimToken: null, claimStartedAt: null, claimExpiresAt: null, updatedAt: now },
      });
    } catch (error) {
      await prisma.staffordosInboundAutomationEmail.updateMany({
        where: { id: row.id, claimToken },
        data: { status: EMAIL_FAILED, lastError: safeError(error), nextAttemptAt: new Date(now.getTime() + 5 * 60 * 1000), claimToken: null, claimStartedAt: null, claimExpiresAt: null, updatedAt: now },
      });
    }
  }
  return { attempted, blocked: false };
}

/**
 * Process all due inbound deliveries without requiring another visitor request.
 * The ledger claim is the concurrency boundary; separate worker processes may
 * safely call this function at the same time.
 */
export async function processDueInboundInquiryEmails({ prisma, env = process.env, sendEmail = defaultSendEmail, now = new Date(), limit = 100 }) {
  const config = inboundEmailConfig(env);
  if (!config.enabled || !config.activationAt) return { inquiries: 0, attempted: 0, disabled: true };
  await suppressBeforeActivation(prisma, config.activationAt, now);
  const due = await prisma.staffordosInboundAutomationEmail.findMany({
    where: {
      OR: [
        { status: EMAIL_PENDING },
        { status: EMAIL_FAILED, nextAttemptAt: { lte: now } },
        { status: "SENDING", claimExpiresAt: { lte: now } },
      ],
    },
    select: { inquiryId: true },
    distinct: ["inquiryId"],
    take: Math.min(Math.max(Number(limit) || 100, 1), 500),
  });
  let attempted = 0;
  for (const { inquiryId } of due) {
    const inquiry = await prisma.staffordosInboundAutomationInquiry.findUnique({
      where: { id: inquiryId },
      select: { id: true, submissionId: true, source: true, name: true, email: true, companyName: true },
    });
    if (!inquiry) continue;
    const result = await processInboundInquiryEmails({ prisma, inquiry, env, sendEmail, now });
    attempted += result.attempted;
  }
  return { inquiries: due.length, attempted, disabled: false };
}
