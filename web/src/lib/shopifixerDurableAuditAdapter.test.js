import test from "node:test";
import assert from "node:assert/strict";
import {
  legacyLeadAliasFromDomain,
  normalizeShopifyDomain,
  persistShopifixerAudit,
} from "./shopifixerDurableAuditAdapter.js";

function makePayload(overrides = {}) {
  return {
    store_domain: "no-kings-athletics.myshopify.com",
    audit_score: 82,
    estimated_revenue_loss: "$1,200",
    top_issue: "Checkout friction",
    recommended_action: "Fix checkout copy",
    issues: ["Checkout friction"],
    generated_at: "2026-07-29T01:00:00.000Z",
    ...overrides,
  };
}

function makeAnalysis(overrides = {}) {
  return {
    analyzerVersion: "test-analyzer.v1",
    opportunityScore: 82,
    estimatedLoss: { display: "$1,200" },
    benchmark: { recommendation: "Fix checkout copy" },
    issues: [
      {
        title: "Checkout friction",
        detail: "Primary button is unclear.",
        severity: "high",
      },
    ],
    ...overrides,
  };
}

function makeFakePrisma({ packet = null } = {}) {
  const state = {
    merchant: null,
    lead: null,
    audits: [],
    events: [],
    packet,
    packetLinks: [],
  };
  const calls = [];

  const tx = {
    shopifixerMerchant: {
      upsert: async (args) => {
        calls.push(["shopifixerMerchant.upsert", args]);
        if (!state.merchant) {
          state.merchant = { id: "merchant_1", ...args.create };
        }
        return state.merchant;
      },
    },
    shopifixerLead: {
      upsert: async (args) => {
        calls.push(["shopifixerLead.upsert", args]);
        if (!state.lead) {
          state.lead = { id: "lead_1", ...args.create };
        } else {
          state.lead = { ...state.lead, ...args.update };
        }
        return state.lead;
      },
    },
    shopifixerAudit: {
      findUnique: async (args) => {
        calls.push(["shopifixerAudit.findUnique", args]);
        return state.audits.find((audit) => audit.idempotencyKey === args.where.idempotencyKey) || null;
      },
      findFirst: async (args) => {
        calls.push(["shopifixerAudit.findFirst", args]);
        return state.audits
          .filter((audit) => audit.merchantId === args.where.merchantId)
          .sort((a, b) => b.auditSequence - a.auditSequence)[0] || null;
      },
      create: async (args) => {
        calls.push(["shopifixerAudit.create", args]);
        const audit = { id: `audit_${state.audits.length + 1}`, ...args.data };
        state.audits.push(audit);
        return audit;
      },
    },
    shopifixerLeadEvent: {
      upsert: async (args) => {
        calls.push(["shopifixerLeadEvent.upsert", args]);
        let event = state.events.find((item) => item.idempotencyKey === args.where.idempotencyKey);
        if (!event) {
          event = { id: `event_${state.events.length + 1}`, ...args.create };
          state.events.push(event);
        }
        return event;
      },
    },
    packet: {
      findUnique: async (args) => {
        calls.push(["packet.findUnique", args]);
        return state.packet?.packetId === args.where.packetId ? state.packet : null;
      },
    },
    shopifixerPacketLink: {
      upsert: async (args) => {
        calls.push(["shopifixerPacketLink.upsert", args]);
        let link = state.packetLinks.find((item) => item.idempotencyKey === args.where.idempotencyKey);
        if (!link) {
          link = { id: `packet_link_${state.packetLinks.length + 1}`, ...args.create };
          state.packetLinks.push(link);
        }
        return link;
      },
    },
  };

  return {
    state,
    calls,
    client: {
      $transaction: async (operation) => operation(tx),
    },
  };
}

test("normalizes Shopify domains and legacy aliases deterministically", () => {
  assert.equal(
    normalizeShopifyDomain(" https://www.No-Kings-Athletics.myshopify.com/products/a?x=1#top "),
    "no-kings-athletics.myshopify.com",
  );
  assert.equal(
    legacyLeadAliasFromDomain("no-kings-athletics.myshopify.com"),
    "lead_no_kings_athletics_myshopify_com",
  );
});

test("persists merchant, lead, completed audit, and initial event without changing response contract data", async () => {
  const fake = makeFakePrisma();
  const result = await persistShopifixerAudit({
    storeUrl: "https://no-kings-athletics.myshopify.com/",
    email: "Owner@NoKings.example",
    analysis: makeAnalysis(),
    payload: makePayload(),
    requestId: "request-001",
    prisma: fake.client,
    logger: { info() {}, warn() {} },
  });

  assert.equal(result.merchantId, "merchant_1");
  assert.equal(result.leadId, "lead_1");
  assert.equal(result.auditId, "audit_1");
  assert.equal(result.eventId, "event_1");
  assert.equal(result.packetLinkId, null);
  assert.equal(fake.state.merchant.normalizedShopifyDomain, "no-kings-athletics.myshopify.com");
  assert.equal(fake.state.lead.currentStage, "operator_review_required");
  assert.equal(fake.state.lead.legacyLeadAlias, "lead_no_kings_athletics_myshopify_com");
  assert.equal(fake.state.audits[0].status, "completed");
  assert.equal(fake.state.audits[0].auditSequence, 1);
  assert.deepEqual(fake.state.audits[0].findingsSnapshot.canonicalPayload, makePayload());
  assert.equal(fake.state.events[0].eventType, "audit_completed");
  assert.equal(fake.calls.some(([name]) => name === "shopifixerPacketLink.upsert"), false);
});

test("creates a packet link only when a matching Packet already exists", async () => {
  const fake = makeFakePrisma({
    packet: {
      packetId: "packet_no_kings_001",
      storeDomain: "no-kings-athletics.myshopify.com",
    },
  });
  const result = await persistShopifixerAudit({
    storeUrl: "no-kings-athletics.myshopify.com",
    email: "owner@nokings.example",
    analysis: makeAnalysis(),
    payload: makePayload(),
    packetId: "packet_no_kings_001",
    requestId: "request-002",
    prisma: fake.client,
    logger: { info() {}, warn() {} },
  });

  assert.equal(result.packetLinkId, "packet_link_1");
  assert.equal(fake.state.packetLinks[0].packetId, "packet_no_kings_001");
  assert.equal(fake.state.packetLinks[0].purpose, "execution");
  assert.equal(fake.state.packetLinks[0].status, "active");
});

test("reuses the same audit for a repeated request id", async () => {
  const fake = makeFakePrisma();
  const input = {
    storeUrl: "no-kings-athletics.myshopify.com",
    email: "owner@nokings.example",
    analysis: makeAnalysis(),
    payload: makePayload(),
    requestId: "request-idempotent",
    prisma: fake.client,
    logger: { info() {}, warn() {} },
  };

  const first = await persistShopifixerAudit(input);
  const second = await persistShopifixerAudit(input);

  assert.equal(first.auditId, "audit_1");
  assert.equal(second.auditId, "audit_1");
  assert.equal(fake.state.audits.length, 1);
  assert.equal(fake.state.events.length, 1);
});
