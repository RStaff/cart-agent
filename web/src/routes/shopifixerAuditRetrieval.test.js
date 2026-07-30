import test from "node:test";
import assert from "node:assert/strict";
import { internalOnly } from "../middleware/internalOnly.js";
import {
  buildShopifixerAuditRetrievalHandler,
  buildShopifixerExecutionPacketHandler,
  buildShopifixerRepairPlanHandler,
  buildShopifixerRepairScopeHandler,
} from "./shopifixerAuditRetrieval.esm.js";

const createdAt = new Date("2026-07-29T01:00:00.000Z");
const completedAt = new Date("2026-07-29T01:00:02.000Z");

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function makeAudit(overrides = {}) {
  return {
    id: "audit_123",
    status: "completed",
    normalizedShopifyDomain: "no-kings-athletics.myshopify.com",
    auditSequence: 1,
    requestFingerprint: "fingerprint_123",
    source: "staffordmedia_shopifixer",
    inputSnapshot: { normalizedShopifyDomain: "no-kings-athletics.myshopify.com" },
    analysisSnapshot: {
      issues: [
        {
          id: "trust_friction",
          title: "Purchase reassurance may be thin near the first action",
          detail: "Reassurance cues are thin near the purchase path.",
          severity: "medium",
        },
      ],
    },
    findingsSnapshot: { canonicalPayload: { top_issue: "Purchase reassurance may be thin near the first action" } },
    findingSummary: { issueCount: 1, topIssue: "Purchase reassurance may be thin near the first action" },
    topIssue: "Purchase reassurance may be thin near the first action",
    recommendedAction: "Strengthen Purchase Reassurance",
    auditScore: 82,
    estimatedRevenueLoss: "$1,200",
    analyzerVersion: "test-analyzer.v1",
    sourceCommit: "commit_123",
    sourceBuildId: "build_123",
    requestedAt: createdAt,
    completedAt,
    failedAt: null,
    failureKind: null,
    failureMessage: null,
    createdAt,
    updatedAt: completedAt,
    merchant: {
      id: "merchant_1",
      normalizedShopifyDomain: "no-kings-athletics.myshopify.com",
      displayName: "no-kings-athletics.myshopify.com",
      classification: "merchant",
      status: "identified",
      controlledTest: true,
      createdAt,
      updatedAt: completedAt,
    },
    lead: {
      id: "lead_1",
      legacyLeadAlias: "lead_no_kings_athletics_myshopify_com",
      idempotencyKey: "shopifixer:lead:no-kings-athletics.myshopify.com:staffordmedia_shopifixer",
      productSurface: "staffordmedia_shopifixer",
      source: "staffordmedia",
      status: "audit_completed",
      currentStage: "operator_review_required",
      contactConfidence: "submitted_by_visitor",
      nextAction: "Review ShopiFixer audit findings",
      createdAt,
      updatedAt: completedAt,
    },
    events: [],
    packetLinks: [],
    proofReferences: [],
    ...overrides,
  };
}

function makeReadOnlyPrisma({ audit = null } = {}) {
  const calls = [];
  return {
    calls,
    shopifixerAudit: {
      findFirst: async (args) => {
        calls.push(["shopifixerAudit.findFirst", args]);
        if (!audit) return null;
        if (args.where?.id && args.where.id !== audit.id) return null;
        if (
          args.where?.normalizedShopifyDomain &&
          args.where.normalizedShopifyDomain !== audit.normalizedShopifyDomain
        ) {
          return null;
        }
        return audit;
      },
    },
    shopifixerMerchant: {
      create: async () => {
        throw new Error("unexpected_write");
      },
    },
    packet: {
      create: async () => {
        throw new Error("unexpected_packet_create");
      },
    },
  };
}

test("internalOnly rejects requests without the configured key", () => {
  const original = process.env.INTERNAL_API_KEY;
  process.env.INTERNAL_API_KEY = "test-internal-key";
  const res = makeResponse();

  internalOnly(
    {
      get() {
        return "";
      },
    },
    res,
    () => {
      throw new Error("should_not_authorize");
    },
  );

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "unauthorized_internal_route" });
  if (original === undefined) {
    delete process.env.INTERNAL_API_KEY;
  } else {
    process.env.INTERNAL_API_KEY = original;
  }
});

