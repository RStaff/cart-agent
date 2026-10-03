import { internalOnly } from "../middleware/internalOnly.js";
import { AUTOMATION_INQUIRY_MAX_BODY_BYTES, normalizeAutomationInquiry } from "../lib/automationInquiry.js";
import { createAutomationInquiryRepository } from "../lib/automationInquiryRepository.js";
import { createAutomationInquiryRateLimiter } from "../lib/automationInquiryRateLimiter.js";
import { processInboundInquiryEmails } from "../lib/automationInquiryNotifications.js";
import { requireOperatorReviewContext } from "../lib/automationInquiryReview.js";

export function buildAutomationInquiryHandlers({ repository, rateLimiter, notificationProcessor = processInboundInquiryEmails }) {
  return {
    async post(req, res) {
      try {
        const normalized = normalizeAutomationInquiry(req.body);
        const limit = await rateLimiter.consume(req.get("x-stafford-visitor-token"), normalized.email);
        if (!limit.allowed) return res.set("Retry-After", String(limit.retryAfterSeconds)).status(429).json({ ok: false, error: "INQUIRY_RATE_LIMITED" });
        const result = await repository.accept(normalized);
        if (result.created && result.notificationInquiry) {
          try {
            await notificationProcessor({ prisma: repository.prisma, inquiry: result.notificationInquiry });
          } catch (error) {
            // Acceptance is durable; email status is tracked separately and never turns this into a retry prompt.
            console.error("[staffordos-inquiry-email] processing failed", "provider_error");
          }
        }
        return res.status(result.created ? 201 : 200).json({ ok: true, inquiryId: result.inquiry.id, status: result.inquiry.status, created: result.created });
      } catch (error) {
        const code = String(error?.code || error?.message || "INQUIRY_REJECTED");
        const status = code === "IDEMPOTENCY_KEY_REUSE" ? 409 : (code === "INQUIRY_VISITOR_TOKEN_INVALID" ? 401 : (code.startsWith("INQUIRY_") ? 400 : 503));
        return res.status(status).json({ ok: false, error: status === 503 ? "INQUIRY_STORAGE_UNAVAILABLE" : code });
      }
    },
    async list(req, res) {
      try {
        return res.status(200).json({ ok: true, inquiries: await repository.list({ limit: req.query?.limit }) });
      } catch {
        return res.status(503).json({ ok: false, error: "INQUIRY_STORAGE_UNAVAILABLE" });
      }
    },
    async review(req, res) {
      try {
        const { subject } = requireOperatorReviewContext(req);
        const inquiry = await repository.review({ inquiryId: req.body?.inquiryId, nextAction: req.body?.nextAction, reviewedBy: subject });
        return res.status(200).json({ ok: true, inquiry });
      } catch (error) {
        const code = String(error?.code || "INQUIRY_REVIEW_FAILED");
        return res.status(code === "INQUIRY_NOT_FOUND" ? 404 : code === "INQUIRY_REVIEW_INPUT_INVALID" || code === "INQUIRY_REVIEW_ACTOR_INVALID" ? 400 : code === "OPERATOR_IDENTITY_MISSING" || code === "OPERATOR_PERMISSION_MISSING" ? 403 : 503).json({ ok: false, error: code });
      }
    },
  };
}

export function installAutomationInquiryRoute(app, { prisma }) {
  const repository = createAutomationInquiryRepository({ prisma });
  repository.prisma = prisma;
  const rateLimiter = createAutomationInquiryRateLimiter({ prisma, secret: process.env.INTERNAL_API_KEY, emailHashSecret: process.env.STAFFORDOS_INTAKE_EMAIL_HMAC_KEY });
  const handlers = buildAutomationInquiryHandlers({ repository, rateLimiter });
  const boundedBody = (req, res, next) => {
    const declared = Number(req.get("content-length") || 0);
    if (declared > AUTOMATION_INQUIRY_MAX_BODY_BYTES) return res.status(413).json({ ok: false, error: "INQUIRY_PAYLOAD_TOO_LARGE" });
    if (Buffer.byteLength(JSON.stringify(req.body || {}), "utf8") > AUTOMATION_INQUIRY_MAX_BODY_BYTES) return res.status(413).json({ ok: false, error: "INQUIRY_PAYLOAD_TOO_LARGE" });
    return next();
  };
  app.post("/api/staffordos/automation-inquiries", internalOnly, boundedBody, handlers.post);
  app.get("/api/staffordos/automation-inquiries", internalOnly, handlers.list);
  app.patch("/api/staffordos/automation-inquiries/review", internalOnly, boundedBody, handlers.review);
  return { bodyLimit: AUTOMATION_INQUIRY_MAX_BODY_BYTES };
}
