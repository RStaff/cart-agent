#!/usr/bin/env bash
set -euo pipefail

echo "📦 Installing guaranteed billing route..."

ROUTE_PATH="web/src/routes/billing_create.js"

cat << 'FILEEOF' > "$ROUTE_PATH"
import express from "express";
import Shopify from "@shopify/shopify-api";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { planKey } = req.body;
    if (!planKey) {
      return res.status(400).json({ error: "Missing planKey" });
    }

    const session = res.locals.shopify.session;
    if (!session) {
      return res.status(401).json({ error: "No session available" });
    }

    const priceMap = {
      starter: 4900,
      growth: 9900,
      scale: 19900,
    };

    const amount = priceMap[planKey];
    if (!amount) {
      return res.status(400).json({ error: "Invalid planKey" });
    }

    const mutation = {
      query: `
        mutation CreateSubscription(
          $name: String!
          $returnUrl: URL!
          $test: Boolean
          $price: Decimal!
        ) {
          appSubscriptionCreate(
            name: $name
            returnUrl: $returnUrl
            trialDays: 3
            test: $test
            lineItems: [
              {
                plan: {
                  appRecurringPricingDetails: {
                    price: { amount: $price, currencyCode: USD }
                  }
                }
              }
            ]
          ) {
            confirmationUrl
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        name: `Abando ${planKey} plan`,
        returnUrl: `${process.env.SHOPIFY_APP_URL}/billing/success`,
        test: process.env.SHOPIFY_BILLING_TEST === "true",
        price: (amount / 100).toFixed(2),
      },
    };

    const client = new Shopify.Clients.Graphql(session.shop);
    const response = await client.query(mutation);

    const url = response.body.data.appSubscriptionCreate.confirmationUrl;

    if (!url) {
      console.error("Billing error:", response.body.data);
      return res.status(500).json({ error: "Shopify returned no confirmationUrl." });
    }

    return res.status(200).json({ ok: true, confirmationUrl: url });
  } catch (err) {
    console.error("Billing error:", err);
    return res.status(500).json({ error: "Billing session failed." });
  }
});

export default router;
FILEEOF

echo "✅ Billing endpoint created at: $ROUTE_PATH"
