#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/routes/billing.js"

echo "🔍 Checking for billing route at: $TARGET"
if [[ ! -f "$TARGET" ]]; then
  echo "❌ ERROR: Billing route file not found at $TARGET"
  exit 1
fi

echo "📦 Backing up existing billing.js..."
cp "$TARGET" "${TARGET}.backup_$(date +%s)"

echo "✍️ Writing new billing route..."

cat << 'FILEEOF' > "$TARGET"
import express from "express";
import shopify from "../shopify.js";
import { Shopify } from "@shopify/shopify-api";

const router = express.Router();

/**
 * Create a Shopify app subscription (Starter/Growth/Scale)
 */
router.post("/create", async (req, res) => {
  try {
    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    const { planKey } = req.body;

    if (!planKey) {
      return res.status(400).json({ error: "Missing planKey" });
    }

    // Plan Price Mapping (cents)
    const priceMap = {
      starter: 4900,
      growth: 9900,
      scale: 19900,
    };

    const amount = priceMap[planKey];

    if (!amount) {
      return res.status(400).json({ error: "Invalid planKey" });
    }

    // Build subscription mutation
    const mutation = {
      query: `
        mutation CreateSubscription(
          $name: String!
          $returnUrl: URL!
          $test: Boolean!
          $price: Decimal!
        ) {
          appSubscriptionCreate(
            name: $name
            returnUrl: $returnUrl
            test: $test
            lineItems: [{ plan: { appRecurringPricingDetails: { price: { amount: $price, currencyCode: USD } } } }]
          ) {
            confirmationUrl
            userErrors { field message }
          }
        }
      `,
      variables: {
        name: `Abando ${planKey} plan`,
        price: (amount / 100).toFixed(2),
        returnUrl: `${process.env.SHOPIFY_APP_URL}/billing/success`,
        test: process.env.SHOPIFY_BILLING_TEST === "true",
      },
    };

    const client = new Shopify.Clients.Graphql(session.shop);

    const response = await client.query(mutation);

    const url =
      response.body.data.appSubscriptionCreate.confirmationUrl;

    if (!url) {
      console.error("Billing error:", response.body.data);
      return res.status(500).json({
        error: "Shopify did not return a confirmationUrl.",
      });
    }

    return res.status(200).json({
      ok: true,
      confirmationUrl: url,
    });
  } catch (err) {
    console.error("Billing error:", err);
    return res.status(500).json({ error: "Billing session failed." });
  }
});

export default router;
FILEEOF

echo "✅ Billing route patched successfully."