test("retrieval route returns 400 for invalid audit identifiers", async () => {
  const handler = buildShopifixerAuditRetrievalHandler({
    prisma: makeReadOnlyPrisma(),
    logger: { error() {} },
  });
  const res = makeResponse();

  await handler(
    {
      params: { auditId: "../bad" },
      query: {},
    },
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { ok: false, error: "invalid_audit_id" });
});

test("retrieval route returns 404 when the durable audit is absent", async () => {
  const handler = buildShopifixerAuditRetrievalHandler({
    prisma: makeReadOnlyPrisma({ audit: null }),
    logger: { error() {} },
  });
  const res = makeResponse();

  await handler(
    {
      params: { auditId: "audit_missing" },
      query: {},
    },
    res,
  );

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { ok: false, error: "shopifixer_audit_not_found" });
});

test("repair-plan route returns a deterministic plan for an existing audit", async () => {
  const prisma = makeReadOnlyPrisma({ audit: makeAudit() });
  const handler = buildShopifixerRepairPlanHandler({
    prisma,
    logger: { error() {} },
    generatedAt: "2026-07-29T02:00:00.000Z",
  });
  const res = makeResponse();

  await handler(
    {
      params: { auditId: "audit_123" },
      query: { store: "no-kings-athletics.myshopify.com" },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.repairPlan.auditId, "audit_123");
  assert.equal(res.body.repairPlan.repairItems.length, 1);
  assert.equal(res.body.repairPlan.summary.revenueClaimIncluded, false);
  assert.equal(prisma.calls[0][1].where.normalizedShopifyDomain, "no-kings-athletics.myshopify.com");
});

test("repair-plan route returns 404 for missing audit", async () => {
  const handler = buildShopifixerRepairPlanHandler({
    prisma: makeReadOnlyPrisma({ audit: null }),
    logger: { error() {} },
  });
  const res = makeResponse();

  await handler(
    {
      params: { auditId: "audit_missing" },
      query: {},
    },
    res,
  );

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { ok: false, error: "shopifixer_audit_not_found" });
});

test("repair-plan route returns 400 for invalid audit identifiers", async () => {
  const handler = buildShopifixerRepairPlanHandler({
    prisma: makeReadOnlyPrisma(),
    logger: { error() {} },
  });
  const res = makeResponse();

  await handler(
    {
      params: { auditId: "../bad" },
      query: {},
    },
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { ok: false, error: "invalid_audit_id" });
});

test("repair-scope route returns a deterministic scope for an existing audit", async () => {
  const prisma = makeReadOnlyPrisma({ audit: makeAudit() });
  const handler = buildShopifixerRepairScopeHandler({
    prisma,
    logger: { error() {} },
    repairPlanGeneratedAt: "2026-07-29T02:00:00.000Z",
  });
  const first = makeResponse();
  const second = makeResponse();

  await handler(
    {
      params: { auditId: "audit_123" },
      query: { store: "no-kings-athletics.myshopify.com" },
    },
    first,
  );
  await handler(
    {
      params: { auditId: "audit_123" },
      query: { store: "no-kings-athletics.myshopify.com" },
    },
    second,
  );

  assert.equal(first.statusCode, 200);
  assert.equal(first.body.ok, true);
  assert.deepEqual(first.body, second.body);
  assert.equal(first.body.repairScope.auditId, "audit_123");
  assert.equal(first.body.repairScope.approvalStatus, "READY_FOR_REVIEW");
  assert.equal(first.body.repairScope.executionReadiness, "REQUIRES_CONFIRMATION");
  assert.equal(first.body.authority, "planning_only");
  assert.equal(first.body.repairScope.notInScope.includes("Shopify mutation"), true);
  assert.equal(prisma.calls.every((call) => call[0] === "shopifixerAudit.findFirst"), true);
});

