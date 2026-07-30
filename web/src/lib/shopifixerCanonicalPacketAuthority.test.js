import test from "node:test";
import assert from "node:assert/strict";
import {
  createOrAssociateCanonicalPacketForApprovedScope,
  evaluateShopifixerExecutionGate,
  getCanonicalPacketAssociationForScope,
  getCanonicalShopifixerExecutionAuthority,
  SHOPIFIXER_CANONICAL_PACKET_INITIAL_STATUS,
  SHOPIFIXER_CANONICAL_PACKET_PURPOSE,
} from "./shopifixerCanonicalPacketAuthority.js";
import {
  recordRepairScopeApproval,
  revokeRepairScopeApproval,
  storeRepairScope,
} from "./shopifixerScopeAuthorityRepository.js";

const createdAt = new Date("2026-07-29T01:00:00.000Z");
const completedAt = new Date("2026-07-29T01:00:02.000Z");

function makeAudit() {
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
  };
}

function makeFakePrisma() {
  const data = {
    audit: makeAudit(),
    scopes: [],
    approvals: [],
    packetLinks: [],
    packets: [],
    events: [],
    writeCalls: {
      packetCreate: 0,
      packetLinkCreate: 0,
      eventUpsert: 0,
    },
  };

  const tx = {
    packet: {
      findUnique: async ({ where }) => data.packets.find((packet) => packet.packetId === where.packetId) || null,
      create: async () => {
        data.writeCalls.packetCreate += 1;
        throw new Error("unexpected_direct_packet_create");
      },
      update: async () => {
        throw new Error("unexpected_packet_update");
      },
    },
    shopifixerAudit: {
      findFirst: async (args) => {
        if (args.where?.id && args.where.id !== data.audit.id) return null;
        if (args.where?.normalizedShopifyDomain && args.where.normalizedShopifyDomain !== data.audit.normalizedShopifyDomain) {
          return null;
        }
        return data.audit;
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
        return approval && include?.repairScope
          ? { ...approval, repairScope: data.scopes.find((scope) => scope.id === approval.repairScopeId) || null }
          : approval;
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
        data.approvals[index] = {
          ...data.approvals[index],
          ...update,
          updatedAt: completedAt,
        };
        return include?.repairScope
          ? { ...data.approvals[index], repairScope: data.scopes.find((scope) => scope.id === data.approvals[index].repairScopeId) || null }
          : data.approvals[index];
      },
    },
    shopifixerPacketLink: {
      findUnique: async ({ where, include }) => {
        const link = data.packetLinks.find((row) => (
          (where.idempotencyKey && row.idempotencyKey === where.idempotencyKey) ||
          (where.authorityFingerprint && row.authorityFingerprint === where.authorityFingerprint)
        )) || null;
        return link && include ? hydrateLink(link, data) : link;
      },
      findFirst: async ({ where, include }) => {
        const link = data.packetLinks.find((row) => (
          (!where.repairScopeId || row.repairScopeId === where.repairScopeId) &&
          (!where.repairApprovalId || row.repairApprovalId === where.repairApprovalId) &&
          (!where.packetId || row.packetId === where.packetId) &&
          (!where.purpose || row.purpose === where.purpose) &&
          (!where.status || row.status === where.status)
        )) || null;
        return link && include ? hydrateLink(link, data) : link;
      },
      findMany: async ({ where, include }) => data.packetLinks
        .filter((row) => (
          (!where.packetId || row.packetId === where.packetId) &&
          (!where.purpose || row.purpose === where.purpose) &&
          (!where.status || row.status === where.status)
        ))
        .map((link) => (include ? hydrateLink(link, data) : link)),
      create: async ({ data: row, include }) => {
        data.writeCalls.packetLinkCreate += 1;
        if (data.packetLinks.some((link) => link.idempotencyKey === row.idempotencyKey)) {
          throw new Error("duplicate_packet_link_idempotency");
        }
        if (data.packetLinks.some((link) => link.authorityFingerprint === row.authorityFingerprint)) {
          throw new Error("duplicate_packet_link_authority");
        }
        const created = {
          id: `packet_link_${data.packetLinks.length + 1}`,
          canceledAt: null,
          supersededAt: null,
          createdAt,
          updatedAt: createdAt,
          ...row,
        };
        data.packetLinks.push(created);
        return include ? hydrateLink(created, data) : created;
      },
    },
    shopifixerLeadEvent: {
      upsert: async ({ where, create, update }) => {
        data.writeCalls.eventUpsert += 1;
        const existing = data.events.find((event) => event.idempotencyKey === where.idempotencyKey);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const event = { id: `event_${data.events.length + 1}`, createdAt, ...create };
        data.events.push(event);
        return event;
      },
      findMany: async ({ where }) => data.events.filter((event) => (
        (!where.auditId || event.auditId === where.auditId) &&
        (
          !where.OR ||
          where.OR.some((clause) => (
            (clause.packetId && event.packetId === clause.packetId) ||
            (clause.eventType?.in && clause.eventType.in.includes(event.eventType))
          ))
        )
      )),
    },
  };

  return {
    ...tx,
    _data: data,
    $transaction: async (operation) => operation(tx),
  };
}

