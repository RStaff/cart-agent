import test from "node:test";
import assert from "node:assert/strict";
import pkg from "@prisma/client";
import {
  BLUEPRINT_OFFER,
  createBlueprintPaymentAuthority,
} from "./blueprintPaymentAuthority.js";

const { PrismaClient } = pkg;

function verifiedSession(id) {
  return {
    id,
    object: "checkout.session",
    livemode: true,
    payment_status: "paid",
    mode: "payment",
    payment_link: BLUEPRINT_OFFER.paymentLinkId,
    amount_total: 75000,
    currency: "usd",
    customer: "cus_disposable_test",
    payment_intent: {
      id: "pi_disposable_test",
      object: "payment_intent",
      livemode: true,
      status: "succeeded",
      amount_received: 75000,
      currency: "usd",
      latest_charge: {
        id: "ch_disposable_test",
        object: "charge",
        paid: true,
        status: "succeeded",
        amount: 75000,
        currency: "usd",
        balance_transaction: {
          id: "txn_disposable_test",
          object: "balance_transaction",
          created: 1791154800,
        },
      },
    },
    customer_details: { email: "disposable@example.test", name: "Disposable Test", phone: null },
    client_reference_id: null,
    metadata: {},
    line_items: {
      has_more: false,
      data: [{ quantity: 1, amount_total: 75000, price: {
        id: BLUEPRINT_OFFER.priceId,
        type: "one_time",
        unit_amount: 75000,
        currency: "usd",
        product: BLUEPRINT_OFFER.productId,
      } }],
    },
  };
}

function paidEvent(id, sessionValue, type = "checkout.session.completed") {
  return {
    id,
    type,
    livemode: true,
    created: 1791151200,
    data: { object: sessionValue },
  };
}

test("PostgreSQL atomically persists one engagement under sequential and concurrent replay", async (t) => {
  if (!process.env.DATABASE_URL) { t.skip("DATABASE_URL not provided"); return; }
  const prisma = new PrismaClient();
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const sessionId = `cs_live_disposable_${suffix}`;
  const stripeSession = verifiedSession(sessionId);
  const stripeClient = { checkout: { sessions: { retrieve: async () => stripeSession } } };
  const authority = createBlueprintPaymentAuthority({ prisma, stripeClient });
  const firstEvent = paidEvent(`evt_disposable_${suffix}`, stripeSession);
  try {
    const first = await authority.accept(firstEvent);
    const sequential = await authority.accept(firstEvent);
    const concurrentEvents = Array.from({ length: 6 }, (_, index) =>
      paidEvent(`evt_concurrent_${suffix}_${index}`, stripeSession, "checkout.session.async_payment_succeeded"));
    const concurrent = await Promise.all(concurrentEvents.map((item) => authority.accept(item)));

    assert.equal(first.duplicate, false);
    assert.equal(sequential.duplicate, true);
    assert.equal(concurrent.every((item) => item.duplicate && item.engagementId === first.engagementId), true);
    assert.equal(await prisma.staffordosBlueprintEngagement.count({ where: { stripeSessionId: sessionId } }), 1);
    assert.equal(await prisma.staffordosBlueprintPaymentEvent.count({ where: { stripeSessionId: sessionId } }), 1);
    const stored = await prisma.staffordosBlueprintEngagement.findUnique({ where: { stripeSessionId: sessionId } });
    assert.equal(stored.inquiryId, null);
    assert.equal(stored.clientId, null);
    assert.equal(stored.associationStatus, "PENDING_REVIEW");
  } finally {
    await prisma.staffordosBlueprintPaymentEvent.deleteMany({ where: { stripeSessionId: sessionId } });
    await prisma.staffordosBlueprintEngagement.deleteMany({ where: { stripeSessionId: sessionId } });
    await prisma.$disconnect();
  }
});