test("repair-scope route does not accept request-time approved authority", async () => {
  const handler = buildShopifixerRepairScopeHandler({
    prisma: makeReadOnlyPrisma({ audit: makeAudit() }),
    logger: { error() {} },
  });
  const res = makeResponse();

  await handler(
    {
      params: { auditId: "audit_123" },
      query: { approvalStatus: "APPROVED" },
    },
    res,
  );

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { ok: false, error: "durable_approval_required" });
});

test("repair-scope route returns 404 for a missing durable audit", async () => {
  const handler = buildShopifixerRepairScopeHandler({
    prisma: makeReadOnlyPrisma({ audit: null }),
    logger: { error() {} },
  });
  const res = makeResponse();

  await handler(
    {
      params: { auditId: "audit_missing" },
      query: {},
    },
    res,
  );

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { ok: false, error: "shopifixer_audit_not_found" });
});

test("repair-scope route returns 400 for invalid approval state", async () => {
  const handler = buildShopifixerRepairScopeHandler({
    prisma: makeReadOnlyPrisma({ audit: makeAudit() }),
    logger: { error() {} },
  });
  const res = makeResponse();

  await handler(
    {
      params: { auditId: "audit_123" },
      query: { approvalStatus: "maybe" },
    },
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { ok: false, error: "invalid_repair_scope_approval_state", missing: [] });
});

