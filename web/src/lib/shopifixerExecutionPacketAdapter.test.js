import test from "node:test";
import assert from "node:assert/strict";
import { buildShopifixerRepairPlan } from "./shopifixerRepairPlanAdapter.js";
import { buildShopifixerRepairScope } from "./shopifixerRepairScopeAdapter.js";
import {
  buildShopifixerExecutionPacket,
  SHOPIFIXER_EXECUTION_PACKET_VERSION,
} from "./shopifixerExecutionPacketAdapter.js";

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

function makeApprovedScope(issues = [
  {
    id: "shipping_uncertainty",
    title: "Shipping issue",
    detail: "Shipping is unclear near checkout.",
    severity: "high",
  },
]) {
  const plan = buildShopifixerRepairPlan(makeRetrievedAudit(issues), {
    generatedAt: "2026-07-29T02:00:00.000Z",
  });
  assert.equal(plan.ok, true);

  const scope = buildShopifixerRepairScope(plan.plan, {
    approvalStatus: "APPROVED",
  });
  assert.equal(scope.ok, true);

  return scope.scope;
}

test("builds deterministic execution packet output from an approved repair scope", () => {
  const scope = makeApprovedScope();
  const first = buildShopifixerExecutionPacket(scope);
  const second = buildShopifixerExecutionPacket(scope);

  assert.deepEqual(first, second);
  assert.equal(first.ok, true);
  assert.equal(first.packet.auditId, "audit_123");
  assert.equal(first.packet.scopeId, scope.scopeId);
  assert.equal(Boolean(first.packet.manifestId), true);
  assert.equal(Object.hasOwn(first.packet, "packetId"), false);
  assert.equal(first.packet.canonicalPacketId, null);
  assert.equal(first.packet.manifestVersion, SHOPIFIXER_EXECUTION_PACKET_VERSION);
  assert.equal(first.packet.merchant.store, "no-kings-athletics.myshopify.com");
  assert.equal(first.packet.packetStatus, "PLANNING_ONLY");
});

test("separates canonical packet id from deterministic manifest id", () => {
  const scope = {
    ...makeApprovedScope(),
    canonicalPacketId: "packet_shopifixer_canonical_1",
    scopeFingerprint: "scope_fingerprint_1",
    approvalModel: {
      durableApprovalId: "approval_1",
    },
    packetState: {
      canonicalPacketId: "packet_shopifixer_canonical_1",
      packetStatus: "prepared",
      executionStatus: "not_started",
      proofStatus: "not_started",
      completionStatus: "not_started",
    },
  };
  const manifest = buildShopifixerExecutionPacket(scope).packet;

  assert.equal(manifest.canonicalPacketId, "packet_shopifixer_canonical_1");
  assert.equal(manifest.approvalId, "approval_1");
  assert.equal(manifest.scopeFingerprint, "scope_fingerprint_1");
  assert.equal(manifest.packetStatus, "prepared");
  assert.equal(manifest.executionStatus, "not_started");
  assert.equal(manifest.manifestId.startsWith("shopifixer_exec_manifest_"), true);
  assert.notEqual(manifest.manifestId, manifest.canonicalPacketId);
  assert.equal(Object.hasOwn(manifest, "packetId"), false);
});

test("requires an approved and ready repair scope", () => {
  const scope = makeApprovedScope();

  assert.deepEqual(buildShopifixerExecutionPacket({ ...scope, approvalStatus: "READY_FOR_REVIEW" }), {
    ok: false,
    status: 409,
    error: "repair_scope_not_approved",
  });
  assert.deepEqual(buildShopifixerExecutionPacket({ ...scope, executionReadiness: "REQUIRES_CONFIRMATION" }), {
    ok: false,
    status: 409,
    error: "repair_scope_not_execution_ready",
  });
  assert.deepEqual(buildShopifixerExecutionPacket({ ...scope, includedRepairs: [] }), {
    ok: false,
    status: 422,
    error: "repair_scope_has_no_approved_repairs",
  });
});

test("orders implementation by scope priority and rollback in reverse order", () => {
  const scope = makeApprovedScope([
    {
      id: "brand_spacing",
      title: "Minor visual spacing issue",
      detail: "Spacing could be cleaner.",
      severity: "low",
    },
    {
      id: "shipping_uncertainty",
      title: "Shipping issue",
      detail: "Shipping is unclear near checkout.",
      severity: "high",
    },
  ]);
  const packet = buildShopifixerExecutionPacket(scope).packet;

  assert.equal(packet.implementationSequence.length, 2);
  assert.equal(packet.implementationSequence[0].title, "Shipping issue");
  assert.equal(packet.implementationSequence[1].title, "Minor visual spacing issue");
  assert.equal(packet.rollbackSequence[0].reversesStepId, packet.implementationSequence[1].stepId);
  assert.equal(packet.rollbackSequence[1].reversesStepId, packet.implementationSequence[0].stepId);
});

test("generates verification, completion criteria, and required evidence", () => {
  const packet = buildShopifixerExecutionPacket(makeApprovedScope()).packet;

  assert.equal(packet.verification.expectedVerificationSteps.length > 0, true);
  assert.equal(packet.verification.completionCriteria.some((item) => item.includes("No Shopify surface outside")), true);
  assert.equal(packet.verification.requiredEvidence.includes("implementation_change_log"), true);
  assert.equal(packet.verification.repairVerificationCriteria[0].scopeItemId, packet.approvedRepairs[0].scopeItemId);
});

test("states authorized, not authorized, and out of scope boundaries", () => {
  const packet = buildShopifixerExecutionPacket(makeApprovedScope([
    {
      id: "shipping_uncertainty",
      title: "Shipping issue",
      detail: "Shipping is unclear near checkout.",
      severity: "high",
    },
    {
      id: "low_signal_ambiguity",
      title: "Insufficient signal clarity",
      detail: "Evidence is thin.",
      severity: "low",
    },
  ])).packet;

  assert.equal(packet.executionBoundary.authorized.length, 1);
  assert.equal(packet.executionBoundary.notAuthorized.some((item) => item.includes("Packet table")), true);
  assert.equal(packet.executionBoundary.outOfScope.length, 1);
  assert.equal(packet.authority.currentMissionExecutionAuthorized, false);
  assert.equal(packet.authority.futureExecutionRequires.includes("separately governed execution mission"), true);
});

test("does not invoke analyzer, database writes, Packet mutation, Shopify mutation, or payment paths", () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("unexpected_fetch");
  };

  try {
    const packet = buildShopifixerExecutionPacket(makeApprovedScope());
    const serialized = JSON.stringify(packet);

    assert.equal(packet.ok, true);
    assert.equal(fetchCalled, false);
    assert.equal(serialized.includes("paymentReference"), false);
    assert.equal(serialized.includes("DATABASE_URL"), false);
    assert.equal(serialized.includes("shopify_admin"), false);
    assert.equal(packet.packet.authority.currentMissionExecutionAuthorized, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
