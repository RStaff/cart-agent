import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExecutionManifestScopeInput,
  calculateRepairScopeFingerprint,
  evaluateApprovalLifecycle,
  evaluateRepairScopeAuthority,
  recordRepairScopeApproval,
  revokeRepairScopeApproval,
  storeRepairScope,
} from "./shopifixerScopeAuthorityRepository.js";

const createdAt = new Date("2026-07-29T01:00:00.000Z");
const completedAt = new Date("2026-07-29T01:00:02.000Z");

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
          confidence: "medium",
        },
      ],
    },
    findingsSnapshot: { canonicalPayload: { top_issue: "Purchase reassurance may be thin near the first action" } },
    findingSummary: { issueCount: 1, topIssue: "Purchase reassurance may be thin near the first action" },
    topIssue: "Purchase reassurance may be thin near the first action",
    recommendedAction: "Strengthen purchase reassurance",
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

function makeScope(overrides = {}) {
  return {
    auditId: "audit_123",
    store: "no-kings-athletics.myshopify.com",
    scopeVersion: 1,
    sourceEvidenceVersion: "audit_evidence_123",
    sourceAuditCompletedAt: completedAt.toISOString(),
    totalFindings: 1,
    totalRepairItems: 1,
    includedRepairs: [
      {
        scopeItemId: "scope_item_1",
        sourceRepairItemId: "repair_1",
        sourceFindingId: "finding_1",
        priorityRank: 1,
        title: "Clarify purchase reassurance",
        reason: "Trust cues are thin.",
        evidence: ["Trust cues are thin.", "Top issue"],
        recommendedImplementation: "Add reassurance near the purchase action.",
        estimatedComplexity: "low",
        implementationDependency: ["operator_evidence_review"],
        verificationCriteria: ["Before/after evidence shows reassurance near the purchase action."],
        rollbackExpectation: "Revert the bounded change.",
        actionableStatus: "DIRECTLY_ACTIONABLE",
        scopeDisposition: "INCLUDED",
      },
    ],
    excludedRepairs: [],
    deferredRepairs: [],
    estimatedImplementationSize: "small",
    implementationAssumptions: ["Scope is derived from stored durable audit evidence."],
    implementationDependencies: ["operator_evidence_review"],
    notInScope: ["Shopify mutation", "Packet creation"],
    generatedAt: "2099-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeFakePrisma({ audit = makeAudit() } = {}) {
  const data = {
    scopes: [],
    approvals: [],
    events: [],
    packetCreateCalls: 0,
    packetLinkCreateCalls: 0,
  };

  const tx = {
    shopifixerAudit: {
      findFirst: async (args) => {
        if (!audit) return null;
        if (args.where?.id && args.where.id !== audit.id) return null;
        if (args.where?.normalizedShopifyDomain && args.where.normalizedShopifyDomain !== audit.normalizedShopifyDomain) {
          return null;
        }
        return audit;
      },
    },
    shopifixerRepairScope: {
      findUnique: async ({ where }) => data.scopes.find((scope) => (
        (where.scopeId && scope.scopeId === where.scopeId) ||
        (where.id && scope.id === where.id)
      )) || null,
      findFirst: async ({ where }) => data.scopes.find((scope) => (
        (!where.auditId || scope.auditId === where.auditId) &&
        (!where.scopeFingerprint || scope.scopeFingerprint === where.scopeFingerprint) &&
        (!where.scopeId || scope.scopeId === where.scopeId)
      )) || null,
      create: async ({ data: row }) => {
        const created = {
          id: `scope_row_${data.scopes.length + 1}`,
          createdAt,
          supersededAt: null,
          ...row,
        };
        data.scopes.push(created);
        return created;
      },
    },
    shopifixerRepairApproval: {
      findUnique: async ({ where, include }) => {
        const approval = data.approvals.find((row) => (
          (where.approvalId && row.approvalId === where.approvalId) ||
          (where.approvalIdempotencyKey && row.approvalIdempotencyKey === where.approvalIdempotencyKey)
        )) || null;
        if (approval && include?.repairScope) {
          return { ...approval, repairScope: data.scopes.find((scope) => scope.id === approval.repairScopeId) || null };
        }
        return approval;
      },
      findFirst: async ({ where }) => data.approvals.find((approval) => (
        (!where.activeKey || approval.activeKey === where.activeKey) &&
        (!where.status || approval.status === where.status)
      )) || null,
      create: async ({ data: row }) => {
        const created = {
          id: `approval_row_${data.approvals.length + 1}`,
          approvedAt: row.approvedAt || createdAt,
          createdAt,
          updatedAt: createdAt,
          revokedAt: null,
          ...row,
        };
        data.approvals.push(created);
        return created;
      },
      update: async ({ where, data: update, include }) => {
        const index = data.approvals.findIndex((approval) => approval.approvalId === where.approvalId);
        if (index < 0) return null;
        data.approvals[index] = {
          ...data.approvals[index],
          ...update,
          updatedAt: completedAt,
        };
        if (include?.repairScope) {
          return {
            ...data.approvals[index],
            repairScope: data.scopes.find((scope) => scope.id === data.approvals[index].repairScopeId) || null,
          };
        }
        return data.approvals[index];
      },
    },
    shopifixerLeadEvent: {
      upsert: async ({ where, create, update }) => {
        const existing = data.events.find((event) => event.idempotencyKey === where.idempotencyKey);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const event = { id: `event_${data.events.length + 1}`, createdAt, ...create };
        data.events.push(event);
        return event;
      },
    },
    packet: {
      create: async () => {
        data.packetCreateCalls += 1;
        throw new Error("unexpected_packet_create");
      },
      update: async () => {
        data.packetCreateCalls += 1;
        throw new Error("unexpected_packet_update");
      },
    },
    shopifixerPacketLink: {
      create: async () => {
        data.packetLinkCreateCalls += 1;
        throw new Error("unexpected_packet_link_create");
      },
    },
  };

  return {
    ...tx,
    _data: data,
    $transaction: async (operation) => operation(tx),
  };
}

function approvalInput(overrides = {}) {
  return {
    approvalIdempotencyKey: "approval-key-1",
    actorType: "operator",
    actorId: "operator_1",
    approvalSource: "operator_mediated_merchant_approval",
    operatorMediated: true,
    merchantAuthenticated: false,
    approvalEvidence: { source: "sanitized_operator_note", evidenceId: "evidence_1" },
    approvedTermsBoundary: { boundary: "one bounded repair from stored scope" },
    ...overrides,
  };
}

test("scope fingerprint ignores request-time metadata and normalizes non-semantic ordering", () => {
  const first = calculateRepairScopeFingerprint(makeScope());
  const second = calculateRepairScopeFingerprint({
    ...makeScope({ generatedAt: "2026-01-01T00:00:00.000Z" }),
    notInScope: ["Packet creation", "Shopify mutation"],
    implementationDependencies: ["operator_evidence_review", "operator_evidence_review"],
    includedRepairs: [
      {
        ...makeScope().includedRepairs[0],
        evidence: ["Top issue", "Trust cues are thin."],
        verificationCriteria: ["Before/after evidence shows reassurance near the purchase action."],
      },
    ],
  });

  assert.equal(first.scopeFingerprint, second.scopeFingerprint);
});

test("scope fingerprint changes when authority-bearing content changes", () => {
  const first = calculateRepairScopeFingerprint(makeScope());
  const changedRepair = calculateRepairScopeFingerprint({
    ...makeScope(),
    includedRepairs: [
      {
        ...makeScope().includedRepairs[0],
        recommendedImplementation: "Use a different bounded implementation.",
      },
    ],
  });
  const changedBoundary = calculateRepairScopeFingerprint({
    ...makeScope(),
    notInScope: ["Shopify mutation"],
  });

  assert.notEqual(first.scopeFingerprint, changedRepair.scopeFingerprint);
  assert.notEqual(first.scopeFingerprint, changedBoundary.scopeFingerprint);
});

test("stores one immutable repair scope idempotently and records an event without Packet writes", async () => {
  const prisma = makeFakePrisma();
  const first = await storeRepairScope({
    auditId: "audit_123",
    store: "no-kings-athletics.myshopify.com",
    scopeVersion: 1,
    actorType: "operator",
    actorId: "operator_1",
    prisma,
  });
  const second = await storeRepairScope({
    auditId: "audit_123",
    store: "no-kings-athletics.myshopify.com",
    scopeVersion: 1,
    actorType: "operator",
    actorId: "operator_1",
    prisma,
  });

  assert.equal(first.ok, true);
  assert.equal(first.created, true);
  assert.equal(second.ok, true);
  assert.equal(second.created, false);
  assert.equal(first.scope.scopeId, second.scope.scopeId);
  assert.equal(prisma._data.scopes.length, 1);
  assert.equal(prisma._data.events.some((event) => event.eventType === "repair_scope_stored"), true);
  assert.equal(prisma._data.packetCreateCalls, 0);
  assert.equal(prisma._data.packetLinkCreateCalls, 0);
  assert.equal(Object.hasOwn(first.scope.normalizedSnapshot, "approvalStatus"), false);
});

test("rejects scope creation when audit and store isolation do not match", async () => {
  const result = await storeRepairScope({
    auditId: "audit_123",
    store: "another-store.myshopify.com",
    scopeVersion: 1,
    actorType: "operator",
    actorId: "operator_1",
    prisma: makeFakePrisma(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
});

test("rejects conflicting stored content for the same claimed scope identity", async () => {
  const prisma = makeFakePrisma();
  const first = await storeRepairScope({
    auditId: "audit_123",
    store: "no-kings-athletics.myshopify.com",
    actorType: "operator",
    actorId: "operator_1",
    prisma,
  });
  prisma._data.scopes[0].scopeFingerprint = "conflicting_fingerprint";

  const second = await storeRepairScope({
    auditId: "audit_123",
    store: "no-kings-athletics.myshopify.com",
    actorType: "operator",
    actorId: "operator_1",
    prisma,
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.error, "repair_scope_identity_conflict");
});

test("creates durable operator-mediated approval for the exact stored scope", async () => {
  const prisma = makeFakePrisma();
  const scope = await storeRepairScope({
    auditId: "audit_123",
    store: "no-kings-athletics.myshopify.com",
    actorType: "operator",
    actorId: "operator_1",
    prisma,
  });
  const approval = await recordRepairScopeApproval({
    scopeId: scope.scope.scopeId,
    ...approvalInput(),
    prisma,
  });

  assert.equal(approval.ok, true);
  assert.equal(approval.created, true);
  assert.equal(approval.approval.approvedScopeFingerprint, scope.scope.scopeFingerprint);
  assert.equal(approval.approval.approvedScopeVersion, scope.scope.scopeVersion);
  assert.equal(approval.approval.approvedIncludedRepairIds.length, 1);
  assert.equal(approval.approval.approvedIncludedRepairIds[0].startsWith("scope_item_"), true);
  assert.equal(approval.approval.operatorMediated, true);
  assert.equal(approval.approval.merchantAuthenticated, false);
  assert.equal(prisma._data.events.some((event) => event.eventType === "repair_scope_approved"), true);
  assert.equal(prisma._data.packetCreateCalls, 0);
});

test("approval creation is idempotent and rejects conflicting idempotency reuse", async () => {
  const prisma = makeFakePrisma();
  const scope = await storeRepairScope({
    auditId: "audit_123",
    store: "no-kings-athletics.myshopify.com",
    actorType: "operator",
    actorId: "operator_1",
    prisma,
  });
  const first = await recordRepairScopeApproval({ scopeId: scope.scope.scopeId, ...approvalInput(), prisma });
  const replay = await recordRepairScopeApproval({ scopeId: scope.scope.scopeId, ...approvalInput(), prisma });
  const conflict = await recordRepairScopeApproval({
    scopeId: scope.scope.scopeId,
    ...approvalInput({ approvalEvidence: { different: true } }),
    prisma,
  });

  assert.equal(first.created, true);
  assert.equal(replay.created, false);
  assert.equal(first.approval.approvalId, replay.approval.approvalId);
  assert.equal(conflict.ok, false);
  assert.equal(conflict.error, "approval_idempotency_conflict");
});

test("approval rejects altered included repairs and missing actor/source authority", async () => {
  const prisma = makeFakePrisma();
  const scope = await storeRepairScope({
    auditId: "audit_123",
    store: "no-kings-athletics.myshopify.com",
    actorType: "operator",
    actorId: "operator_1",
    prisma,
  });
  const altered = await recordRepairScopeApproval({
    scopeId: scope.scope.scopeId,
    ...approvalInput({ approvedIncludedRepairIds: ["not_the_scope_item"] }),
    prisma,
  });
  const missingActor = await recordRepairScopeApproval({
    scopeId: scope.scope.scopeId,
    ...approvalInput({ actorId: "" }),
    prisma,
  });
  const missingSource = await recordRepairScopeApproval({
    scopeId: scope.scope.scopeId,
    ...approvalInput({ approvalIdempotencyKey: "approval-key-2", approvalSource: "" }),
    prisma,
  });

  assert.equal(altered.ok, false);
  assert.equal(altered.error, "approval_included_repairs_mismatch");
  assert.equal(missingActor.ok, false);
  assert.equal(missingActor.error, "missing_actor_id");
  assert.equal(missingSource.ok, false);
  assert.equal(missingSource.error, "missing_approval_source");
});

test("revocation is durable, idempotent, and retains approval evidence", async () => {
  const prisma = makeFakePrisma();
  const scope = await storeRepairScope({
    auditId: "audit_123",
    store: "no-kings-athletics.myshopify.com",
    actorType: "operator",
    actorId: "operator_1",
    prisma,
  });
  const approval = await recordRepairScopeApproval({ scopeId: scope.scope.scopeId, ...approvalInput(), prisma });
  const revoked = await revokeRepairScopeApproval({
    approvalId: approval.approval.approvalId,
    actorType: "operator",
    actorId: "operator_2",
    reason: "merchant_requested_revocation",
    prisma,
  });
  const replay = await revokeRepairScopeApproval({
    approvalId: approval.approval.approvalId,
    actorType: "operator",
    actorId: "operator_2",
    reason: "merchant_requested_revocation",
    prisma,
  });

  assert.equal(revoked.ok, true);
  assert.equal(revoked.approval.lifecycleStatus, "REVOKED");
  assert.equal(revoked.approval.active, false);
  assert.equal(replay.ok, true);
  assert.equal(replay.revoked, false);
  assert.deepEqual(revoked.approval.approvalEvidence, approvalInput().approvalEvidence);
  assert.equal(prisma._data.events.some((event) => event.eventType === "repair_scope_revoked"), true);
});

test("computed expiry makes approval inactive without a write", () => {
  const active = evaluateApprovalLifecycle({
    status: "APPROVED",
    expiresAt: "2026-07-30T00:00:00.000Z",
  }, { now: "2026-07-29T00:00:00.000Z" });
  const expired = evaluateApprovalLifecycle({
    status: "APPROVED",
    expiresAt: "2026-07-28T00:00:00.000Z",
  }, { now: "2026-07-29T00:00:00.000Z" });

  assert.equal(active.active, true);
  assert.equal(expired.lifecycleStatus, "EXPIRED");
  assert.equal(expired.active, false);
});

test("authority evaluation remains false until canonical Packet association exists", async () => {
  const prisma = makeFakePrisma();
  const scope = await storeRepairScope({
    auditId: "audit_123",
    store: "no-kings-athletics.myshopify.com",
    actorType: "operator",
    actorId: "operator_1",
    prisma,
  });
  const approval = await recordRepairScopeApproval({ scopeId: scope.scope.scopeId, ...approvalInput(), prisma });
  const authority = evaluateRepairScopeAuthority({
    scope: scope.scope,
    approval: approval.approval,
  });
  const manifestScope = buildExecutionManifestScopeInput(scope.scope, approval.approval);

  assert.equal(authority.EXECUTION_AUTHORIZED, false);
  assert.equal(authority.failedConditions.includes("canonical_packet_missing"), true);
  assert.equal(authority.failedConditions.includes("packet_execution_not_permitted"), true);
  assert.equal(manifestScope.approvalStatus, "APPROVED");
  assert.equal(manifestScope.executionReadiness, "READY");
});