function hydrateLink(link, data) {
  const packet = data.packets?.find((row) => row.packetId === link.packetId) || null;
  const repairScope = data.scopes.find((scope) => scope.id === link.repairScopeId) || null;
  const approval = data.approvals.find((row) => row.id === link.repairApprovalId) || null;
  return {
    ...link,
    packet,
    merchant: data.audit.merchant,
    audit: data.audit,
    repairScope,
    repairApproval: approval ? { ...approval, repairScope } : null,
  };
}

function makePacketRepository(prisma) {
  prisma._data.packets = [];
  const calls = {
    getPacket: 0,
    createPacket: 0,
  };

  return {
    calls,
    async getPacket(packetId) {
      calls.getPacket += 1;
      return prisma._data.packets.find((packet) => packet.packetId === packetId) || null;
    },
    async createPacket(input = {}) {
      calls.createPacket += 1;
      let packet = prisma._data.packets.find((row) => row.packetId === input.packet_id);
      if (!packet) {
        packet = {
          packetId: input.packet_id,
          storeDomain: input.store_domain,
          reservationId: input.reservation_id || null,
          paymentReference: input.payment_reference || null,
          status: input.status || "prepared",
          executionStatus: "not_started",
          proofStatus: "not_started",
          completionStatus: "not_started",
          createdAt,
          updatedAt: createdAt,
        };
        prisma._data.packets.push(packet);
      }
      return packet;
    },
  };
}

async function storeScopeAndApproval(prisma, overrides = {}) {
  const scope = await storeRepairScope({
    auditId: "audit_123",
    store: "no-kings-athletics.myshopify.com",
    actorType: "operator",
    actorId: "operator_1",
    prisma,
  });
  assert.equal(scope.ok, true);

  const approval = await recordRepairScopeApproval({
    scopeId: scope.scope.scopeId,
    approvalIdempotencyKey: overrides.approvalIdempotencyKey || "approval-key-1",
    actorType: overrides.actorType || "operator",
    actorId: overrides.actorId || "operator_1",
    approvalSource: overrides.approvalSource || "operator_mediated_merchant_approval",
    operatorMediated: overrides.operatorMediated ?? true,
    merchantAuthenticated: overrides.merchantAuthenticated ?? false,
    approvalEvidence: overrides.approvalEvidence || { evidenceId: "evidence_1" },
    approvedTermsBoundary: overrides.approvedTermsBoundary || { boundary: "bounded stored scope" },
    expiresAt: overrides.expiresAt,
    prisma,
    now: overrides.now,
  });
  assert.equal(approval.ok, true);

  return { scope: scope.scope, approval: approval.approval };
}

