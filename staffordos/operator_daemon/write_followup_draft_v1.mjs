import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
const leadsPath = "staffordos/outreach/leads.json";
mkdirSync(outDir, { recursive: true });

let leads = [];

if (existsSync(leadsPath)) {
  try {
    leads = JSON.parse(readFileSync(leadsPath, "utf8"));
  } catch (err) {
    console.error("❌ Could not parse leads.json:", err.message);
    process.exit(1);
  }
}

const drafts = leads.map((lead) => {
  const company = lead.company || "your Shopify store";
  const website = lead.website || "";
  const contactName = lead.contact?.name && lead.contact.name !== "Unknown"
    ? lead.contact.name
    : "there";

  return {
    lead_id: lead.lead_id,
    company,
    website,
    contact: lead.contact || {},
    subject: `Quick follow-up on ${company}`,
    body: `Hi ${contactName} — I took a quick look at ${company}${website ? ` (${website})` : ""} and noticed a few possible conversion gaps that may be costing the store sales. I can share a short ShopiFixer breakdown if helpful.`,
    proof: {
      drafted: true,
      sent: false,
      revenue_action: false
    }
  };
});

const result = {
  schema: "staffordos.followup_draft_batch.v1",
  generated_at: new Date().toISOString(),
  system: "shopifixer",
  status: drafts.length > 0 ? "drafts_created" : "no_leads_found",
  source: leadsPath,
  lead_count: leads.length,
  draft_count: drafts.length,
  drafts,
  proof: {
    read_canonical_leads: existsSync(leadsPath),
    generated_per_lead_drafts: drafts.length > 0,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(
  `${outDir}/shopifixer_followup_draft_v1.json`,
  JSON.stringify(result, null, 2)
);

console.log("✅ per-lead follow-up drafts written");
console.log(JSON.stringify(result, null, 2));
