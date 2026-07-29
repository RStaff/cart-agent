import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDurableAuditLookup,
  retrieveShopifixerAudit,
} from "./shopifixerDurableAuditRetrievalAdapter.js";

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
    analysisSnapshot: { analyzer: "fixture", issues: [{ title: "Checkout friction" }] },
    findingsSnapshot: { canonicalPayload: { top_issue: "Checkout friction" } },
    findingSummary: { issueCount: 1 },
    topIssue: "Checkout friction",
    recommendedAction: "Fix checkout copy",
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
    events: [
      {
        id: "event_1",
        eventType: "audit_completed",
        visibility: "system",
        source: "staffordmedia_shopifixer",
        payload: { topIssue: "Checkout friction" },
        createdAt,
        packetId: null,
        proofReferenceId: null,
      },
    ],
    packetLinks: [],
    proofReferences: [],
    ...overrides,
  };
}

function makeReadOnlyPrisma({ audit = makeAudit(), assertNoWrites = true } = {}) {
  const calls = [];
  const writeTrap = new Proxy({}, {
    get(_target, prop) {
      return async () => {
        if (assertNoWrites) {
          throw new Error(`unexpected_write_method:${String(prop)}`);
        }
        return undefined;
      };
    },
  });

  return {
    calls,
    client: {
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
          if (
            args.where?.lead?.idempotencyKey &&
            args.where.lead.idempotencyKey !== audit.lead.idempotencyKey
          ) {
            return null;
          }
          return audit;
        },
        create: writeTrap.create,
        update: writeTrap.update,
        upsert: writeTrap.upsert,
        delete: writeTrap.delete,
      },
      shopifixerMerchant: writeTrap,
      shopifixerLead: writeTrap,
      shopifixerLeadEvent: writeTrap,
      shopifixerPacketLink: writeTrap,
      packet: writeTrap,
    },
  };
}

test("normalizes lookup by audit id with optional merchant isolation", () => {
  assert.deepEqual(normalizeDurableAuditLookup({
    auditId: "audit_123",
    store: "HTTPS://No-Kings-Athletics.myshopify.com/path",
  }), {
    ok: true,
    lookup: {
      mode: "audit_id",
      auditId: "audit_123",
      storeDomain: "no-kings-athletics.myshopify.com",
    },
  });
});

test("rejects invalid identifiers", () => {
  assert.deepEqual(normalizeDurableAuditLookup({ auditId: "../audit" }), {
    ok: false,
    status: 400,
    error: "invalid_audit_id",
  });
});

test("returns a completed audit with ordered evidence and no packet link", async () => {
  const fake = makeReadOnlyPrisma();
  const result = await retrieveShopifixerAudit({
    auditId: "audit_123",
    prisma: fake.client,
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.result.audit.id, "audit_123");
  assert.equal(result.result.audit.evidence.topIssue, "Checkout friction");
  assert.equal(result.result.lead.id, "lead_1");
  assert.equal(result.result.lead.contactConfidence, "submitted_by_visitor");
  assert.equal(result.result.events.length, 1);
  assert.deepEqual(result.result.packetLinks, []);
  assert.deepEqual(result.result.proofReferences, []);
  assert.equal(fake.calls.length, 1);
});

test("returns an existing packet link without creating packets", async () => {
  const fake = makeReadOnlyPrisma({
    audit: makeAudit({
      packetLinks: [
        {
          id: "packet_link_1",
          packetId: "packet_1",
          purpose: "execution",
          status: "active",
          authorizationSource: "existing_packet_context",
          createdAt,
          updatedAt: completedAt,
          canceledAt: null,
          supersededAt: null,
          packet: {
            packetId: "packet_1",
            storeDomain: "no-kings-athletics.myshopify.com",
            status: "payment_pending",
            executionStatus: "not_started",
            proofStatus: "not_started",
            completionStatus: "not_started",
            createdAt,
            updatedAt: completedAt,
          },
        },
      ],
    }),
  });

  const result = await retrieveShopifixerAudit({
    auditId: "audit_123",
    prisma: fake.client,
  });

  assert.equal(result.ok, true);
  assert.equal(result.result.packetLinks.length, 1);
  assert.equal(result.result.packetLinks[0].packet.packetId, "packet_1");
  assert.equal(result.result.packetLinks[0].packet.status, "payment_pending");
});

test("returns not found for a missing audit", async () => {
  const fake = makeReadOnlyPrisma({ audit: null });
  const result = await retrieveShopifixerAudit({
    auditId: "audit_missing",
    prisma: fake.client,
  });

  assert.deepEqual(result, {
    ok: false,
    status: 404,
    error: "shopifixer_audit_not_found",
  });
});

test("re-entry lookup by lead idempotency key and store returns the same durable audit", async () => {
  const fake = makeReadOnlyPrisma();
  const result = await retrieveShopifixerAudit({
    leadIdempotencyKey: "shopifixer:lead:no-kings-athletics.myshopify.com:staffordmedia_shopifixer",
    store: "no-kings-athletics.myshopify.com",
    prisma: fake.client,
  });

  assert.equal(result.ok, true);
  assert.equal(result.result.lookup.mode, "latest_for_lead");
  assert.equal(result.result.audit.id, "audit_123");
  assert.equal(fake.calls[0][1].orderBy.createdAt, "desc");
});
