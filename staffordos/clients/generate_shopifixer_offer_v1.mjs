import { readFileSync, writeFileSync } from "fs";

const REGISTRY_PATH = "staffordos/clients/client_registry_v1.json";
const OUTPUT_PATH = "staffordos/clients/shopifixer_offer_latest.json";

function formatMoney(n) {
  return Number(n || 0).toFixed(0);
}

function buildOffer(client) {
  const recovered = client.abando?.merchant_revenue_recovered || 0;
  const email = client.contact?.email || "";
  const shop = client.merchant_shop;

  // SIMPLE PRICING (you can change later)
  const fixPrice = recovered > 0 ? Math.max(99, Math.floor(recovered * 1.5)) : 149;
  const abandoPrice = 49;

  return {
    client_id: client.client_id,
    merchant_shop: shop,
    email,

    offer: {
      subject: `We found a revenue leak in your store (${shop})`,

      body: `
Hi,

I took a look at your store and found a revenue leak in your checkout flow.

We actually recovered $${formatMoney(recovered)} in lost revenue already.

Right now, that recovery is not running consistently — it's just a one-time proof.

Here’s what I can do for you:

1. Fix the underlying issue causing the drop-off
2. Implement the correction directly in your store
3. Activate continuous recovery so this runs automatically

→ One-time fix: $${fixPrice}

Optional:
→ Ongoing recovery system (Abando): $${abandoPrice}/month

This turns what we already proved into something that runs every day.

Want me to set this up for you?

– Ross
Stafford Media Consulting
`,

      pricing: {
        shopifixer_one_time: fixPrice,
        abando_mrr: abandoPrice
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
