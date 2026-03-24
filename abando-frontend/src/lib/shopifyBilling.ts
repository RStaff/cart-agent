const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-07";
const APP_URL =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://app.abando.ai";

export type ShopifyBillingResult = {
  confirmationUrl: string;
  chargeId?: string;
  test?: boolean;
};

function normalizeShop(shop: string) {
  return String(shop || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function getReturnUrl(shop: string) {
  const url = new URL("/embedded", APP_URL);
  url.searchParams.set("billing", "approved");
  url.searchParams.set("shop", shop);
  return url.toString();
}

export async function createRecurringCharge(shop: string, accessToken: string): Promise<ShopifyBillingResult> {
  const normalizedShop = normalizeShop(shop);
  if (!normalizedShop) {
    throw new Error("shop_required");
  }

  if (!accessToken) {
    throw new Error("shopify_access_token_missing");
  }

  const mutation = `
    mutation AppSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $trialDays: Int!, $test: Boolean!) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        lineItems: $lineItems
        trialDays: $trialDays
        test: $test
      ) {
        confirmationUrl
        appSubscription {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    name: "Abando Pro",
    returnUrl: getReturnUrl(normalizedShop),
    trialDays: 7,
    test: process.env.SHOPIFY_BILLING_TEST !== "false",
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: 29,
              currencyCode: "USD",
            },
            interval: "EVERY_30_DAYS",
          },
        },
      },
    ],
  };

  const response = await fetch(`https://${normalizedShop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query: mutation, variables }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  const result = payload?.data?.appSubscriptionCreate;
  const userErrors = Array.isArray(result?.userErrors) ? result.userErrors : [];

  if (!response.ok) {
    throw new Error(payload?.errors?.[0]?.message || `shopify_billing_http_${response.status}`);
  }

  if (userErrors.length > 0) {
    throw new Error(userErrors.map((entry: { message?: string }) => entry?.message).filter(Boolean).join("; "));
  }

  if (!result?.confirmationUrl) {
    throw new Error("shopify_confirmation_url_missing");
  }

  return {
    confirmationUrl: result.confirmationUrl,
    chargeId: result?.appSubscription?.id,
    test: variables.test,
  };
}
