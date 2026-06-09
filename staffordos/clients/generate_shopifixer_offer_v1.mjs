import { readFileSync, writeFileSync } from "fs";

const REGISTRY_PATH = "staffordos/clients/client_registry_v1.json";
const OUTPUT_PATH = "staffordos/clients/shopifixer_offer_latest.json";
const SHOPIFIXER_FIX_SPRINT_PRICE = 950;
const ABANDO_OPTIONAL_MRR = 50;

function formatMoney(n) {
  return Number(n || 0).toFixed(0);
}

function buildOffer(client) {
  const recovered = client.abando?.merchant_revenue_recovered || 0;
  const email = client.contact?.email || "";
  const shop = client.merchant_shop;

  return {
    client_id: client.client_id,
    merchant_shop: shop,
    email,

    offer: {
      subject: `ShopiFixer Fix Sprint for ${shop}`,

      body: `
Hi,

I took a look at your store and put together a ShopiFixer Fix Sprint offer.

This is a proof-backed Fix Sprint for one visible Shopify problem:

1. Diagnosis
2. Scoped fix
3. Before evidence
4. After evidence
5. Merchant-facing proof package

We have already seen $${formatMoney(recovered)} in recovered revenue as supporting context, but the price for the sprint does not change with that number.

ShopiFixer Fix Sprint: $${SHOPIFIXER_FIX_SPRINT_PRICE}

Abando remains a separate optional SaaS product for ongoing recovery after the ShopiFixer work is complete.

This offer is for the fix sprint only.

Want me to set this up for you?

– Ross
Stafford Media Consulting
`,

      pricing: {
        shopifixer_one_time: SHOPIFIXER_FIX_SPRINT_PRICE,
        abando_mrr: ABANDO_OPTIONAL_MRR
      },

      context: {
        recovered_revenue: recovered,
        proof_present: recovered > 0
      }
    }
  };
}

function run() {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));

  if (!registry.clients || registry.clients.length === 0) {
    console.error("No clients found.");
    process.exit(1);
  }

  const client = registry.clients[0]; // first client for now
  const offer = buildOffer(client);

  writeFileSync(OUTPUT_PATH, JSON.stringify(offer, null, 2) + "\n");

  console.log("\n===== OFFER GENERATED =====\n");
  console.log(offer.offer.body);

  console.log("\n===== STRUCTURED OUTPUT SAVED =====");
  console.log(OUTPUT_PATH);
}

run();
