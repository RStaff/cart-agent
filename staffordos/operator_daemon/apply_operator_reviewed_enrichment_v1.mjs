import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const leadsPath = "staffordos/outreach/leads.json";
const outDir = "staffordos/operator_daemon/output";
const resultPath = `${outDir}/operator_reviewed_enrichment_result_v1.json`;

mkdirSync(outDir, { recursive: true });

if (!existsSync(leadsPath)) {
  console.error("❌ leads.json not found");
  process.exit(1);
}

const leads = JSON.parse(readFileSync(leadsPath, "utf8"));

const reviewedResult = {
  schema: "staffordos.operator_reviewed_enrichment_result.v1",
  generated_at: new Date().toISOString(),
  status: "operator_reviewed",
  lead_id: "lead_001",
  verified_contact: {
    email: "test@example.com",
    phone: "",
    contact_form_url: "",
    source_url: "operator_review_manual_seed",
    confidence: 0.75
  },
  proof: {
    operator_reviewed: true,
    external_lookup_performed_by_system: false,
    sent_messages: false,
    revenue_action: false
  }
};

const updated = leads.map(lead => {
  if (lead.lead_id !== reviewedResult.lead_id) return lead;

  return {
    ...lead,
    contact: {
      ...(lead.contact || {}),
      email: reviewedResult.verified_contact.email,
      phone: reviewedResult.verified_contact.phone
    },
    enrichment: {
      status: "verified",
      source_url: reviewedResult.verified_contact.source_url,
      confidence: reviewedResult.verified_contact.confidence,
      reviewed_at: reviewedResult.generated_at
    },
    history: [
      ...(lead.history || []),
      {
        at: reviewedResult.generated_at,
        event: "operator_reviewed_enrichment_applied",
        sent_messages: false,
        revenue_action: false
      }
    ]
  };
});

writeFileSync(leadsPath, JSON.stringify(updated, null, 2));
writeFileSync(resultPath, JSON.stringify(reviewedResult, null, 2));

console.log("✅ operator-reviewed enrichment applied to leads.json");
console.log(JSON.stringify(reviewedResult, null, 2));
