import test from "node:test";
import assert from "node:assert/strict";
import {
  EMAIL_FAILED,
  EMAIL_SENT,
  ROSS_NOTIFICATION,
  VISITOR_ACKNOWLEDGEMENT,
  buildInquiryMessages,
  inboundEmailConfig,
  processDueInboundInquiryEmails,
  processInboundInquiryEmails,
} from "./automationInquiryNotifications.js";

function inquiry(overrides = {}) {
  return {
    id: "cm_inquiry_1",
    submissionId: "web_submission_1",
    source: "staffordmedia_automate",
    name: "Synthetic Visitor <script>alert(1)</script>",
    email: "visitor@example.test",
    companyName: "Synthetic Co",
    ...overrides,
  };
}

function fakePrisma(rows) {
  return {
    staffordosInboundAutomationEmail: {
      async findUnique({ where: { idempotencyKey } }) { return rows.find((row) => row.idempotencyKey === idempotencyKey) || null; },
      async updateMany({ where, data }) {
        const candidates = rows.filter((candidate) => (where.id ? candidate.id === where.id : candidate.inquiryId === where.inquiryId));
        const statuses = where.status?.in || (where.status ? [where.status] : null);
        let count = 0;
        for (const row of candidates) {
          const due = !row.nextAttemptAt || row.nextAttemptAt <= (where.OR?.[1]?.nextAttemptAt?.lte || new Date());
          if ((statuses && !statuses.includes(row.status)) || (where.attemptCount && row.attemptCount >= where.attemptCount.lt) || !due || (row.claimed && data.status === "SENDING")) continue;
          row.claimed = true;
          Object.assign(row, data);
          if (data.attemptCount?.increment) row.attemptCount = (row.attemptCount || 0) + data.attemptCount.increment;
          count += 1;
        }
        return { count };
      },
      async update({ where: { id }, data }) { const row = rows.find((candidate) => candidate.id === id); Object.assign(row, data); return row; },
    },
  };
}

function rows() {
  return [
    { id: "ack", inquiryId: "cm_inquiry_1", messageType: VISITOR_ACKNOWLEDGEMENT, status: "PENDING", attemptCount: 0, idempotencyKey: "inquiry:web_submission_1:visitor-ack", nextAttemptAt: null },
    { id: "ross", inquiryId: "cm_inquiry_1", messageType: ROSS_NOTIFICATION, status: "PENDING", attemptCount: 0, idempotencyKey: "inquiry:web_submission_1:ross-notification", nextAttemptAt: null },
  ];
}

test("config requires an explicit inbound transactional-email gate and recipients", () => {
  assert.equal(inboundEmailConfig({ STAFFORDOS_INBOUND_EMAIL_ENABLED: "false" }).enabled, false);
  assert.equal(inboundEmailConfig({ STAFFORDOS_INBOUND_EMAIL_ENABLED: "true", FROM_EMAIL: "support@staffordmedia.ai", STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL: "ross@example.test" }).replyTo, "");
  assert.deepEqual(inboundEmailConfig({ STAFFORDOS_INBOUND_EMAIL_ENABLED: "true", FROM_EMAIL: "support@staffordmedia.ai", STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL: "ross@example.test" }), { enabled: true, from: "support@staffordmedia.ai", operatorEmail: "ross@example.test", replyTo: "" });
});

test("visitor acknowledgement and Ross notification are minimal and text-safe", () => {
  const messages = buildInquiryMessages(inquiry(), { from: "support@staffordmedia.ai", operatorEmail: "ross@example.test", replyTo: "support@staffordmedia.ai" });
  assert.equal(messages.length, 2);
  assert.equal(messages[0].subject, "We received your Stafford Media inquiry");
  assert.match(messages[0].text, /You can reply to this email/);
  assert.doesNotMatch(messages[1].text, /<script>/);
  assert.match(messages[1].text, /cm_inquiry_1/);
});

test("valid acceptance sends each ledger row once, with provider idempotency keys", async () => {
  const state = rows();
  const calls = [];
  const result = await processInboundInquiryEmails({ prisma: fakePrisma(state), inquiry: inquiry(), env: { STAFFORDOS_INBOUND_EMAIL_ENABLED: "true", FROM_EMAIL: "support@staffordmedia.ai", STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL: "ross@example.test" }, sendEmail: async (message) => { calls.push(message); return { id: `provider_${calls.length}` }; } });
  assert.equal(result.attempted, 2);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].idempotencyKey, "inquiry:web_submission_1:visitor-ack");
  assert.deepEqual(state.map((row) => row.status), [EMAIL_SENT, EMAIL_SENT]);
});

test("provider failure is durable and retry is controlled", async () => {
  const state = rows();
  let failures = 0;
  const first = await processInboundInquiryEmails({ prisma: fakePrisma(state), inquiry: inquiry(), env: { STAFFORDOS_INBOUND_EMAIL_ENABLED: "true", FROM_EMAIL: "support@staffordmedia.ai", STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL: "ross@example.test" }, sendEmail: async () => { failures += 1; throw new Error("provider unavailable"); } });
  assert.equal(first.attempted, 2);
  assert.deepEqual(state.map((row) => row.status), [EMAIL_FAILED, EMAIL_FAILED]);
  assert.equal(state[0].lastError, "provider unavailable");
  const retryState = state.map((row) => ({ ...row, claimed: false, nextAttemptAt: new Date(0) }));
  const retry = await processInboundInquiryEmails({ prisma: fakePrisma(retryState), inquiry: inquiry(), env: { STAFFORDOS_INBOUND_EMAIL_ENABLED: "true", FROM_EMAIL: "support@staffordmedia.ai", STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL: "ross@example.test" }, sendEmail: async () => ({ id: "provider_retry" }), now: new Date(1) });
  assert.equal(retry.attempted, 2);
  assert.equal(failures, 2);
});

test("disabled gate records failure without calling provider", async () => {
  const state = rows();
  let called = false;
  await processInboundInquiryEmails({ prisma: fakePrisma(state), inquiry: inquiry(), env: {}, sendEmail: async () => { called = true; } });
  assert.equal(called, false);
  assert.deepEqual(state.map((row) => row.status), [EMAIL_FAILED, EMAIL_FAILED]);
});

test("scheduled processor is inert while inbound email is disabled", async () => {
  const result = await processDueInboundInquiryEmails({
    prisma: { staffordosInboundAutomationEmail: { findMany: async () => { throw new Error("must-not-query"); } } },
    env: {},
  });
  assert.deepEqual(result, { inquiries: 0, attempted: 0, disabled: true });
});

test("concurrent processors claim each delivery once", async () => {
  const state = rows();
  let calls = 0;
  const provider = async () => { calls += 1; await new Promise((resolve) => setTimeout(resolve, 5)); return { id: `provider_${calls}` }; };
  await Promise.all([
    processInboundInquiryEmails({ prisma: fakePrisma(state), inquiry: inquiry(), env: { STAFFORDOS_INBOUND_EMAIL_ENABLED: "true", FROM_EMAIL: "support@staffordmedia.ai", STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL: "ross@example.test" }, sendEmail: provider }),
    processInboundInquiryEmails({ prisma: fakePrisma(state), inquiry: inquiry(), env: { STAFFORDOS_INBOUND_EMAIL_ENABLED: "true", FROM_EMAIL: "support@staffordmedia.ai", STAFFORDOS_INQUIRY_NOTIFICATION_EMAIL: "ross@example.test" }, sendEmail: provider }),
  ]);
  assert.equal(calls, 2);
});
