#!/usr/bin/env bash
set -euo pipefail

ROUTE_PATH="web/src/routes/billing_create.js"

echo "📦 Installing REAL Shopify billing handler into: $ROUTE_PATH"

cat > "$ROUTE_PATH" << 'FILEEOF'
import express from "express";
import shopify from "../../shopify.js";

const router = express.Router();

// Default to stub in dev; set BILLING_MODE=shopify in env for real billing
const BILLING_MODE = process.env.BILLING_MODE ?? "stub";

// ---------------- PLAN CONFIG ----------------

function getPlanConfig(rawPlanKey) {
  const planKey = rawPlanKey || "starter";

  const plans = {
    starter: {
      name: "Abando Starter",
      amount: 19.0,
      currencyCode: "USD",
      interval: "EVERY_30_DAYS",
      trialDays: 14,
    },
    growth: {
      name: "Abando Growth",
      amount: 49.0,
      currencyCode: "USD",
      interval: "EVERY_30_DAYS",
      trialDays: 14,
    },
    scale: {
      name: "Abando Scale",
      amount: 99.0,
      currencyCode: "USD",
      interval: "EVERY_30_DAYS",
      trialDays: 14,
    },
  };

  const config = plans[planKey] ?? plans.starter;
  const effectiveKey = plans[planKey] ? planKey : "starter";

  return { planKey: effectiveKey, config };
}

// ---------------- SESSION LOADER ----------------

async function getOfflineSessionForShop(shopDomainRaw) {
  const shop = String(shopDomainRaw || "").toLowerCase();

  if (!shop.endsWith(".myshopify.com")) {
    throw new Error("Invalid shop domain");
  }

  // Uses the standard Shopify Node API session helpers.
  const id = shopify.api.session.getOfflineId(shop);
  const session = await shopify.api.sessionStorage.loadSession(id);

  if (!session) {
    throw new Error(`No offline session found for ${shop}`);
  }

  return session;
}

// ---------------- STUB BILLING (SAFE DEFAULT) ----------------

async function handleStubBilling(req, res) {
  const { planKey } = req.body || {};
  const { planKey: effectivePlanKey } = getPlanConfig(planKey);

  const confirmationUrl =
    `https://abando.dev/billing/confirm-stub?plan=${encodeURIComponent(effectivePlanKey)}`;

  return res.json({
    ok: true,
    mode: "stub",
    stub: true,
    planKey: effectivePlanKey,
    confirmationUrl,
    debug: {
      received: planKey ?? null,
    },
  });
}

// ---------------- REAL SHOPIFY BILLING ----------------

async function handleRealShopifyBilling(req, res) {
  const { planKey } = req.body || {};
  const { planKey: effectivePlanKey, config } = getPlanConfig(planKey);
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).json({
      ok: false,
      mode: "shopify",
      error: "Missing ?shop=your-store.myshopify.com",
    });
  }

  let session;
  try {
    session = await getOfflineSessionForShop(shop);
  } catch (err) {
    console.error("[billing] failed to load offline session", err);
    return res.status(400).json({
      ok: false,
      mode: "shopify",
      error: "Could not load offline session for shop (offline session missing).",
    });
  }

  const client = new shopify.api.clients.Graphql({ session });

  const appUrl =
    process.env.SHOPIFY_APP_URL ??
    process.env.APP_URL ??
    "https://abando.ai";

  const returnUrl =
    `${appUrl}/shopify/billing/return?shop=${encodeURIComponent(String(shop))}`;

  const mutation = `
    mutation AppSubscriptionCreate(
      $name: String!,
      $lineItems: [AppSubscriptionLineItemInput!]!,
      $returnUrl: URL!,
      $trialDays: Int,
      $test: Boolean!
    ) {
      appSubscriptionCreate(
        name: $name,
        lineItems: $lineItems,
        returnUrl: $returnUrl,
        trialDays: $trialDays,
        test: $test
      ) {
        userErrors {
          field
          message
        }
        confirmationUrl
        appSubscription {
          id
          status
        }
      }
    }
  `;

  const variables = {
    name: config.name,
    trialDays: config.trialDays,
    test: process.env.SHOPIFY_BILLING_TEST === "false" ? false : true,
    returnUrl,
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: config.amount,
              currencyCode: config.currencyCode,
            },
            interval: config.interval,
          },
        },
      },
    ],
  };

  try {
    const result = await client.query({
      data: {
        query: mutation,
        variables,
      },
    });

    const root = result.body?.data?.appSubscriptionCreate;

    if (!root) {
      console.error("[billing] Missing appSubscriptionCreate in response", result.body);
      return res.status(500).json({
        ok: false,
        mode: "shopify",
        error: "Unexpected Shopify response (no appSubscriptionCreate).",
      });
    }

    if (root.userErrors && root.userErrors.length) {
      console.error("[billing] Shopify appSubscriptionCreate userErrors", root.userErrors);
      return res.status(400).json({
        ok: false,
        mode: "shopify",
        error: "Shopify billing returned userErrors.",
        userErrors: root.userErrors,
      });
    }

    if (!root.confirmationUrl) {
      return res.status(500).json({
        ok: false,
        mode: "shopify",
        error: "No confirmationUrl returned from Shopify.",
      });
    }

    return res.json({
      ok: true,
      mode: "shopify",
      planKey: effectivePlanKey,
      confirmationUrl: root.confirmationUrl,
      subscription: root.appSubscription ?? null,
    });
  } catch (err) {
    console.error("[billing] Exception calling Shopify appSubscriptionCreate", err);
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

echo "✅ REAL Shopify billing handler installed into: $ROUTE_PATH"