test("execution-packet route returns a deterministic manifest for durable approved scope", async () => {
  const createdAtIso = createdAt.toISOString();
  const storedScope = {
    id: "stored_scope_1",
    merchantId: "merchant_1",
    auditId: "audit_123",
    scopeId: "scope_123",
    scopeVersion: 1,
    scopeFingerprint: "scope_fingerprint_123",
    store: "no-kings-athletics.myshopify.com",
    createdAt: createdAtIso,
    normalizedSnapshot: {
      auditId: "audit_123",
      store: "no-kings-athletics.myshopify.com",
      scopeVersion: 1,
      sourceEvidenceVersion: "audit_evidence_123",
      totalFindings: 1,
      totalRepairItems: 1,
      includedRepairCount: 1,
      excludedRepairCount: 0,
      deferredRepairCount: 0,
      includedRepairs: [
        {
          scopeItemId: "scope_item_1",
          sourceRepairItemId: "repair_1",
          sourceFindingId: "finding_1",
          priorityRank: 1,
          title: "Clarify purchase reassurance",
          reason: "Stored evidence supports a bounded repair.",
          evidence: ["Trust cues are thin."],
          recommendedImplementation: "Add reassurance near the purchase action.",
          estimatedComplexity: "low",
          implementationDependency: [],
          verificationCriteria: ["Before/after evidence shows reassurance near the purchase action."],
          rollbackExpectation: "Revert the bounded change.",
          actionableStatus: "DIRECTLY_ACTIONABLE",
        },
      ],
      excludedRepairs: [],
      deferredRepairs: [],
      estimatedImplementationSize: "small",
      implementationAssumptions: ["Scope is derived from stored durable audit evidence."],
      implementationDependencies: [],
      notInScope: ["Shopify mutation"],
      verificationCriteria: [
        {
          scopeItemId: "scope_item_1",
          criteria: ["Before/after evidence shows reassurance near the purchase action."],
        },
      ],
      rollbackExpectations: [
        {
          scopeItemId: "scope_item_1",
          rollbackExpectation: "Revert the bounded change.",
        },
      ],
    },
  };
  const { calculateRepairScopeFingerprint } = await import("../lib/shopifixerScopeAuthorityRepository.js");
  storedScope.scopeFingerprint = calculateRepairScopeFingerprint(storedScope.normalizedSnapshot).scopeFingerprint;
  const storedApproval = {
    id: "approval_row_1",
    approvalId: "approval_123",
    repairScopeId: "stored_scope_1",
    merchantId: "merchant_1",
    auditId: "audit_123",
    scopeId: "scope_123",
    approvalFingerprint: "approval_fingerprint_123",
    actorType: "operator",
    actorId: "operator_1",
    approvalSource: "operator_mediated_merchant_approval",
    operatorMediated: true,
    merchantAuthenticated: false,
    approvalEvidence: { evidenceId: "evidence_1" },
    approvedTermsBoundary: { boundary: "stored scope" },
    approvedIncludedRepairIds: ["scope_item_1"],
    approvedScopeVersion: 1,
    approvedScopeFingerprint: storedScope.scopeFingerprint,
    status: "APPROVED",
    approvedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  };
  const packet = {
    packetId: "packet_shopifixer_canonical_1",
    storeDomain: "no-kings-athletics.myshopify.com",
    status: "prepared",
    executionStatus: "not_started",
    proofStatus: "not_started",
    completionStatus: "not_started",
    createdAt,
    updatedAt: createdAt,
  };
  const packetLink = {
    id: "packet_link_1",
    merchantId: "merchant_1",
    auditId: "audit_123",
    packetId: packet.packetId,
    repairScopeId: storedScope.id,
    repairApprovalId: storedApproval.id,
    purpose: "shopifixer_repair_execution",
    status: "active",
    idempotencyKey: "shopifixer:canonical_packet:test",
    authorityFingerprint: "authority_fingerprint_1",
    authorityVersion: "shopifixer.canonical_packet_authority.v1",
    authorizationSource: "durable_repair_scope_approval",
    sourceMetadata: {
      scopeId: storedScope.scopeId,
      approvalId: storedApproval.approvalId,
    },
    createdAt,
    updatedAt: createdAt,
    packet,
    repairScope: storedScope,
    repairApproval: {
      ...storedApproval,
      repairScope: storedScope,
    },
  };
  const prisma = {
    shopifixerRepairScope: {
      findUnique: async () => storedScope,
    },
    shopifixerRepairApproval: {
      findUnique: async () => ({
        ...storedApproval,
        repairScope: storedScope,
      }),
    },
    shopifixerPacketLink: {
      findFirst: async () => packetLink,
    },
  };
  const handler = buildShopifixerExecutionPacketHandler({
    prisma,
    logger: { error() {} },
  });
  const first = makeResponse();
  const second = makeResponse();

  await handler(
    {
      params: { auditId: "audit_123" },
      query: { scopeId: "scope_123", approvalId: "approval_123" },
    },
    first,
  );
  await handler(
    {
      params: { auditId: "audit_123" },
      query: { scopeId: "scope_123", approvalId: "approval_123" },
    },
    second,
  );

  assert.equal(first.statusCode, 200);
  assert.equal(first.body.ok, true);
  assert.deepEqual(first.body, second.body);
  assert.equal(first.body.executionManifest.auditId, "audit_123");
  assert.equal(first.body.executionManifest.canonicalPacketId, "packet_shopifixer_canonical_1");
  assert.equal(first.body.executionManifest.manifestId.startsWith("shopifixer_exec_manifest_"), true);
  assert.equal(Object.hasOwn(first.body.executionManifest, "packetId"), false);
  assert.equal(first.body.executionManifest.executionBoundary.authorized.length, 1);
  assert.equal(first.body.executionManifest.authority.currentMissionExecutionAuthorized, false);
  assert.equal(first.body.authority.EXECUTION_AUTHORIZED, false);
  assert.equal(first.body.authority.failedConditions.includes("canonical_packet_missing"), false);
  assert.equal(first.body.authority.failedConditions.includes("packet_execution_not_permitted"), true);
});

test("execution-packet route rejects request-time approval state", async () => {
  const handler = buildShopifixerExecutionPacketHandler({
    prisma: makeReadOnlyPrisma({ audit: makeAudit() }),
    logger: { error() {} },
  });
  const res = makeResponse();

  await handler(
    {
      params: { auditId: "audit_123" },
      query: { store: "no-kings-athletics.myshopify.com", approvalStatus: "APPROVED" },
    },
    res,
  );

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { ok: false, error: "durable_scope_approval_required" });
});

test("execution-packet route requires durable scope and approval identifiers", async () => {
  const handler = buildShopifixerExecutionPacketHandler({
    prisma: makeReadOnlyPrisma({ audit: makeAudit() }),
    logger: { error() {} },
  });
  const res = makeResponse();

  await handler(
    {
      params: { auditId: "audit_missing" },
      query: {},
    },
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    ok: false,
    error: "missing_durable_scope_approval",
    missing: ["scopeId", "approvalId"],
  });
});