test("creates one canonical Packet through existing Packet repository and one association", async () => {
  const prisma = makeFakePrisma();
  const packetRepository = makePacketRepository(prisma);
  const { scope, approval } = await storeScopeAndApproval(prisma);

  const result = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: scope.scopeId,
    approvalId: approval.approvalId,
    prisma,
    packetRepository,
  });

  assert.equal(result.ok, true);
  assert.equal(result.createdPacket, true);
  assert.equal(result.createdAssociation, true);
  assert.equal(packetRepository.calls.createPacket, 1);
  assert.equal(prisma._data.packets.length, 1);
  assert.equal(prisma._data.packetLinks.length, 1);
  assert.equal(result.packet.status, SHOPIFIXER_CANONICAL_PACKET_INITIAL_STATUS);
  assert.equal(result.packet.executionStatus, "not_started");
  assert.equal(result.packet.paymentReference, null);
  assert.equal(result.packetLink.packetId, result.packet.packetId);
  assert.equal(result.packetLink.purpose, SHOPIFIXER_CANONICAL_PACKET_PURPOSE);
  assert.equal(result.packetLink.scopeId, scope.scopeId);
  assert.equal(result.packetLink.approvalId, approval.approvalId);
  assert.equal(result.executionManifest.canonicalPacketId, result.packet.packetId);
  assert.notEqual(result.executionManifest.manifestId, result.packet.packetId);
  assert.equal(Object.hasOwn(result.executionManifest, "packetId"), false);
  assert.equal(result.authority.conditions.canonicalPacketExists, true);
  assert.equal(result.authority.conditions.packetAssociationExists, true);
  assert.equal(result.authority.EXECUTION_AUTHORIZED, false);
  assert.equal(result.authority.failedConditions.includes("packet_execution_not_permitted"), true);
  assert.equal(prisma._data.events.some((event) => event.eventType === "canonical_packet_created"), true);
  assert.equal(prisma._data.events.some((event) => event.eventType === "canonical_packet_associated"), true);
});

test("replays canonical Packet association without duplicate Packet or PacketLink", async () => {
  const prisma = makeFakePrisma();
  const packetRepository = makePacketRepository(prisma);
  const { scope, approval } = await storeScopeAndApproval(prisma);

  const first = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: scope.scopeId,
    approvalId: approval.approvalId,
    transitionIdempotencyKey: "same-transition",
    prisma,
    packetRepository,
  });
  const second = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: scope.scopeId,
    approvalId: approval.approvalId,
    transitionIdempotencyKey: "same-transition",
    prisma,
    packetRepository,
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(second.createdPacket, false);
  assert.equal(second.createdAssociation, false);
  assert.equal(first.packet.packetId, second.packet.packetId);
  assert.equal(first.packetLink.id, second.packetLink.id);
  assert.equal(prisma._data.packets.length, 1);
  assert.equal(prisma._data.packetLinks.length, 1);
});

test("rejects revoked and expired approvals before Packet association", async () => {
  const revokedPrisma = makeFakePrisma();
  const revokedRepo = makePacketRepository(revokedPrisma);
  const revoked = await storeScopeAndApproval(revokedPrisma);
  await revokeRepairScopeApproval({
    approvalId: revoked.approval.approvalId,
    actorType: "operator",
    actorId: "operator_2",
    reason: "merchant_requested_revocation",
    prisma: revokedPrisma,
  });
  const revokedResult = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: revoked.scope.scopeId,
    approvalId: revoked.approval.approvalId,
    prisma: revokedPrisma,
    packetRepository: revokedRepo,
  });

  const expiredPrisma = makeFakePrisma();
  const expiredRepo = makePacketRepository(expiredPrisma);
  const expired = await storeScopeAndApproval(expiredPrisma, {
    expiresAt: "2026-07-28T00:00:00.000Z",
    now: "2026-07-29T00:00:00.000Z",
  });
  const expiredResult = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: expired.scope.scopeId,
    approvalId: expired.approval.approvalId,
    prisma: expiredPrisma,
    packetRepository: expiredRepo,
    now: "2026-07-29T00:00:00.000Z",
  });

  assert.equal(revokedResult.ok, false);
  assert.equal(revokedResult.error, "approval_revoked");
  assert.equal(revokedPrisma._data.packets.length, 0);
  assert.equal(expiredResult.ok, false);
  assert.equal(expiredResult.error, "approval_expired");
  assert.equal(expiredPrisma._data.packets.length, 0);
});

test("retrieves canonical Packet association and manifest projection", async () => {
  const prisma = makeFakePrisma();
  const packetRepository = makePacketRepository(prisma);
  const { scope, approval } = await storeScopeAndApproval(prisma);
  const created = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: scope.scopeId,
    approvalId: approval.approvalId,
    prisma,
    packetRepository,
  });
  const retrieved = await getCanonicalPacketAssociationForScope({
    scopeId: scope.scopeId,
    approvalId: approval.approvalId,
    prisma,
  });

  assert.equal(created.ok, true);
  assert.equal(retrieved.ok, true);
  assert.equal(retrieved.packet.packetId, created.packet.packetId);
  assert.equal(retrieved.packetLink.authorityFingerprint, created.packetLink.authorityFingerprint);
  assert.equal(retrieved.executionManifest.canonicalPacketId, created.packet.packetId);
  assert.equal(retrieved.authority.failedConditions.includes("packet_execution_not_permitted"), true);
});

