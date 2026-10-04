import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { installStripeWebhook } from "./stripeWebhook.esm.js";
import { BLUEPRINT_OFFER } from "../lib/blueprintPaymentAuthority.js";

async function withServer(app, fn) {
  const server = await new Promise((resolve) => {
    const value = app.listen(0, "127.0.0.1", () => resolve(value));
  });
  try {
    const address = server.address();
    return await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("webhook rejects invalid signatures before provider retrieval or persistence", async () => {
  const priorSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_only";
  let retrieved = false;
  let persisted = false;
  const stripeClient = {
    webhooks: { constructEvent: () => { throw new Error("invalid signature"); } },
    checkout: { sessions: { retrieve: async () => { retrieved = true; } } },
  };
  const prismaClient = { $transaction: async () => { persisted = true; } };
  const application = express();
  installStripeWebhook(application, { stripeClient, prismaClient });
  try {
    await withServer(application, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/stripe/webhook`, {
        method: "POST",
        headers: { "content-type": "application/json", "stripe-signature": "bad" },
        body: "{}",
      });
      assert.equal(response.status, 400);
    });
    assert.equal(retrieved, false);
    assert.equal(persisted, false);
  } finally {
    if (priorSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = priorSecret;
  }
});

test("webhook returns retryable failure and never acceptance when durable storage fails", async () => {
  const priorSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_only";
  const checkoutSession = {
    id: "cs_live_storage_failure",
    object: "checkout.session",
    livemode: true,
    payment_status: "paid",
    mode: "payment",
    payment_link: BLUEPRINT_OFFER.paymentLinkId,
    amount_total: 75000,
    currency: "usd",
    payment_intent: {
      id: "pi_storage_failure",
      object: "payment_intent",
      livemode: true,
      status: "succeeded",
      amount_received: 75000,
      currency: "usd",
      latest_charge: {
        id: "ch_storage_failure",
        object: "charge",
        paid: true,
        status: "succeeded",
        amount: 75000,
        currency: "usd",
        balance_transaction: {
          id: "txn_storage_failure",
          object: "balance_transaction",
          created: 1791154800,
        },
      },
    },
    customer_details: { email: "storage-failure@example.test" },
    metadata: {},
    line_items: { has_more: false, data: [{
      quantity: 1,
      amount_total: 75000,
      price: {
        id: BLUEPRINT_OFFER.priceId,
        type: "one_time",
        unit_amount: 75000,
        currency: "usd",
        product: BLUEPRINT_OFFER.productId,
      },
    }] },
  };
  const stripeClient = {
    webhooks: { constructEvent: () => ({
      id: "evt_storage_failure",
      type: "checkout.session.completed",
      livemode: true,
      created: 1791151200,
      data: { object: checkoutSession },
    }) },
    checkout: { sessions: { retrieve: async () => checkoutSession } },
  };
  const prismaClient = {
    staffordosBlueprintPaymentEvent: { findFirst: async () => null },
    $transaction: async () => { throw new Error("database unavailable"); },
  };
  const application = express();
  installStripeWebhook(application, { stripeClient, prismaClient });
  try {
    await withServer(application, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/stripe/webhook`, {
        method: "POST",
        headers: { "content-type": "application/json", "stripe-signature": "valid" },
        body: "{}",
      });
      assert.equal(response.status, 500);
      const body = await response.json();
      assert.deepEqual(body, { ok: false, error: "blueprint_payment_persistence_failed" });
      assert.equal(Object.hasOwn(body, "blueprintAccepted"), false);
    });
  } finally {
    if (priorSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = priorSecret;
  }
});
