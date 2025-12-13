#!/usr/bin/env bash
set -euo pipefail

ROUTE_PATH="web/src/routes/billing_create.js"

echo "📦 Installing billing switcher with REAL Shopify skeleton at: $ROUTE_PATH"

cat > "$ROUTE_PATH" << 'FILEEOF'
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// BILLING_MODE:
//   - "stub"    → always-ok dev stub (safe default)
//   - "shopify" → real Shopify appSubscriptionCreate flow (to be wired)
const BILLING_MODE = process.env.BILLING_MODE ?? "stub";

// ---------------- STUB HANDLER ----------------

async function handleStubBilling(req, res) {
  const { planKey } = req.body || {};
  const effectivePlan = planKey || "starter";

  const confirmationUrl =
    `https://abando.dev/billing/confirm-stub?plan=${encodeURIComponent(effectivePlan)}`;

  return res.json({
    ok: true,
    mode: "stub",
    stub: true,
    planKey: effectivePlan,
    confirmationUrl,
    debug: {
      received: planKey ?? null,
    },
  });
}

// ---------------- REAL SHOPIFY BILLING (SKELETON) ----------------
//
// This uses the same session storage / token you already wired in
// web/src/index.js (Redis-based and keyed by shop). The logic here:
//
//   1) Extract ?shop= from the request (or header/body if you prefer later)
//   2) Look up the stored access token from your existing loadShop / Redis
//   3) Call Shopify Admin GraphQL appSubscriptionCreate
//   4) Return confirmationUrl back to the frontend
//

async function handleRealShopifyBilling(req, res) {
  try {
    const { planKey } = req.body || {};
    const effectivePlanKey = planKey || "starter";

    const shop = req.query.shop || req.headers["x-shopify-shop-domain"];

    if (!shop || typeof shop !== "string" || !shop.endsWith(".myshopify.com")) {
      return res.status(400).json({
        ok: false,
        mode: "shopify",
        error: "Missing or invalid shop domain. Expected ?shop=your-store.myshopify.com or header x-shopify-shop-domain.",
      });
    }

    // --- 2) Load stored Shopify token using your existing helper ---
    // NOTE: This expects you've got a helper similar to loadShop that returns
    // { accessToken } for the shop. Adjust the import/path if needed.
    const { loadShop } = await import("../lib/loadshops.js").catch(() => ({ loadShop: null }));

    if (!loadShop) {
      return res.status(500).json({
        ok: false,
        mode: "shopify",
        error: "loadShop helper not found. Wire your existing Shopify token loader here.",
      });
    }

    const shopState = await loadShop(shop);
    if (!shopState || !shopState.accessToken) {
      return res.status(401).json({
        ok: false,
        mode: "shopify",
        error: "No stored access token for this shop. Install flow must complete first.",
      });
    }

    const accessToken = shopState.accessToken;

    // --- 3) Map planKey → price + trial days (example tiers) ---
    const plans = {
      starter: { price: 9.0, trialDays: 14 },
      growth:  { price: 29.0, trialDays: 14 },
      scale:   { price: 79.0, trialDays: 14 },
    };

    const planConfig = plans[effectivePlanKey] ?? plans.starter;
    const { price, trialDays } = planConfig;

    // --- 4) Build GraphQL mutation payload ---
    const mutation = `
      mutation AppSubscriptionCreate(
        $name: String!
        $trialDays: Int
        $returnUrl: URL!
        $lineItems: [AppSubscriptionLineItemInput!]!
      ) {
        appSubscriptionCreate(
          name: $name
          trialDays: $trialDays
          returnUrl: $returnUrl
          lineItems: $lineItems
        ) {
          appSubscription {
            id
            name
            status
            trialDays
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `;

    const returnUrl =
      `${process.env.SHOPIFY_APP_URL}/shopify/billing/return?shop=${encodeURIComponent(shop)}`;

    const variables = {
      name: `Abando ${effectivePlanKey} plan`,
      trialDays,
      returnUrl,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: {
                amount: price,
                currencyCode: "USD",
              },
            },
          },
        },
      ],
    };

    // --- 5) Call Shopify Admin GraphQL directly via fetch ---
    const resp = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const json = await resp.json();

    const root = json.data?.appSubscriptionCreate;
    const confirmationUrl = root?.confirmationUrl;
    const userErrors = root?.userErrors ?? [];

    if (!confirmationUrl) {
      console.error("[billing] appSubscriptionCreate errors:", JSON.stringify(userErrors));
      return res.status(500).json({
        ok: false,
        mode: "shopify",
        error: "Shopify did not return a confirmationUrl.",
        userErrors,
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

echo "✅ Billing switcher with real Shopify skeleton installed at: $ROUTE_PATH"