test("canonical execution authority lookup reconstructs manifest read-only from packet id", async () => {
  const prisma = makeFakePrisma();
  const packetRepository = makePacketRepository(prisma);
  const { scope, approval } = await storeScopeAndApproval(prisma);
  const created = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: scope.scopeId,
    approvalId: approval.approvalId,
    prisma,
    packetRepository,
  });
  const writeCountsBefore = { ...prisma._data.writeCalls };
  const first = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: created.packet.packetId,
    prisma,
    now: "2026-07-29T02:00:00.000Z",
  });
  const second = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: created.packet.packetId,
    prisma,
    now: "2026-07-29T02:00:00.000Z",
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(prisma._data.writeCalls, writeCountsBefore);
  assert.equal(first.executionManifest.canonicalPacketId, created.packet.packetId);
  assert.equal(first.executionManifest.manifestId, second.executionManifest.manifestId);
  assert.notEqual(first.executionManifest.manifestId, first.executionManifest.canonicalPacketId);
  assert.equal(Object.hasOwn(first.executionManifest, "packetId"), false);
  assert.equal(first.executionGate.executionAuthorized, false);
  assert.equal(first.executionGate.failedConditions.includes("packet_execution_not_permitted"), true);
  assert.equal(first.executionGate.failedConditions.includes("canonical_packet_missing"), false);
  assert.equal(first.executionGate.failedConditions.includes("packet_link_missing"), false);
  assert.equal(first.authority.approval.approvalEvidencePresent, true);
  assert.equal(JSON.stringify(first).includes("evidence_1"), false);
});

test("canonical execution authority reports missing Packet and missing PacketLink distinctly", async () => {
  const missingPacket = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: "packet_missing",
    prisma: makeFakePrisma(),
  });
  const noLinkPrisma = makeFakePrisma();
  noLinkPrisma._data.packets.push({
    packetId: "packet_without_link",
    storeDomain: "no-kings-athletics.myshopify.com",
    status: "prepared",
    executionStatus: "not_started",
    proofStatus: "not_started",
    completionStatus: "not_started",
    createdAt,
    updatedAt: createdAt,
  });
  const missingLink = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: "packet_without_link",
    prisma: noLinkPrisma,
  });

  assert.equal(missingPacket.ok, false);
  assert.equal(missingPacket.error, "canonical_packet_missing");
  assert.equal(missingLink.ok, false);
  assert.equal(missingLink.error, "packet_link_missing");
});

test("canonical execution authority fails closed for missing scope, missing approval, and cross-merchant association", async () => {
  const missingScopePrisma = makeFakePrisma();
  const missingScopeRepo = makePacketRepository(missingScopePrisma);
  const missingScope = await storeScopeAndApproval(missingScopePrisma);
  const missingScopeCreated = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: missingScope.scope.scopeId,
    approvalId: missingScope.approval.approvalId,
    prisma: missingScopePrisma,
    packetRepository: missingScopeRepo,
  });
  missingScopePrisma._data.scopes = [];
  const missingScopeResult = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: missingScopeCreated.packet.packetId,
    prisma: missingScopePrisma,
  });

  const missingApprovalPrisma = makeFakePrisma();
  const missingApprovalRepo = makePacketRepository(missingApprovalPrisma);
  const missingApproval = await storeScopeAndApproval(missingApprovalPrisma);
  const missingApprovalCreated = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: missingApproval.scope.scopeId,
    approvalId: missingApproval.approval.approvalId,
    prisma: missingApprovalPrisma,
    packetRepository: missingApprovalRepo,
  });
  missingApprovalPrisma._data.approvals = [];
  const missingApprovalResult = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: missingApprovalCreated.packet.packetId,
    prisma: missingApprovalPrisma,
  });

  const crossMerchantPrisma = makeFakePrisma();
  const crossMerchantRepo = makePacketRepository(crossMerchantPrisma);
  const crossMerchant = await storeScopeAndApproval(crossMerchantPrisma);
  const crossMerchantCreated = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: crossMerchant.scope.scopeId,
    approvalId: crossMerchant.approval.approvalId,
    prisma: crossMerchantPrisma,
    packetRepository: crossMerchantRepo,
  });
  crossMerchantPrisma._data.packetLinks[0].merchantId = "merchant_other";
  const crossMerchantResult = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: crossMerchantCreated.packet.packetId,
    prisma: crossMerchantPrisma,
  });

  assert.equal(missingScopeResult.ok, false);
  assert.equal(missingScopeResult.integrityFailures.includes("scope_missing"), true);
  assert.equal(missingApprovalResult.ok, false);
  assert.equal(missingApprovalResult.integrityFailures.includes("approval_missing"), true);
  assert.equal(crossMerchantResult.ok, false);
  assert.equal(crossMerchantResult.integrityFailures.includes("packet_merchant_mismatch"), true);
});

