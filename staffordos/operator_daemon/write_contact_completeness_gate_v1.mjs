import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
const queuePath = `${outDir}/approved_outreach_queue_v1.json`;
const enrichmentPath = `${outDir}/enrichment_needed_queue_v1.json`;

mkdirSync(outDir, { recursive: true });

if (!existsSync(queuePath)) {
  console.error("❌ approved_outreach_queue_v1.json not found");
  process.exit(1);
}

const queue = JSON.parse(readFileSync(queuePath, "utf8"));
const items = queue.items || [];

const enrichmentNeeded = items
  .filter(item => !item.contact?.email && !item.contact?.phone)
  .map(item => ({
    lead_id: item.lead_id,
    company: item.company,
    website: item.website,
    contact: item.contact || {},
    reason: "missing_email_and_phone",
    next_action: "enrich_contact",
    proof: {
      has_email: false,
      has_phone: false,
      send_ready: false,
      sent_messages: false,
      revenue_action: false
    }
  }));

const result = {
  schema: "staffordos.enrichment_needed_queue.v1",
  generated_at: new Date().toISOString(),
  system: "shopifixer",
  status: enrichmentNeeded.length > 0 ? "enrichment_needed" : "complete",
  source: queuePath,
  total_items_checked: items.length,
  enrichment_needed_count: enrichmentNeeded.length,
  items: enrichmentNeeded,
  proof: {
    approved_queue_read: true,
    contact_completeness_checked: true,
    wrote_enrichment_queue: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(enrichmentPath, JSON.stringify(result, null, 2));

console.log("✅ contact completeness gate evaluated");
console.log(JSON.stringify(result, null, 2));
