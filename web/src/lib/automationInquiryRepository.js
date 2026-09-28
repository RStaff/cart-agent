import { inquiryHashes, inquiryPublicRecord, normalizeAutomationInquiry } from "./automationInquiry.js";

export function createAutomationInquiryRepository({ prisma }) {
  const model = () => prisma.staffordosInboundAutomationInquiry;
  return {
    async accept(input, now = new Date()) {
      const normalized = normalizeAutomationInquiry(input);
      const { payloadHash, briefHash } = inquiryHashes(normalized);
      const existing = await model().findUnique({ where: { submissionId: normalized.submissionId } });
      if (existing) {
        if (existing.payloadHash !== payloadHash) {
          throw Object.assign(new Error("IDEMPOTENCY_KEY_REUSE"), { code: "IDEMPOTENCY_KEY_REUSE" });
        }
        return { created: false, inquiry: inquiryPublicRecord(existing) };
      }
      const prior = await model().findFirst({ where: { email: normalized.email }, orderBy: { createdAt: "desc" }, select: { id: true } });
      const created = await model().create({ data: {
        submissionId: normalized.submissionId,
        payloadHash,
        briefHash,
        source: "staffordmedia_automate",
        status: "NEEDS_REVIEW",
        name: normalized.name,
        email: normalized.email,
        phone: normalized.phone,
        companyName: normalized.companyName,
        businessType: normalized.businessType,
        improvements: normalized.improvements,
        systems: normalized.systems,
        currentWorkflow: normalized.currentWorkflow,
        desiredWorkflow: normalized.desiredWorkflow,
        contactAcknowledgement: true,
        possibleDuplicateOfId: prior?.id || null,
        nextAction: "Ross reviews this inbound inquiry",
        createdAt: now,
        updatedAt: now,
      } });
      return { created: true, inquiry: inquiryPublicRecord(created) };
    },
    async list({ limit = 50 } = {}) {
      const rows = await model().findMany({ orderBy: { createdAt: "desc" }, take: Math.min(Math.max(Number(limit) || 50, 1), 100) });
      return rows.map(inquiryPublicRecord);
    },
  };
}