test("canonical execution authority fails closed on fingerprint and association tampering", async () => {
  const fingerprintPrisma = makeFakePrisma();
  const fingerprintRepo = makePacketRepository(fingerprintPrisma);
  const fingerprint = await storeScopeAndApproval(fingerprintPrisma);
  const fingerprintCreated = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: fingerprint.scope.scopeId,
    approvalId: fingerprint.approval.approvalId,
    prisma: fingerprintPrisma,
    packetRepository: fingerprintRepo,
  });
  fingerprintPrisma._data.scopes[0].normalizedSnapshot.includedRepairs[0].title = "Tampered title";
  const fingerprintResult = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: fingerprintCreated.packet.packetId,
    prisma: fingerprintPrisma,
  });

  const linkPrisma = makeFakePrisma();
  const linkRepo = makePacketRepository(linkPrisma);
  const link = await storeScopeAndApproval(linkPrisma);
  const linkCreated = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: link.scope.scopeId,
    approvalId: link.approval.approvalId,
    prisma: linkPrisma,
    packetRepository: linkRepo,
  });
  linkPrisma._data.packetLinks[0].authorityFingerprint = "tampered_authority_hash";
  const linkResult = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: linkCreated.packet.packetId,
    prisma: linkPrisma,
  });

  assert.equal(fingerprintResult.ok, false);
  assert.equal(fingerprintResult.integrityFailures.includes("scope_fingerprint_invalid"), true);
  assert.equal(linkResult.ok, false);
  assert.equal(linkResult.integrityFailures.includes("packet_authority_fingerprint_mismatch"), true);
});

test("canonical execution gate distinguishes revoked, expired, and invalid Packet lifecycle states", async () => {
  const revokedPrisma = makeFakePrisma();
  const revokedRepo = makePacketRepository(revokedPrisma);
  const revoked = await storeScopeAndApproval(revokedPrisma);
  const revokedCreated = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: revoked.scope.scopeId,
    approvalId: revoked.approval.approvalId,
    prisma: revokedPrisma,
    packetRepository: revokedRepo,
  });
  await revokeRepairScopeApproval({
    approvalId: revoked.approval.approvalId,
    actorType: "operator",
    actorId: "operator_2",
    reason: "merchant_requested_revocation",
    prisma: revokedPrisma,
  });
  const revokedAuthority = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: revokedCreated.packet.packetId,
    prisma: revokedPrisma,
    now: "2026-07-29T02:00:00.000Z",
  });

  const expiredPrisma = makeFakePrisma();
  const expiredRepo = makePacketRepository(expiredPrisma);
  const expired = await storeScopeAndApproval(expiredPrisma, {
    expiresAt: "2026-07-30T00:00:00.000Z",
    now: "2026-07-29T00:00:00.000Z",
  });
  const expiredCreated = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: expired.scope.scopeId,
    approvalId: expired.approval.approvalId,
    prisma: expiredPrisma,
    packetRepository: expiredRepo,
    now: "2026-07-29T00:00:00.000Z",
  });
  expiredPrisma._data.approvals[0].expiresAt = "2026-07-28T00:00:00.000Z";
  const expiredAuthority = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: expiredCreated.packet.packetId,
    prisma: expiredPrisma,
    now: "2026-07-29T00:00:00.000Z",
  });

  const lifecyclePrisma = makeFakePrisma();
  const lifecycleRepo = makePacketRepository(lifecyclePrisma);
  const lifecycle = await storeScopeAndApproval(lifecyclePrisma);
  const lifecycleCreated = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: lifecycle.scope.scopeId,
    approvalId: lifecycle.approval.approvalId,
    prisma: lifecyclePrisma,
    packetRepository: lifecycleRepo,
  });
  lifecyclePrisma._data.packets[0].status = "unknown_state";
  lifecyclePrisma._data.packets[0].executionStatus = "unknown_execution";
  const lifecycleAuthority = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: lifecycleCreated.packet.packetId,
    prisma: lifecyclePrisma,
  });

  assert.equal(revokedAuthority.ok, true);
  assert.equal(revokedAuthority.executionGate.failedConditions.includes("approval_revoked"), true);
  assert.equal(expiredAuthority.ok, true);
  assert.equal(expiredAuthority.executionGate.failedConditions.includes("approval_expired"), true);
  assert.equal(lifecycleAuthority.ok, true);
  assert.equal(lifecycleAuthority.executionGate.failedConditions.includes("packet_status_invalid"), true);
  assert.equal(lifecycleAuthority.executionGate.failedConditions.includes("packet_execution_status_invalid"), true);
  assert.equal(lifecycleAuthority.executionGate.failedConditions.includes("packet_execution_not_permitted"), true);
});

