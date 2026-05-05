import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const leadsPath = "staffordos/outreach/leads.json";
const outPath = "staffordos/commercial/merchant_registry_v1.json";
const proofPath = "staffordos/operator_daemon/output/merchant_registry_build_v1.json";

mkdirSync("staffordos/commercial", { recursive: true });
mkdirSync("staffordos/operator_daemon/output", { recursive: true });

if (!existsSync(leadsPath)) {
  console.error("❌ leads.json not found");
  process.exit(1);
}

const leads = JSON.parse(readFileSync(leadsPath, "utf8"));

const merchants = leads.map((lead, idx) => {
  const merchantId = lead.merchant_id || `merchant_${String(idx + 1).padStart(3, "0")}`;
  const hasConversionIssue = !!lead.signals?.conversion_issue;
  const recommendedOffer = hasConversionIssue ? "shopifixer" : "unknown";

  return {
    merchant_id: merchantId,
    lead_id: lead.lead_id,
    store_url: lead.website,
    company: lead.company,
    source: lead.source,
    current_stage: lead.contact?.email || lead.contact?.phone ? "send_ready" : "qualified",
    recommended_offer: recommendedOffer,
    product_boundary: recommendedOffer === "shopifixer" ? "shopifixer_only_first_touch" : "needs_review",
    shopifixer_status: "not_started",
    abando_status: "not_started",
    contact: lead.contact || {},
    signals: lead.signals || {},
    score: lead.score || {},
    next_best_action: lead.contact?.email || lead.contact?.phone
      ? "send_shopifixer_intro"
      : "enrich_contact",
    revenue_events: [],
    history: [
      ...(lead.history || []),
      {
        at: new Date().toISOString(),
        event: "merchant_registry_mapped",
        recommended_offer: recommendedOffer,
        sent_messages: false,
        revenue_action: false
      }
    ]
  };
});

const registry = {
  schema: "staffordos.merchant_registry.v1",
  generated_at: new Date().toISOString(),
  merchant_count: merchants.length,
  merchants,
  proof: {
    built_from_canonical_leads: true,
    offer_boundary_applied: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(outPath, JSON.stringify(registry, null, 2));
writeFileSync(proofPath, JSON.stringify({
  schema: "staffordos.merchant_registry_build.v1",
  generated_at: registry.generated_at,
  status: "built",
  merchant_count: merchants.length,
  output: outPath,
  proof: registry.proof
}, null, 2));

console.log("✅ merchant registry built");
console.log(JSON.stringify(registry, null, 2));
