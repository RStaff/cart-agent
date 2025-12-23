#!/bin/bash
set -e

TARGET="web/routes/billing/create.js"

echo "🔧 Patching billing route at: $TARGET"

# Delete the existing file and recreate clean version
rm -f $TARGET

cat > $TARGET << 'FILEEOF'
import { shopifyClient } from "../../lib/shopify.js";

export default async function createBillingSession(req, res) {
  try {
    const { shop, planKey } = req.body;

    if (!shop || !planKey) {
      return res.status(400).json({ error: "Missing shop or planKey" });
    }

    const client = await shopifyClient({ shop });

    const mutation = {
      query: `
        mutation CreateSubscription(\$planKey: String!) {
          appSubscriptionCreate(
            name: \$planKey
            returnUrl: "https://${shop}/admin/apps/abando"
            test: true
            lineItems: [
              {
                plan: {
                  appRecurringPricingDetails: {
                    price: { amount: 4.90, currencyCode: USD }
                    interval: EVERY_30_DAYS
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
      variables: { planKey },
    };

    const response = await client.query({ data: mutation });

    const url =
      response.body.data.appSubscriptionCreate.confirmationUrl;

    return res.status(200).json({
      ok: true,
      confirmationUrl: url,
    });
  } catch (err) {
    console.error("Billing error:", err);
    return res.status(500).json({ error: "Billing session failed." });
  }
}
FILEEOF

echo "✅ Billing route patched successfully."
