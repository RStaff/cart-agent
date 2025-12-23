import express from "express";
import shopify from "../../shopify.js";

import { activateBilling } from "../db/billingState.js";
const router = express.Router();

// BILLING_MODE controls behavior:
//  - "stub"    => always returns a fake confirmation URL (safe for dev)
//  - "shopify" => calls Shopify appSubscriptionCreate via GraphQL
const BILLING_MODE = process.env.BILLING_MODE ?? "stub";

// Simple plan config for appSubscriptionCreate
const PLANS = {
  starter: {
    name: "Starter",
    price: 19,
    interval: "EVERY_30_DAYS",
    trialDays: 14,
  },
  growth: {
    name: "Growth",
    price: 49,
    interval: "EVERY_30_DAYS",
    trialDays: 14,
  },
  scale: {
    name: "Scale",
    price: 99,
    interval: "EVERY_30_DAYS",
    trialDays: 14,
  },
};

function resolvePlan(planKeyRaw) {
  const planKey = planKeyRaw || "starter";
  return {
    key: planKey in PLANS ? planKey : "starter",
    config: PLANS[planKey] || PLANS.starter,
  };
}

// ---------------- DEV STUB BILLING ----------------

async function handleStubBilling(req, res) {
  const shop = String(req.query.shop || req.body?.shop || "").trim().toLowerCase();
  if (!shop || !shop.endsWith(".myshopify.com")) {
    return res.status(400).json({
      ok: false,
      mode: "stub",
      error: "Missing or invalid ?shop=your-store.myshopify.com",
    });
  }

  const { planKey } = req.body || {};
  const { key: effectiveKey } = resolvePlan(planKey);

  // same-origin, includes shop + plan
  const confirmationUrl =
    `/billing/confirm-stub?shop=${encodeURIComponent(shop)}&plan=${encodeURIComponent(effectiveKey)}`;

  return res.json({
    ok: true,
    mode: "stub",
    stub: true,
    planKey: effectiveKey,
    confirmationUrl,
    debug: {
      received: planKey ?? null,
      shop,
    },
  });
}

// ---------------- REAL SHOPIFY BILLING ----------------

// Load an active Shopify session for this shop using the app's session storage.
async function loadSessionForShop(shop) {
  const sessions =
    await shopify.config.sessionStorage.findSessionsByShop(shop);

  if (!sessions || sessions.length === 0) {
    throw new Error(`No active Shopify session found for shop ${shop}`);
  }

  return sessions[0];
}

async function handleRealShopifyBilling(req, res) {
  try {
    const shop = String(req.query.shop || "").trim();
    if (!shop || !shop.endsWith(".myshopify.com")) {
      return res.status(400).json({
        ok: false,
        mode: "shopify",
        error: "Missing or invalid ?shop=your-store.myshopify.com",
      });
    }

    const { planKey } = req.body || {};
    const { key: effectivePlanKey, config: plan } = resolvePlan(planKey);

    let session;
    try {
      session = await loadSessionForShop(shop);
    } catch (err) {
      console.error("[billing] loadSessionForShop error", err);
      return res.status(401).json({
        ok: false,
        mode: "shopify",
        error: "No active Shopify session for shop. Reinstall the app.",
      });
    }

    const client = new shopify.api.clients.Graphql({ session });

    const appUrl =
      process.env.SHOPIFY_APP_URL ||
      process.env.APP_URL ||
      "https://abando.ai";

    const returnUrl =
      `${appUrl}/shopify/billing/return?shop=${encodeURIComponent(shop)}`;

    const mutation = `
      mutation appSubscriptionCreate(
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
          confirmationUrl
          userErrors {
            field
            message
          }
          appSubscription {
            id
            name
            status
          }
        }
      }
    `;

    const variables = {
      name: `${plan.name} plan`,
      returnUrl,
      test: process.env.SHOPIFY_BILLING_TEST === "true",
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: {
                amount: plan.price,
                currencyCode: "USD",
              },
              interval: plan.interval,
              trialDays: plan.trialDays,
            },
          },
        },
      ],
    };

    const gqlResponse = await client.query({
      data: {
        query: mutation,
        variables,
      },
    });

    const root =
      gqlResponse.body?.data?.appSubscriptionCreate ?? null;

    if (!root) {
      console.error("[billing] Missing appSubscriptionCreate root", gqlResponse.body);
      return res.status(502).json({
        ok: false,
        mode: "shopify",
        error: "No response from Shopify appSubscriptionCreate.",
      });
    }

    if (root.userErrors && root.userErrors.length > 0) {
      console.error(
        "[billing] appSubscriptionCreate userErrors",
        JSON.stringify(root.userErrors)
      );
      return res.status(400).json({
        ok: false,
        mode: "shopify",
        error: "Shopify returned billing errors.",
        userErrors: root.userErrors,
      });
    }

    if (!root.confirmationUrl) {
      return res.status(502).json({
        ok: false,
        mode: "shopify",
        error: "Shopify did not return a confirmationUrl.",
      });
    }

    const confirmationUrl = root.confirmationUrl;

    return res.json({
      ok: true,
      mode: "shopify",
      planKey: effectivePlanKey,
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
    if ((process.env.BILLING_MODE ?? "stub") === "shopify") {
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


/**
 * Stub billing confirmation:
 *  /billing/confirm-stub?shop=example.myshopify.com&plan=starter
 */
router.get("/confirm-stub", async (req, res) => {
  try {
    const shop = String(req.query.shop || "").trim().toLowerCase();
    const plan = String(req.query.plan || "starter").trim().toLowerCase();
    if (!shop) return res.status(400).send("Missing shop");

    await activateBilling(shop, plan, "stub");
    return res.redirect(302, `/embedded?shop=${encodeURIComponent(shop)}`);
  } catch (e) {
    return res.status(500).send("Stub confirm failed");
  }
});

export default router;


