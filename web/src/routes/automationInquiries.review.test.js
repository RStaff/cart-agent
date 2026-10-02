import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { installAutomationInquiryRoute } from "./automationInquiries.esm.js";

const SERVICE_KEY = "review-test-service-key";
const rows = [
  { id: "inq_one", status: "NEEDS_REVIEW", nextAction: "first", reviewedAt: null, reviewedBy: null },
  { id: "inq_two", status: "NEEDS_REVIEW", nextAction: "second", reviewedAt: null, reviewedBy: null },
];
const inquiryModel = {
  async findUnique({ where }) { return rows.find((row) => (where.id && row.id === where.id) || (where.submissionId && row.submissionId === where.submissionId)) || null; },
  async update({ where: { id }, data }) { const row = rows.find((item) => item.id === id); if (!row) throw Object.assign(new Error("missing"), { code: "INQUIRY_NOT_FOUND" }); Object.assign(row, data); return row; },
  async findFirst() { return null; }, async create() { throw new Error("not used"); }, async findMany() { return rows; },
};
let server; let baseUrl;
before(async () => {
  process.env.INTERNAL_API_KEY = SERVICE_KEY;
  const app = express(); app.use(express.json());
  installAutomationInquiryRoute(app, { prisma: { staffordosInboundAutomationInquiry: inquiryModel, staffordosInboundAutomationRateLimit: {} } });
  await new Promise((resolve) => { server = app.listen(0, "127.0.0.1", resolve); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { delete process.env.INTERNAL_API_KEY; await new Promise((resolve) => server.close(resolve)); });
async function review(body, headers = {}) {
  const response = await fetch(`${baseUrl}/api/staffordos/automation-inquiries/review`, { method: "PATCH", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
const auth = { "x-internal-api-key": SERVICE_KEY, "x-staffordos-operator-subject": "ross-subject", "x-staffordos-operator-permission": "staffordos.revenue_operations.write" };

test("missing and invalid internal service keys are rejected", async () => {
  assert.equal((await review({ inquiryId: "inq_one", nextAction: "updated", reviewed: true })).status, 401);
  assert.equal((await review({ inquiryId: "inq_one", nextAction: "updated", reviewed: true }, { ...auth, "x-internal-api-key": "wrong" })).status, 401);
});
test("missing operator identity and write permission are rejected", async () => {
  assert.equal((await review({ inquiryId: "inq_one", nextAction: "updated", reviewed: true }, { ...auth, "x-staffordos-operator-subject": "" })).status, 403);
  assert.equal((await review({ inquiryId: "inq_one", nextAction: "updated", reviewed: true }, { ...auth, "x-staffordos-operator-permission": "careeros.beta.operations.read" })).status, 403);
});
test("valid review persists server-derived actor and isolates the selected record", async () => {
  const result = await review({ inquiryId: "inq_one", nextAction: "updated action", reviewed: true }, auth);
  assert.equal(result.status, 200); assert.equal(result.body.inquiry.reviewedBy, "ross-subject"); assert.equal(result.body.inquiry.nextAction, "updated action"); assert.equal(result.body.inquiry.status, "NEEDS_REVIEW"); assert.equal(rows[1].nextAction, "second");
});
test("invalid input and missing inquiry are rejected", async () => {
  assert.equal((await review({ inquiryId: "inq_one", nextAction: "\u0000bad", reviewed: true }, auth)).status, 400);
  assert.equal((await review({ inquiryId: "missing", nextAction: "updated", reviewed: true }, auth)).status, 404);
});
