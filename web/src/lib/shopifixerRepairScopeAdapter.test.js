import test from "node:test";
import assert from "node:assert/strict";
import {
  buildShopifixerRepairScope,
  canTransitionRepairScopeApproval,
} from "./shopifixerRepairScopeAdapter.js";
import { buildShopifixerRepairPlan } from "./shopifixerRepairPlanAdapter.js";

const completedAt = "2026-07-29T01:00:02.000Z";

function makeRetrievedAudit(issues) {
  return {
    audit: {
      id: "audit_123",
      status: "completed",
      normalizedShopifyDomain: "no-kings-athletics.myshopify.com",
      requestFingerprint: "fingerprint_123",
      completedAt,
      evidence: {
        analysisSnapshot: { issues },
        findingsSnapshot: {
          canonicalPayload: {
            top_issue: "Shipping issue",
          },
        },
        findingSummary: {
          issueCount: issues.length,
          topIssue: "Shipping issue",
        },
        recommendedAction: "Clarify the primary purchase action.",
        estimatedRevenueLoss: "$9,999",
      },
    },
    merchant: {
      id: "merchant_1",
      normalizedShopifyDomain: "no-kings-athletics.myshopify.com",
    },
    lead: {
      id: "lead_1",
      idempotencyKey: "shopifixer:lead:no-kings-athletics.myshopify.com:staffordmedia_shopifixer",
    },
    events: [],
    packetLinks: [],
    proofReferences: [],
  };
}

function makeRepairPlan(issues = [
  {
    id: "shipping_uncertainty",
    title: "Shipping issue",
    detail: "Shipping is unclear near checkout.",
    severity: "high",
  },
]) {
  const result = buildShopifixerRepairPlan(makeRetrievedAudit(issues), {
    generatedAt: "2026-07-29T02:00:00.000Z",
  });

  assert.equal(result.ok, true);
  return result.plan;
}

test("builds deterministic repair scope output from identical repair-plan evidence", () => {
  const plan = makeRepairPlan();
  const first = buildShopifixerRepairScope(plan);
  const second = buildShopifixerRepairScope(plan);

  assert.deepEqual(first, second);
  assert.equal(first.ok, true);
  assert.equal(first.scope.auditId, "audit_123");
  assert.equal(first.scope.store, "no-kings-athletics.myshopify.com");
  assert.equal(first.scope.generatedAt, completedAt);
  assert.equal(first.scope.approvalStatus, "READY_FOR_REVIEW");
});

test("classifies included, deferred, and excluded repairs deterministically", () => {
  const plan = makeRepairPlan([
    {
      id: "unsupported_blank",
      title: "",
      detail: "No supported title.",
      severity: "high",
    },
    {
      id: "shipping_uncertainty",
      title: "Shipping issue",
      detail: "Shipping is unclear near checkout.",
      severity: "high",
    },
    {
      id: "slow_checkout_signals",
      title: "Slow checkout signals",
      detail: "Checkout handoff may introduce hesitation.",
      severity: "high",
    },
    {
      id: "low_signal_ambiguity",
      title: "Insufficient signal clarity",
      detail: "Evidence is thin.",
      severity: "low",
    },
  ]);
  const scope = buildShopifixerRepairScope(plan);

  assert.equal(scope.ok, true);
  assert.equal(scope.scope.includedRepairCount, 1);
  assert.equal(scope.scope.deferredRepairCount, 2);
  assert.equal(scope.scope.excludedRepairCount, 1);
  assert.equal(scope.scope.includedRepairs[0].included, true);
  assert.equal(scope.scope.deferredRepairs.every((item) => item.included === false), true);
  assert.equal(scope.scope.excludedRepairs.every((item) => item.excluded === true), true);
});

test("supports deterministic approval-state transitions", () => {
  assert.deepEqual(canTransitionRepairScopeApproval("DRAFT", "READY_FOR_REVIEW"), {
    ok: true,
    from: "DRAFT",
    to: "READY_FOR_REVIEW",
    allowed: true,
  });
  assert.deepEqual(canTransitionRepairScopeApproval("READY_FOR_REVIEW", "APPROVED"), {
    ok: true,
    from: "READY_FOR_REVIEW",
    to: "APPROVED",
    allowed: false,
  });
  assert.equal(canTransitionRepairScopeApproval("bad", "APPROVED").ok, false);
});

test("classifies execution readiness from approval and scope contents", () => {
  const ready = buildShopifixerRepairScope(makeRepairPlan(), { approvalStatus: "APPROVED" });
  assert.equal(ready.scope.executionReadiness, "READY");

  const mixedApproved = buildShopifixerRepairScope(makeRepairPlan([
    {
      id: "shipping_uncertainty",
      title: "Shipping issue",
      detail: "Shipping is unclear near checkout.",
      severity: "high",
    },
    {
      id: "slow_checkout_signals",
      title: "Slow checkout signals",
      detail: "Checkout handoff may introduce hesitation.",
      severity: "high",
    },
  ]), { approvalStatus: "APPROVED" });
  assert.equal(mixedApproved.scope.includedRepairCount, 1);
  assert.equal(mixedApproved.scope.deferredRepairCount, 1);
  assert.equal(mixedApproved.scope.executionReadiness, "READY");

  const review = buildShopifixerRepairScope(makeRepairPlan(), { approvalStatus: "READY_FOR_REVIEW" });
  assert.equal(review.scope.executionReadiness, "REQUIRES_CONFIRMATION");

  const rejected = buildShopifixerRepairScope(makeRepairPlan(), { approvalStatus: "REJECTED" });
  assert.equal(rejected.scope.executionReadiness, "BLOCKED");

  const discovery = buildShopifixerRepairScope(makeRepairPlan([
    {
      id: "low_signal_ambiguity",
      title: "Insufficient signal clarity",
      detail: "Evidence is thin.",
      severity: "low",
    },
  ]), { approvalStatus: "APPROVED" });
  assert.equal(discovery.scope.executionReadiness, "REQUIRES_DISCOVERY");
});

test("rejects invalid approval state without mutating external systems", () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("unexpected_fetch");
  };

  try {
    const scope = buildShopifixerRepairScope(makeRepairPlan(), { approvalStatus: "ready-ish" });
    assert.equal(scope.ok, false);
    assert.equal(scope.status, 400);
    assert.equal(scope.error, "invalid_repair_scope_approval_state");
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not include fabricated revenue claims or execution authority", () => {
  const scope = buildShopifixerRepairScope(makeRepairPlan(), { approvalStatus: "APPROVED" });
  const serialized = JSON.stringify(scope);

  assert.equal(scope.ok, true);
  assert.equal(serialized.includes("$9,999"), false);
  assert.equal(serialized.includes("guaranteed revenue"), false);
  assert.equal(serialized.includes("paymentReference"), false);
  assert.equal(scope.scope.notInScope.includes("Shopify mutation"), true);
  assert.equal(scope.scope.notInScope.includes("Packet creation"), true);
});
