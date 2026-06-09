import { readFileSync, writeFileSync } from "fs";

const REGISTRY_PATH = "staffordos/clients/client_registry_v1.json";
const CONVERSION_BRIEF_PATH = "staffordos/shopifixer/shopifixer_conversion_brief_v1.json";
const OUTPUT_PATH = "staffordos/clients/shopifixer_offer_latest.json";
const SHOPIFIXER_FIX_SPRINT_PRICE = 950;
const ABANDO_OPTIONAL_MRR = 50;

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function buildOffer(client, brief) {
  const email = client.contact?.email || "";
  const shop = client.merchant_shop;
  const sprintPrice = Number(brief?.sprint_price || SHOPIFIXER_FIX_SPRINT_PRICE);
  const deliverables = Array.isArray(brief?.sprint_deliverables) ? brief.sprint_deliverables : [];
  const proofDeliverables = Array.isArray(brief?.proof_package_deliverables) ? brief.proof_package_deliverables : [];

  return {
    client_id: client.client_id,
    merchant_shop: shop,
    email,

    offer: {
      subject: `ShopiFixer Fix Sprint for ${brief?.store_domain || shop}`,
      brief_source: CONVERSION_BRIEF_PATH,
      sections: {
        problem_found: brief?.top_issue || null,
        benchmark_position: brief?.benchmark_summary || null,
        why_it_matters: brief?.why_it_matters || null,
        fix_recommendation: brief?.fix_recommendation || null,
        sprint_price: sprintPrice,
        sprint_deliverables: deliverables,
        proof_package_deliverables: proofDeliverables,
        call_to_action: brief?.call_to_action || "Get the $950 Fix Sprint",
      },

      body: `
Hi,

Here is the ShopiFixer Conversion Brief for ${brief?.store_domain || shop}.

Problem Found:
${brief?.top_issue || "Unavailable"}

Benchmark Position:
${brief?.benchmark_summary || "Unavailable"}

Why It Matters:
${brief?.why_it_matters || "Unavailable"}

Fix Recommendation:
${brief?.fix_recommendation || "Unavailable"}

What The $${sprintPrice} Fix Sprint Includes:
${deliverables.length ? deliverables.map((item, index) => `${index + 1}. ${item}`).join("\n") : "Unavailable"}

What Proof They Will Receive:
${proofDeliverables.length ? proofDeliverables.map((item, index) => `${index + 1}. ${item}`).join("\n") : "Unavailable"}

ShopiFixer Fix Sprint: $${sprintPrice}

Abando remains a separate optional SaaS product and is not part of this offer.

Call To Action:
${brief?.call_to_action || "Get the $950 Fix Sprint"}

This offer is for the fix sprint only.

– Ross
Stafford Media Consulting
`,

      pricing: {
        shopifixer_one_time: sprintPrice,
        abando_mrr: ABANDO_OPTIONAL_MRR
      },

      context: {
        brief_source: CONVERSION_BRIEF_PATH
      }
    }
  };
}

function run() {
  const registry = readJson(REGISTRY_PATH);
  const brief = readJson(CONVERSION_BRIEF_PATH);

  if (!registry.clients || registry.clients.length === 0) {
    console.error("No clients found.");
    process.exit(1);
  }

  const client = registry.clients[0]; // first client for now
  const offer = buildOffer(client, brief);

  writeFileSync(OUTPUT_PATH, JSON.stringify(offer, null, 2) + "\n");

  console.log("\n===== OFFER GENERATED =====\n");
  console.log(offer.offer.body);

  console.log("\n===== STRUCTURED OUTPUT SAVED =====");
  console.log(OUTPUT_PATH);
}

run();
