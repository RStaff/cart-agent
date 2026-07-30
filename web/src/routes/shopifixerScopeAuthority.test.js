import test from "node:test";
import assert from "node:assert/strict";
import { internalOnly } from "../middleware/internalOnly.js";
import {
  buildCreateCanonicalPacketForScopeHandler,
  buildGetCanonicalExecutionManifestHandler,
  buildGetCanonicalPacketForScopeHandler,
  buildGetRepairScopeHandler,
  buildRecordRepairScopeApprovalHandler,
  buildRevokeRepairScopeApprovalHandler,
  buildStoreRepairScopeHandler,
} from "./shopifixerScopeAuthority.esm.js";

const createdAt = new Date("2026-07-29T01:00:00.000Z");

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

function makeRequest({ params = {}, query = {}, body = {}, headers = {} } = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    params,
    query,
    body,
    get(name) {
      return normalizedHeaders[String(name).toLowerCase()] || "";
    },
  };
}

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
    completedAt: createdAt,
    failedAt: null,
    failureKind: null,
    failureMessage: null,
    createdAt,
    updatedAt: createdAt,
    merchant: {
      id: "merchant_1",
      normalizedShopifyDomain: "no-kings-athletics.myshopify.com",
      displayName: "no-kings-athletics.myshopify.com",
      classification: "merchant",
      status: "identified",
      controlledTest: true,
      createdAt,
      updatedAt: createdAt,
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
      updatedAt: createdAt,
    },
    events: [],
    packetLinks: [],
    proofReferences: [],
  };
}

