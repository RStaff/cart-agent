import test from "node:test";
import assert from "node:assert/strict";
import { createInboundReviewRequest, INBOUND_REVIEW_PERMISSION } from "./inboundAutomationReview.mjs";

const valid = { baseUrl: "https://api.example.test/", serviceKey: "server-only-key", operatorSubject: "ross-subject", permission: INBOUND_REVIEW_PERMISSION, inquiryId: "inq_1", nextAction: "Review the brief" };

test("review request requires service credentials", () => {
  assert.throws(() => createInboundReviewRequest({ ...valid, serviceKey: "" }), /INQUIRY_REVIEW_SOURCE_UNCONFIGURED/);
});

test("review request requires verified operator identity and write permission", () => {
  assert.throws(() => createInboundReviewRequest({ ...valid, operatorSubject: "" }), /OPERATOR_IDENTITY_MISSING/);
  assert.throws(() => createInboundReviewRequest({ ...valid, permission: "careeros.beta.operations.read" }), /OPERATOR_PERMISSION_MISSING/);
});

test("request contains server-derived identity and ignores browser identity fields", () => {
  const request = createInboundReviewRequest(valid);
  assert.equal(request.url, "https://api.example.test/api/staffordos/automation-inquiries/review");
  assert.match(request.headers["x-staffordos-operator-subject"], /^ross-subject$/);
  assert.equal(JSON.parse(request.body).reviewed, true);
  assert.equal(Object.hasOwn(JSON.parse(request.body), "operatorSubject"), false);
});

test("review input is bounded and rejects control characters", () => {
  assert.throws(() => createInboundReviewRequest({ ...valid, nextAction: "\u0000bad" }), /INQUIRY_REVIEW_INPUT_INVALID/);
  assert.throws(() => createInboundReviewRequest({ ...valid, nextAction: "x".repeat(501) }), /INQUIRY_REVIEW_INPUT_INVALID/);
});

test("review input rejects non-string next actions and trims valid text", () => {
  for (const nextAction of [null, 42, true, {}, [], "", "   ", "x".repeat(501), "bad\u007ftext"]) {
    assert.throws(() => createInboundReviewRequest({ ...valid, nextAction }), /INQUIRY_REVIEW_INPUT_INVALID/);
  }
  const request = createInboundReviewRequest({ ...valid, nextAction: "  Keep the human review  " });
  assert.equal(JSON.parse(request.body).nextAction, "Keep the human review");
});
