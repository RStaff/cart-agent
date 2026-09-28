import test from "node:test";
import assert from "node:assert/strict";
import { buildAutomationInquiryHandlers } from "../routes/automationInquiries.esm.js";
import { normalizeAutomationInquiry } from "./automationInquiry.js";

const base = (overrides = {}) => ({
  schema: "staffordmedia.automation_inquiry.v1",
  submissionId: "sub_123",
  email: "owner@example.com",
  improvements: ["Lead response"],
  systems: ["Forms"],
  currentWorkflow: "Calls arrive and are reviewed.",
  desiredWorkflow: "A person reviews the next step.",
  contactAcknowledgement: true,
  ...overrides,
});

test("normalizes the allowlisted inquiry and rejects credentials/oversized text", () => {
  const result = normalizeAutomationInquiry(base({ name: "<b>Owner</b>" }));
  assert.equal(result.email, "owner@example.com");
  assert.throws(() => normalizeAutomationInquiry(base({ password: "secret" })), /INQUIRY_FIELD_NOT_ALLOWED/);
  assert.throws(() => normalizeAutomationInquiry(base({ currentWorkflow: "x".repeat(501) })), /INQUIRY_CURRENT_WORKFLOW_INVALID/);
  assert.throws(() => normalizeAutomationInquiry(base({ contactAcknowledgement: false })), /INQUIRY_CONTACT_ACKNOWLEDGEMENT_REQUIRED/);
});

test("same submission retry is idempotent and changed reuse is rejected", async () => {
  const rows = new Map();
  const repository = {
    async accept(input) {
      const normalized = normalizeAutomationInquiry(input);
      const hash = JSON.stringify(normalized);
      const old = rows.get(normalized.submissionId);
      if (old && old !== hash) throw Object.assign(new Error("IDEMPOTENCY_KEY_REUSE"), { code: "IDEMPOTENCY_KEY_REUSE" });
      if (old) return { created: false, inquiry: { id: "inq_1", status: "NEEDS_REVIEW" } };
      rows.set(normalized.submissionId, hash);
      return { created: true, inquiry: { id: "inq_1", status: "NEEDS_REVIEW" } };
    },
  };
  const handlers = buildAutomationInquiryHandlers({ repository, rateLimiter: { consume: async () => ({ allowed: true }) } });
  const response = () => ({ statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
  const request = (body) => ({ body, get: () => "signed-token" });
  const first = response(); await handlers.post(request(base()), first);
  const retry = response(); await handlers.post(request(base()), retry);
  const changed = response(); await handlers.post(request(base({ currentWorkflow: "changed" })), changed);
  assert.equal(first.statusCode, 201); assert.equal(retry.statusCode, 200); assert.equal(changed.statusCode, 409);
});

test("storage failure is honest and does not expose payload", async () => {
  const handlers = buildAutomationInquiryHandlers({ repository: { accept: async () => { throw new Error("database down"); } }, rateLimiter: { consume: async () => ({ allowed: true }) } });
  const response = { statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await handlers.post({ body: base({ currentWorkflow: "private text" }), get: () => "signed-token" }, response);
  assert.equal(response.statusCode, 503);
  assert.equal(JSON.stringify(response.body).includes("private text"), false);
});

test("rate-limit database failure is never reported as accepted", async () => {
  const handlers = buildAutomationInquiryHandlers({
    rateLimiter: { consume: async () => { throw new Error("database unavailable"); } },
    repository: { accept: async () => ({ created: true, inquiry: { id: "never", status: "NEEDS_REVIEW" } }) },
  });
  const response = { statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, set() { return this; }, json(body) { this.body = body; return this; } };
  await handlers.post({ body: base(), get: () => "signed-token" }, response);
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.ok, false);
  assert.equal(response.body.inquiryId, undefined);
});
