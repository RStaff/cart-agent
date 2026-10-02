import test from "node:test";
import assert from "node:assert/strict";
import { createAutomationInquiryRepository } from "./automationInquiryRepository.js";

const input = (overrides = {}) => ({
  schema: "staffordmedia.automation_inquiry.v1", submissionId: "sub_1", email: "owner@example.com",
  improvements: ["Lead response"], systems: ["Forms"], currentWorkflow: "Calls arrive.", desiredWorkflow: "A person reviews.", contactAcknowledgement: true, ...overrides,
});

function fakePrisma() {
  const rows = [];
  const model = {
    async findUnique({ where }) { return rows.find((row) => (where.submissionId && row.submissionId === where.submissionId) || (where.id && row.id === where.id)) || null; },
    async update({ where: { id }, data }) { const row = rows.find((item) => item.id === id); if (!row) throw new Error("missing"); Object.assign(row, data); return row; },
    async findFirst({ where: { email }, select }) { const row = rows.filter((item) => item.email === email).sort((a, b) => b.createdAt - a.createdAt)[0]; return row ? { id: row.id } : null; },
    async create({ data }) { const row = { id: `inq_${rows.length + 1}`, ...data }; rows.push(row); return row; },
    async findMany() { return rows; },
  };
  return { prisma: { staffordosInboundAutomationInquiry: model }, rows };
}

test("repository flags a later same-email inquiry and keeps credential fields out", async () => {
  const { prisma, rows } = fakePrisma();
  const repository = createAutomationInquiryRepository({ prisma });
  const first = await repository.accept(input());
  const second = await repository.accept(input({ submissionId: "sub_2", desiredWorkflow: "A human confirms." }));
  assert.equal(first.created, true);
  assert.equal(second.inquiry.possibleDuplicateOfId, first.inquiry.id);
  assert.equal(Object.hasOwn(rows[0], "password"), false);
  await assert.rejects(() => repository.accept(input({ submissionId: "sub_1", desiredWorkflow: "Changed." })), /IDEMPOTENCY_KEY_REUSE/);
});

test("review persists actor and next action without inventing a status", async () => {
  const { prisma } = fakePrisma();
  const repository = createAutomationInquiryRepository({ prisma });
  const accepted = await repository.accept(input());
  const other = await repository.accept(input({ submissionId: "sub_other", email: "other@example.com" }));
  const reviewed = await repository.review({ inquiryId: accepted.inquiry.id, nextAction: "Ross confirms the right contact", reviewedBy: "ross-subject" }, new Date("2026-10-01T12:00:00.000Z"));
  assert.equal(reviewed.status, "NEEDS_REVIEW");
  assert.equal(reviewed.nextAction, "Ross confirms the right contact");
  assert.equal(reviewed.reviewedBy, "ross-subject");
  assert.equal(reviewed.reviewedAt.toISOString(), "2026-10-01T12:00:00.000Z");
  const otherRow = await prisma.staffordosInboundAutomationInquiry.findUnique({ where: { id: other.inquiry.id } });
  assert.equal(otherRow.nextAction, "Ross reviews this inbound inquiry");
  await assert.rejects(() => repository.review({ inquiryId: accepted.inquiry.id, nextAction: "\u0000bad", reviewedBy: "ross-subject" }), /INQUIRY_REVIEW_INPUT_INVALID/);
});
