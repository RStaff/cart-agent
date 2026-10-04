import test from "node:test";
import assert from "node:assert/strict";
import {
  BLUEPRINT_OFFER,
  BlueprintPaymentRejection,
  createBlueprintPaymentAuthority,
} from "./blueprintPaymentAuthority.js";

function session(overrides = {}) {
  return {
    id: "cs_live_blueprint_1",
    object: "checkout.session",
    livemode: true,
    payment_status: "paid",
    mode: "payment",
    payment_link: BLUEPRINT_OFFER.paymentLinkId,
    amount_total: 75000,
    currency: "usd",
    customer: "cus_buyer_evidence",
    payment_intent: {
      id: "pi_payment_evidence",
      object: "payment_intent",
      livemode: true,
      status: "succeeded",
      amount_received: 75000,
      currency: "usd",
      latest_charge: {
        id: "ch_payment_evidence",
        object: "charge",
        paid: true,
        status: "succeeded",
        amount: 75000,
        currency: "usd",
        balance_transaction: {
          id: "txn_payment_evidence",
          object: "balance_transaction",
          created: 1791154800,
        },
      },
    },
    customer_details: { email: "buyer@example.test", name: "Blueprint Buyer", phone: null },
    client_reference_id: null,
    metadata: {},
    line_items: {
      has_more: false,
      data: [{
        quantity: 1,
        amount_total: 75000,
        price: {
          id: BLUEPRINT_OFFER.priceId,
          type: "one_time",
          unit_amount: 75000,
          currency: "usd",
          product: { id: BLUEPRINT_OFFER.productId },
        },
      }],
    },
    ...overrides,
  };
}

function event(sessionValue = session(), overrides = {}) {
  return {
    id: "evt_blueprint_1",
    type: "checkout.session.completed",
    livemode: true,
    created: 1791151200,
    data: { object: sessionValue },
    ...overrides,
  };
}

function memoryPrisma({ failCreate = false } = {}) {
  const receipts = [];
  const engagements = [];
  return {
    receipts,
    engagements,
    staffordosBlueprintPaymentEvent: {
      async findFirst({ where }) {
        const eventId = where.OR[0].stripeEventId;
        const sessionId = where.OR[1].stripeSessionId;
        const receipt = receipts.find((row) => row.stripeEventId === eventId || row.stripeSessionId === sessionId);
        if (!receipt) return null;
        return { ...receipt, engagement: engagements.find((row) => row.id === receipt.engagementId) };
      },
    },
    async $transaction(fn) {
      if (failCreate) throw new Error("database unavailable");
      return fn({
        staffordosBlueprintEngagement: {
          async create({ data }) {
            if (engagements.some((row) => row.stripeSessionId === data.stripeSessionId)) {
              throw Object.assign(new Error("unique"), { code: "P2002" });
            }
            const engagement = { ...data, id: `eng_${engagements.length + 1}` };
            delete engagement.paymentEvent;
            engagements.push(engagement);
            receipts.push({
              ...data.paymentEvent.create,
              engagementId: engagement.id,
            });
            return { ...engagement, paymentEvent: receipts.at(-1) };
          },
        },
      });
    },
  };
}

function authority({ retrieved = session(), prisma = memoryPrisma(), retrieveError = null } = {}) {
  let calls = 0;
  const stripeClient = {
    checkout: { sessions: { retrieve: async (_id, options) => {
      calls += 1;
      assert.deepEqual(options, {
        expand: ["line_items.data.price.product", "payment_intent.latest_charge.balance_transaction"],
      });
      if (retrieveError) throw retrieveError;
      return retrieved;
    } } },
  };
  return {
    service: createBlueprintPaymentAuthority({
      prisma,
      stripeClient,
      now: () => new Date("2026-10-05T00:00:00.000Z"),
    }),
    prisma,
    calls: () => calls,
  };
}