function makeFakePrisma() {
  const audit = makeAudit();
  const data = {
    audit,
    scopes: [],
    approvals: [],
    packetLinks: [],
    packets: [],
    events: [],
  };
  const tx = {
    packet: {
      findUnique: async ({ where }) => data.packets.find((packet) => packet.packetId === where.packetId) || null,
      create: async () => {
        throw new Error("unexpected_direct_packet_create");
      },
      update: async () => {
        throw new Error("unexpected_packet_update");
      },
    },
    shopifixerAudit: {
      findFirst: async (args) => {
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
        (!where.scopeFingerprint || scope.scopeFingerprint === where.scopeFingerprint)
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
          approvedAt: createdAt,
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
        data.approvals[index] = { ...data.approvals[index], ...update, updatedAt: createdAt };
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
        return link && include ? hydratePacketLink(link, data) : link;
      },
      findFirst: async ({ where, include }) => {
        const link = data.packetLinks.find((row) => (
          (!where.repairScopeId || row.repairScopeId === where.repairScopeId) &&
          (!where.repairApprovalId || row.repairApprovalId === where.repairApprovalId) &&
          (!where.packetId || row.packetId === where.packetId) &&
          (!where.purpose || row.purpose === where.purpose) &&
          (!where.status || row.status === where.status)
        )) || null;
        return link && include ? hydratePacketLink(link, data) : link;
      },
      findMany: async ({ where, include }) => data.packetLinks
        .filter((row) => (
          (!where.packetId || row.packetId === where.packetId) &&
          (!where.purpose || row.purpose === where.purpose) &&
          (!where.status || row.status === where.status)
        ))
        .map((link) => (include ? hydratePacketLink(link, data) : link)),
      create: async ({ data: row, include }) => {
        const link = {
          id: `packet_link_${data.packetLinks.length + 1}`,
          canceledAt: null,
          supersededAt: null,
          createdAt,
          updatedAt: createdAt,
          ...row,
        };
        data.packetLinks.push(link);
        return include ? hydratePacketLink(link, data) : link;
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

function hydratePacketLink(link, data) {
  const packet = data.packets.find((row) => row.packetId === link.packetId) || null;
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
  const calls = {
    createPacket: 0,
    getPacket: 0,
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
          reservationId: null,
          paymentReference: null,
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

function authorizedHeaders() {
  return {
    "x-internal-api-key": "test-internal-key",
    "x-shopifixer-actor-type": "operator",
    "x-shopifixer-actor-id": "operator_1",
  };
}

test("scope authority routes deny unauthorized callers and expose no secret", () => {
  const original = process.env.INTERNAL_API_KEY;
  process.env.INTERNAL_API_KEY = "test-internal-key";
  const res = makeResponse();

  internalOnly(makeRequest(), res, () => {
    throw new Error("should_not_authorize");
  });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "unauthorized_internal_route" });
  assert.equal(JSON.stringify(res.body).includes("test-internal-key"), false);
  if (original === undefined) {
    delete process.env.INTERNAL_API_KEY;
  } else {
    process.env.INTERNAL_API_KEY = original;
  }
});

test("scope authority handlers store scope, approve, retrieve, and revoke without Packet output", async () => {
  const prisma = makeFakePrisma();
  const storeHandler = buildStoreRepairScopeHandler({ prisma });
  const approvalHandler = buildRecordRepairScopeApprovalHandler({ prisma });
  const getScopeHandler = buildGetRepairScopeHandler({ prisma });
  const revokeHandler = buildRevokeRepairScopeApprovalHandler({ prisma });

  const scopeRes = makeResponse();
  await storeHandler(
    makeRequest({
      params: { auditId: "audit_123" },
      headers: authorizedHeaders(),
      body: { store: "no-kings-athletics.myshopify.com" },
    }),
    scopeRes,
  );

  assert.equal(scopeRes.statusCode, 201);
  assert.equal(scopeRes.body.ok, true);
  assert.equal(scopeRes.body.authority.EXECUTION_AUTHORIZED, false);
  assert.equal(scopeRes.body.authority.failedConditions.includes("durable_approval_missing"), true);

  const approvalRes = makeResponse();
  await approvalHandler(
    makeRequest({
      params: { scopeId: scopeRes.body.repairScope.scopeId },
      headers: authorizedHeaders(),
      body: {
        approvalIdempotencyKey: "route-approval-1",
        approvalSource: "operator_mediated_merchant_approval",
        operatorMediated: true,
        merchantAuthenticated: false,
        approvalEvidence: { evidenceId: "sanitized_evidence_1" },
        approvedTermsBoundary: { boundary: "bounded stored scope" },
      },
    }),
    approvalRes,
  );

  assert.equal(approvalRes.statusCode, 201);
  assert.equal(approvalRes.body.ok, true);
  assert.equal(approvalRes.body.approval.operatorMediated, true);
  assert.equal(approvalRes.body.approval.merchantAuthenticated, false);
  assert.equal(approvalRes.body.authority.EXECUTION_AUTHORIZED, false);
  assert.equal(approvalRes.body.authority.failedConditions.includes("canonical_packet_missing"), true);

  const getScopeRes = makeResponse();
  await getScopeHandler(
    makeRequest({
      params: { scopeId: scopeRes.body.repairScope.scopeId },
      headers: { "x-internal-api-key": "test-internal-key" },
    }),
    getScopeRes,
  );

  assert.equal(getScopeRes.statusCode, 200);

  const revokeRes = makeResponse();
  await revokeHandler(
    makeRequest({
      params: { approvalId: approvalRes.body.approval.approvalId },
      headers: authorizedHeaders(),
      body: { revocationReason: "merchant_requested_revocation" },
    }),
    revokeRes,
  );

  assert.equal(revokeRes.statusCode, 200);
  assert.equal(revokeRes.body.approval.lifecycleStatus, "REVOKED");
  assert.equal(JSON.stringify(revokeRes.body).includes("test-internal-key"), false);
  assert.equal(prisma._data.events.some((event) => event.eventType === "repair_scope_stored"), true);
  assert.equal(prisma._data.events.some((event) => event.eventType === "repair_scope_approved"), true);
  assert.equal(prisma._data.events.some((event) => event.eventType === "repair_scope_revoked"), true);
});

test("canonical Packet route creates, replays, and retrieves one association", async () => {
  const prisma = makeFakePrisma();
  const packetRepository = makePacketRepository(prisma);
  const storeHandler = buildStoreRepairScopeHandler({ prisma });
  const approvalHandler = buildRecordRepairScopeApprovalHandler({ prisma });
  const createPacketHandler = buildCreateCanonicalPacketForScopeHandler({ prisma, packetRepository });
  const getPacketHandler = buildGetCanonicalPacketForScopeHandler({ prisma });

  const scopeRes = makeResponse();
  await storeHandler(
    makeRequest({
      params: { auditId: "audit_123" },
      headers: authorizedHeaders(),
      body: { store: "no-kings-athletics.myshopify.com" },
    }),
    scopeRes,
  );
  const approvalRes = makeResponse();
  await approvalHandler(
    makeRequest({
      params: { scopeId: scopeRes.body.repairScope.scopeId },
      headers: authorizedHeaders(),
      body: {
        approvalIdempotencyKey: "route-approval-2",
        approvalSource: "operator_mediated_merchant_approval",
        operatorMediated: true,
        merchantAuthenticated: false,
        approvalEvidence: { evidenceId: "sanitized_evidence_2" },
        approvedTermsBoundary: { boundary: "bounded stored scope" },
      },
    }),
    approvalRes,
  );

  const packetRes = makeResponse();
  await createPacketHandler(
    makeRequest({
      params: { scopeId: scopeRes.body.repairScope.scopeId },
      headers: authorizedHeaders(),
      body: { approvalId: approvalRes.body.approval.approvalId },
    }),
    packetRes,
  );
  const replayRes = makeResponse();
  await createPacketHandler(
    makeRequest({
      params: { scopeId: scopeRes.body.repairScope.scopeId },
      headers: authorizedHeaders(),
      body: { approvalId: approvalRes.body.approval.approvalId },
    }),
    replayRes,
  );
  const getRes = makeResponse();
  await getPacketHandler(
    makeRequest({
      params: { scopeId: scopeRes.body.repairScope.scopeId },
      query: { approvalId: approvalRes.body.approval.approvalId },
      headers: authorizedHeaders(),
    }),
    getRes,
  );

  assert.equal(packetRes.statusCode, 201, JSON.stringify(packetRes.body));
  assert.equal(packetRes.body.createdPacket, true);
  assert.equal(packetRes.body.createdAssociation, true);
  assert.equal(replayRes.statusCode, 200);
  assert.equal(replayRes.body.createdPacket, false);
  assert.equal(replayRes.body.createdAssociation, false);
  assert.equal(getRes.statusCode, 200);
  assert.equal(prisma._data.packets.length, 1);
  assert.equal(prisma._data.packetLinks.length, 1);
  assert.equal(packetRepository.calls.createPacket, 1);
  assert.equal(packetRes.body.packet.packetId, getRes.body.packet.packetId);
  assert.equal(packetRes.body.packetLink.packetId, packetRes.body.packet.packetId);
  assert.equal(packetRes.body.executionManifest.canonicalPacketId, packetRes.body.packet.packetId);
  assert.notEqual(packetRes.body.executionManifest.manifestId, packetRes.body.packet.packetId);
  assert.equal(packetRes.body.authority.EXECUTION_AUTHORIZED, false);
  assert.equal(packetRes.body.authority.failedConditions.includes("packet_execution_not_permitted"), true);
  assert.equal(JSON.stringify(packetRes.body).includes("test-internal-key"), false);
});

test("canonical execution manifest route reconstructs durable authority read-only", async () => {
  const prisma = makeFakePrisma();
  const packetRepository = makePacketRepository(prisma);
  const storeHandler = buildStoreRepairScopeHandler({ prisma });
  const approvalHandler = buildRecordRepairScopeApprovalHandler({ prisma });
  const createPacketHandler = buildCreateCanonicalPacketForScopeHandler({ prisma, packetRepository });
  const manifestHandler = buildGetCanonicalExecutionManifestHandler({
    prisma,
    now: "2026-07-29T02:00:00.000Z",
  });

  const scopeRes = makeResponse();
  await storeHandler(
    makeRequest({
      params: { auditId: "audit_123" },
      headers: authorizedHeaders(),
      body: { store: "no-kings-athletics.myshopify.com" },
    }),
    scopeRes,
  );
  const approvalRes = makeResponse();
  await approvalHandler(
    makeRequest({
      params: { scopeId: scopeRes.body.repairScope.scopeId },
      headers: authorizedHeaders(),
      body: {
        approvalIdempotencyKey: "route-approval-3",
        approvalSource: "operator_mediated_merchant_approval",
        operatorMediated: true,
        merchantAuthenticated: false,
        approvalEvidence: { evidenceId: "sanitized_evidence_3" },
        approvedTermsBoundary: { boundary: "bounded stored scope" },
      },
    }),
    approvalRes,
  );
  const packetRes = makeResponse();
  await createPacketHandler(
    makeRequest({
      params: { scopeId: scopeRes.body.repairScope.scopeId },
      headers: authorizedHeaders(),
      body: { approvalId: approvalRes.body.approval.approvalId },
    }),
    packetRes,
  );

  const countsBefore = {
    packets: prisma._data.packets.length,
    packetLinks: prisma._data.packetLinks.length,
    events: prisma._data.events.length,
  };
  const manifestRes = makeResponse();
  await manifestHandler(
    makeRequest({
      params: { packetId: packetRes.body.packet.packetId },
      headers: authorizedHeaders(),
    }),
    manifestRes,
  );
  const missingRes = makeResponse();
  await manifestHandler(
    makeRequest({
      params: { packetId: "packet_missing" },
      headers: authorizedHeaders(),
    }),
    missingRes,
  );

  assert.equal(manifestRes.statusCode, 200);
  assert.equal(manifestRes.body.ok, true);
  assert.equal(manifestRes.body.executionManifest.canonicalPacketId, packetRes.body.packet.packetId);
  assert.notEqual(manifestRes.body.executionManifest.manifestId, packetRes.body.packet.packetId);
  assert.equal(Object.hasOwn(manifestRes.body.executionManifest, "packetId"), false);
  assert.equal(manifestRes.body.executionGate.executionAuthorized, false);
  assert.equal(manifestRes.body.executionGate.failedConditions.includes("packet_execution_not_permitted"), true);
  assert.equal(JSON.stringify(manifestRes.body).includes("sanitized_evidence_3"), false);
  assert.equal(JSON.stringify(manifestRes.body).includes("test-internal-key"), false);
  assert.deepEqual(
    {
      packets: prisma._data.packets.length,
      packetLinks: prisma._data.packetLinks.length,
      events: prisma._data.events.length,
    },
    countsBefore,
  );
  assert.equal(missingRes.statusCode, 404);
  assert.equal(missingRes.body.error, "canonical_packet_missing");
});
