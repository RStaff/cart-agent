import test from "node:test";
import assert from "node:assert/strict";
import { internalOnly } from "../middleware/internalOnly.js";
import {
  buildShopifixerAuditRetrievalHandler,
  buildShopifixerRepairPlanHandler,
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