test("accepts verified asynchronous success without an inquiry and persists buyer evidence", async () => {
  const fixture = authority();
  const result = await fixture.service.accept(event(session(), {
    id: "evt_async_1",
    type: "checkout.session.async_payment_succeeded",
  }));
  assert.equal(result.accepted, true);
  assert.equal(result.duplicate, false);
  assert.equal(fixture.prisma.engagements[0].associationStatus, "PENDING_REVIEW");
  assert.equal(fixture.prisma.engagements[0].inquiryId, null);
  assert.equal(fixture.prisma.engagements[0].clientId, null);
  assert.equal(fixture.prisma.engagements[0].buyerEmail, "buyer@example.test");
  assert.equal(fixture.prisma.engagements[0].claimedInquiryReference, null);
  assert.equal(fixture.prisma.engagements[0].paidAt.toISOString(), "2026-10-04T23:00:00.000Z");
  assert.equal(fixture.prisma.receipts[0].providerCreatedAt.toISOString(), "2026-10-04T22:00:00.000Z");
  assert.equal(fixture.prisma.receipts[0].receivedAt.toISOString(), "2026-10-05T00:00:00.000Z");
});

test("rejects unpaid and wrong-offer sessions", async (t) => {
  for (const [name, retrieved, code] of [
    ["unpaid", session({ payment_status: "unpaid" }), "BLUEPRINT_SESSION_NOT_PAID"],
    ["wrong link", session({ payment_link: "plink_other" }), "BLUEPRINT_PAYMENT_LINK_MISMATCH"],
    ["wrong product", session({ line_items: { has_more: false, data: [{ quantity: 1, amount_total: 75000, price: { id: BLUEPRINT_OFFER.priceId, type: "one_time", unit_amount: 75000, currency: "usd", product: "prod_other" } }] } }), "BLUEPRINT_PRODUCT_MISMATCH"],
    ["adjusted quantity", session({ line_items: { has_more: false, data: [{ quantity: 2, amount_total: 75000, price: { id: BLUEPRINT_OFFER.priceId, type: "one_time", unit_amount: 75000, currency: "usd", product: BLUEPRINT_OFFER.productId } }] } }), "BLUEPRINT_QUANTITY_MISMATCH"],
    ["unsucceeded payment intent", session({ payment_intent: { ...session().payment_intent, status: "processing" } }), "BLUEPRINT_PAYMENT_INTENT_NOT_SUCCEEDED"],
    ["missing settlement evidence", session({ payment_intent: { ...session().payment_intent, latest_charge: { ...session().payment_intent.latest_charge, balance_transaction: null } } }), "BLUEPRINT_SETTLEMENT_EVIDENCE_REQUIRED"],
  ]) {
    await t.test(name, async () => {
      const fixture = authority({ retrieved });
      await assert.rejects(() => fixture.service.accept(event()), (error) => error instanceof BlueprintPaymentRejection && error.code === code);
      assert.equal(fixture.prisma.engagements.length, 0);
    });
  }
});

test("sequential duplicate event and session return the existing engagement without mutation", async () => {
  const fixture = authority();
  const first = await fixture.service.accept(event());
  const repeatedEvent = await fixture.service.accept(event());
  const repeatedSession = await fixture.service.accept(event(session(), { id: "evt_blueprint_2" }));
  assert.equal(first.duplicate, false);
  assert.equal(repeatedEvent.duplicate, true);
  assert.equal(repeatedSession.duplicate, true);
  assert.equal(repeatedEvent.engagementId, first.engagementId);
  assert.equal(repeatedSession.engagementId, first.engagementId);
  assert.equal(fixture.prisma.engagements.length, 1);
  assert.equal(fixture.prisma.receipts.length, 1);
  assert.equal(fixture.calls(), 1);
});

test("provider and database failures remain retryable and never return acceptance", async () => {
  const providerFailure = authority({ retrieveError: new Error("provider unavailable") });
  await assert.rejects(() => providerFailure.service.accept(event()), /provider unavailable/);
  assert.equal(providerFailure.prisma.engagements.length, 0);

  const databaseFailure = authority({ prisma: memoryPrisma({ failCreate: true }) });
  await assert.rejects(() => databaseFailure.service.accept(event()), /database unavailable/);
  assert.equal(databaseFailure.prisma.engagements.length, 0);
});

test("non-Blueprint ShopiFixer checkout bypasses Blueprint provider and database work", async () => {
  const failingPrisma = {
    staffordosBlueprintPaymentEvent: { findFirst: async () => { throw new Error("must not query"); } },
    $transaction: async () => { throw new Error("must not write"); },
  };
  const fixture = authority({ prisma: failingPrisma });
  const result = await fixture.service.accept(event(session({ payment_link: "plink_shopifixer" })));
  assert.deepEqual(result, { handled: false });
  assert.equal(fixture.calls(), 0);
});
