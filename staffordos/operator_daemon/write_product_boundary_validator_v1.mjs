import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
const draftPath = `${outDir}/shopifixer_followup_draft_v1.json`;
const merchantPath = "staffordos/commercial/merchant_registry_v1.json";
const outPath = `${outDir}/product_boundary_validator_v1.json`;

mkdirSync(outDir, { recursive: true });

const draft = existsSync(draftPath) ? JSON.parse(readFileSync(draftPath, "utf8")) : null;
const registry = existsSync(merchantPath) ? JSON.parse(readFileSync(merchantPath, "utf8")) : null;

const violations = [];
const warnings = [];

const drafts = draft?.drafts || [];
const merchants = registry?.merchants || [];

if (!draft) warnings.push("draft_file_missing");
if (!registry) warnings.push("merchant_registry_missing");

for (const d of drafts) {
  const merchant = merchants.find(m => m.lead_id === d.lead_id);
  const offer = merchant?.recommended_offer || "unknown";
  const body = `${d.subject || ""} ${d.body || ""}`.toLowerCase();

  if (offer === "shopifixer") {
    if (body.includes("abando")) {
      violations.push({ lead_id: d.lead_id, violation: "shopifixer_first_touch_mentions_abando" });
    }

    if (body.includes("abandoned cart") || body.includes("abandoned carts")) {
      violations.push({ lead_id: d.lead_id, violation: "shopifixer_first_touch_uses_abandoned_cart_language" });
    }

    if (body.includes("$50") || body.includes("subscription")) {
      violations.push({ lead_id: d.lead_id, violation: "shopifixer_first_touch_mentions_subscription_offer" });
    }
  }

  if (offer === "abando") {
    if (body.includes("$950") || body.includes("shopifixer service") || body.includes("fix service")) {
      violations.push({ lead_id: d.lead_id, violation: "abando_outreach_blends_shopifixer_service_offer" });
    }
  }

  if (offer === "unknown") {
    warnings.push(`unknown_offer_for_lead:${d.lead_id}`);
  }
}

const result = {
  schema: "staffordos.product_boundary_validator.v1",
  generated_at: new Date().toISOString(),
  status: violations.length ? "failed" : "passed",
  checked_drafts: drafts.length,
  checked_merchants: merchants.length,
  violations,
  warnings,
  boundaries: {
    shopifixer: {
      type: "service",
      price: 950,
      rule: "ShopiFixer first-touch outreach sells diagnosis/fix service only. No Abando, no subscription, no abandoned-cart-first framing."
    },
    abando: {
      type: "subscription_product",
      price_monthly: 50,
      rule: "Abando outreach sells revenue recovery/re-engagement product. It is not the $950 ShopiFixer service."
    },
    bridge: {
      rule: "Abando may be offered after ShopiFixer completion or explicit recovery-demo intent."
    }
  },
  proof: {
    product_boundary_checked: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log("✅ product boundary validation complete");
console.log(JSON.stringify(result, null, 2));

if (violations.length) process.exit(1);
