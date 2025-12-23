#!/usr/bin/env bash
set -euo pipefail

ROUTE_PATH="web/src/routes/billing_create.js"

echo "📦 Installing REAL Shopify billing handler v2 into: $ROUTE_PATH"

cat > "$ROUTE_PATH" << 'FILEEOF'
import express from "express";
import shopify from "../../shopify.js";

const router = express.Router();

// Mode switch: "stub" (default) or "shopify"
const BILLING_MODE = process.env.BILLING_MODE === "shopify" ? "shopify" : "stub";

// Per-plan config (can later be moved to env or DB)
const PLAN_CONFIG = {
  starter: {
    name: "Starter",
    price: Number(process.env.SHOPIFY_BILLING_STARTER_PRICE ?? 9),
    interval: process.env.SHOPIFY_BILLING_INTERVAL ?? "EVERY_30_DAYS",
  },
  growth: {
    name: "Growth",
    price: Number(process.env.SHOPIFY_BILLING_GROWTH_PRICE ?? 29),
    interval: process.env.SHOPIFY_BILLING_INTERVAL ?? "EVERY_30_DAYS",
  },
  scale: {
    name: "Scale",
    price: Number(process.env.SHOPIFY_BILLING_SCALE_PRICE ?? 79),
    interval: process.env.SHOPIFY_BILLING_INTERVAL ?? "EVERY_30_DAYS",
  },
};

const VALID_PLANS = Object.keys(PLAN_CONFIG);

// -------------- STUB HANDLER (DEV-SAFE) ----------------

async function handleStubBilling(req, res) {
  const { planKey } = req.body || {};
  const effectivePlanKey = VALID_PLANS.includes(planKey) ? planKey : "starter";

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

// -------------- HELPER: LOAD SHOP SESSION ----------------

// Uses the same session storage as your /shopify/callback flow.
async function loadShopSession(shop) {
  // Offline session ID for this shop
  const sessionId = shopify.api.session.getOfflineId(shop);
  const session = await shopify.config.sessionStorage.loadSession(sessionId);

  if (!session) {
    throw new Error(`No offline session found for shop ${shop}`);
  }
  return session;
}

// -------------- REAL SHOPIFY BILLING HANDLER --------------

async function handleRealShopifyBilling(req, res) {
  const shop = (req.query.shop || req.body?.shop || "").toString();

  if (!shop || !shop.endsWith(".myshopify.com")) {
    return res.status(400).json({
      ok: false,
      mode: "shopify",
      error: "Missing or invalid ?shop=your-store.myshopify.com",
    });
  }

  const { planKey } = req.body || {};
  const effectivePlanKey = VALID_PLANS.includes(planKey) ? planKey : "starter";
  const plan = PLAN_CONFIG[effectivePlanKey];

  if (!plan) {
    return res.status(400).json({
      ok: false,
      mode: "shopify",
      error: `Unknown planKey '${planKey}'. Valid: ${VALID_PLANS.join(", ")}`,
    });
  }

  try {
    const session = await loadShopSession(shop);

    const client = new shopify.api.clients.Graphql({ session });

    const returnUrlBase =
      process.env.SHOPIFY_APP_URL || process.env.APP_URL || "https://abando.dev";

    const returnUrl =
      `${returnUrlBase}/shopify/billing/return?shop=${encodeURIComponent(shop)}&plan=${encodeURIComponent(effectivePlanKey)}`;

    const mutation = `
      mutation AppSubscriptionCreate(
        $name: String!
        $lineItems: [AppSubscriptionLineItemInput!]!
        $returnUrl: URL!
        $test: Boolean
      ) {
        appSubscriptionCreate(
          name: $name
          lineItems: $lineItems
          returnUrl: $returnUrl
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
      name: \`\${plan.name} plan\`,
      returnUrl,
      test: process.env.SHOPIFY_BILLING_TEST === "false" ? false : true,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              interval: plan.interval,
              price: {
                amount: plan.price,
                currencyCode: process.env.SHOPIFY_BILLING_CURRENCY || "USD",
              },
            },
          },
        },
      ],
    };

    const response = await client.query({ data: { query: mutation, variables } });

    const root = response.body.data?.appSubscriptionCreate;

    if (!root) {
      console.error("[billing] appSubscriptionCreate missing in response", response.body);
      return res.status(500).json({
        ok: false,
        mode: "shopify",
        error: "Shopify billing response missing appSubscriptionCreate.",
      });
    }

    if (root.userErrors && root.userErrors.length > 0) {
      console.error("[billing] appSubscriptionCreate userErrors", root.userErrors);
      return res.status(400).json({
        ok: false,
        mode: "shopify",
        error: "Shopify billing returned userErrors.",
        userErrors: root.userErrors,
      });
    }

    const confirmationUrl = root.confirmationUrl;

    if (!confirmationUrl) {
      console.error("[billing] No confirmationUrl returned by appSubscriptionCreate", root);
      return res.status(500).json({
        ok: false,
        mode: "shopify",
        error: "No confirmationUrl returned by Shopify billing.",
      });
    }

    return res.json({
      ok: true,
      mode: "shopify",
      planKey: effectivePlanKey,
      confirmationUrl,
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

echo "✅ REAL Shopify billing handler v2 installed into: $ROUTE_PATH"