test("canonical execution gate fails closed for missing approval evidence and wrong store", async () => {
  const evidencePrisma = makeFakePrisma();
  const evidenceRepo = makePacketRepository(evidencePrisma);
  const evidence = await storeScopeAndApproval(evidencePrisma);
  const evidenceCreated = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: evidence.scope.scopeId,
    approvalId: evidence.approval.approvalId,
    prisma: evidencePrisma,
    packetRepository: evidenceRepo,
  });
  evidencePrisma._data.approvals[0].approvalEvidence = {};
  evidencePrisma._data.approvals[0].actorId = "";
  const evidenceAuthority = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: evidenceCreated.packet.packetId,
    prisma: evidencePrisma,
  });

  const storePrisma = makeFakePrisma();
  const storeRepo = makePacketRepository(storePrisma);
  const store = await storeScopeAndApproval(storePrisma);
  const storeCreated = await createOrAssociateCanonicalPacketForApprovedScope({
    scopeId: store.scope.scopeId,
    approvalId: store.approval.approvalId,
    prisma: storePrisma,
    packetRepository: storeRepo,
  });
  storePrisma._data.packets[0].storeDomain = "wrong-store.myshopify.com";
  const storeAuthority = await getCanonicalShopifixerExecutionAuthority({
    canonicalPacketId: storeCreated.packet.packetId,
    prisma: storePrisma,
  });

  assert.equal(evidenceAuthority.ok, true);
  assert.equal(evidenceAuthority.executionGate.failedConditions.includes("approval_evidence_missing"), true);
  assert.equal(evidenceAuthority.executionGate.failedConditions.includes("approval_actor_source_missing"), true);
  assert.equal(storeAuthority.ok, false);
  assert.equal(storeAuthority.integrityFailures.includes("packet_store_mismatch"), true);
});

test("pure execution gate cannot be authorized by caller-supplied flags", () => {
  const gate = evaluateShopifixerExecutionGate({
    executionAuthorized: true,
    normalizedStore: "no-kings-athletics.myshopify.com",
    packet: {
      packetId: "packet_1",
      storeDomain: "no-kings-athletics.myshopify.com",
      status: "prepared",
      executionStatus: "not_started",
    },
    executionManifest: {
      implementationSequence: [{ stepId: "step_1" }],
      rollbackSequence: [{ rollbackStepId: "rollback_1" }],
      verification: {
        repairVerificationCriteria: [{ scopeItemId: "scope_item_1" }],
        requiredEvidence: ["proof"],
      },
    },
  }, { evaluatedAt: "2026-07-29T02:00:00.000Z" });

  assert.equal(gate.executionAuthorized, false);
  assert.equal(gate.failedConditions.includes("packet_execution_not_permitted"), true);
  assert.equal(gate.failedConditions.includes("scope_missing"), true);
});
