#!/usr/bin/env bash
set -euo pipefail

ROUTE_PATH="web/src/routes/billing_create.js"

echo "📦 Rewriting billing route at: $ROUTE_PATH"

cat > "$ROUTE_PATH" << 'FILEEOF'
import express from "express";
import shopify from "../../shopify.js";

const router = express.Router();

// BILLING_MODE controls stub vs real Shopify billing.
//   BILLING_MODE=stub     → always use fake confirmation URL
//   BILLING_MODE=shopify  → call Shopify appSubscriptionCreate
const BILLING_MODE = process.env.BILLING_MODE || "stub";

// ---------------- PLAN CONFIG ----------------

const PLANS = {
  starter: {
    key: "starter",
    name: "Starter",
    amount: 9.0,
    currency: "USD",
    interval: "EVERY_30_DAYS",
  },
  growth: {
    key: "growth",
    name: "Growth",
    amount: 29.0,
    currency: "USD",
    interval: "EVERY_30_DAYS",
  },
  scale: {
    key: "scale",
    name: "Scale",
    amount: 79.0,
    currency: "USD",
    interval: "EVERY_30_DAYS",
  },
};

function getPlan(planKeyRaw) {
  const key = typeof planKeyRaw === "string" ? planKeyRaw : "starter";
  return PLANS[key] || PLANS["starter"];
}

function buildStubConfirmationUrl(planKey) {
  const effective = typeof planKey === "string" ? planKey : "starter";
  return `https://abando.dev/billing/confirm-stub?plan=${encodeURIComponent(
    effective
  )}`;
}

function buildShopifyReturnUrl(shop, planKey) {
  const base =
    process.env.SHOPIFY_APP_URL ||
    process.env.APP_URL ||
    "https://abando.dev";
  return `${base}/shopify/billing/return?shop=${encodeURIComponent(
    shop
  )}&plan=${encodeURIComponent(planKey)}`;
}

// ---------------- STUB HANDLER ----------------

async function handleStubBilling(req, res) {
  const { planKey } = req.body || {};
  const plan = getPlan(planKey);
  const confirmationUrl = buildStubConfirmationUrl(plan.key);

  return res.json({
    ok: true,
    mode: "stub",
    stub: true,
    planKey: plan.key,
    confirmationUrl,
    debug: {
      received: planKey ?? null,
    },
  });
}

// ---------------- SHOPIFY SESSION HELPER ----------------

async function loadSessionForShop(shop) {
  if (!shop || typeof shop !== "string" || !shop.endsWith(".myshopify.com")) {
    return null;
  }

  // Standard @shopify/shopify-api pattern:
  // findSessionsByShop returns an array; take the most recent one.
  const sessions =
    (await shopify.sessionStorage.findSessionsByShop(shop)) || [];

  if (!sessions.length) return null;
  // Most recent should be last, but just take [0] for simplicity.
  return sessions[sessions.length - 1];
}

// ---------------- REAL SHOPIFY BILLING ----------------

async function handleRealShopifyBilling(req, res) {
  const shopParam =
    typeof req.query.shop === "string" ? req.query.shop : null;

  if (!shopParam || !shopParam.endsWith(".myshopify.com")) {
    return res.status(400).json({
      ok: false,
      mode: "shopify",
      error:
        "Missing or invalid ?shop=your-store.myshopify.com in querystring.",
    });
  }

  const { planKey } = req.body || {};
  const plan = getPlan(planKey);

  const session = await loadSessionForShop(shopParam);
  if (!session) {
    return res.status(401).json({
      ok: false,
      mode: "shopify",
      error:
        "No Shopify session found for this shop. Install the app and try again.",
    });
  }

  const client = new shopify.api.clients.Graphql({ session });

  const returnUrl = buildShopifyReturnUrl(shopParam, plan.key);
  const testFlag = process.env.SHOPIFY_BILLING_TEST === "false" ? false : true;

  const mutation = `
    mutation appSubscriptionCreate(
      $name: String!
      $lineItems: [AppSubscriptionLineItemInput!]!
      $returnUrl: URL!
      $test: Boolean!
    ) {
      appSubscriptionCreate(
        name: $name
        lineItems: $lineItems
        returnUrl: $returnUrl
        test: $test
      ) {
        appSubscription {
          id
          name
          status
        }
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    name: `${plan.name} plan`,
    returnUrl,
    test: testFlag,
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: plan.amount,
              currencyCode: plan.currency,
            },
            interval: plan.interval,
          },
        },
      },
    ],
  };

  try {
    const response = await client.query({
      data: { query: mutation, variables },
    });

    const root =
      response?.body?.data?.appSubscriptionCreate || null;

    const userErrors = root?.userErrors || [];
    const confirmationUrl = root?.confirmationUrl || null;

    if (userErrors.length || !confirmationUrl) {
      console.error(
        "[billing] Shopify appSubscriptionCreate userErrors",
        JSON.stringify(userErrors, null, 2)
      );

      return res.status(502).json({
        ok: false,
        mode: "shopify",
        error: "Shopify appSubscriptionCreate failed.",
        userErrors,
      });
    }

    return res.json({
      ok: true,
      mode: "shopify",
      planKey: plan.key,
      confirmationUrl,
      subscription: root.appSubscription ?? null,
    });
  } catch (err) {
    console.error(
      "[billing] Exception calling Shopify appSubscriptionCreate",
      err
    );
    return res.status(500).json({
      ok: false,
      mode: "shopify",
      error: "Exception while calling Shopify billing.",
    });
  }
}

// ---------------- MAIN ROUTE ----------------

router.post("/create", async (req, res) => {
  try {
    if (BILLING_MODE === "shopify") {
      return await handleRealShopifyBilling(req, res);
    }

    // Default: stub for dev safety
    return await handleStubBilling(req, res);
  } catch (err) {
    console.error("[billing] /billing/create unexpected error", err);
    return res.status(500).json({
      ok: false,
      error: "Billing create failed unexpectedly.",
    });
  }
});

export default router;
FILEEOF

echo "✅ Clean billing route installed at: $ROUTE_PATH"
