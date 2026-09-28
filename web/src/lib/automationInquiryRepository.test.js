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
    async findUnique({ where: { submissionId } }) { return rows.find((row) => row.submissionId === submissionId) || null; },
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
