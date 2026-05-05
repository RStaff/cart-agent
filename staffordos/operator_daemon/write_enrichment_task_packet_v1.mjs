import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
const enrichmentQueuePath = `${outDir}/enrichment_needed_queue_v1.json`;
const packetPath = `${outDir}/enrichment_task_packet_v1.json`;

mkdirSync(outDir, { recursive: true });

if (!existsSync(enrichmentQueuePath)) {
  console.error("❌ enrichment_needed_queue_v1.json not found");
  process.exit(1);
}

const queue = JSON.parse(readFileSync(enrichmentQueuePath, "utf8"));
const items = queue.items || [];

const tasks = items.map(item => ({
  task_id: `enrich_${item.lead_id}`,
  lead_id: item.lead_id,
  company: item.company,
  website: item.website,
  status: "ready_for_operator_review",
  task_type: "contact_enrichment",
  instructions: [
    "Find a valid business contact email or contact form for this Shopify store.",
    "Do not send outreach.",
    "Do not update approved_outreach_queue until contact data is verified.",
    "Record source/proof before marking enrichment complete."
  ],
  required_output: {
    email: "",
    phone: "",
    contact_form_url: "",
    source_url: "",
    confidence: 0
  },
  proof: {
    packet_created: true,
    external_lookup_performed: false,
    sent_messages: false,
    revenue_action: false
  }
}));

const result = {
  schema: "staffordos.enrichment_task_packet.v1",
  generated_at: new Date().toISOString(),
  system: "shopifixer",
  status: tasks.length > 0 ? "task_packet_created" : "no_enrichment_needed",
  source: enrichmentQueuePath,
  task_count: tasks.length,
  tasks,
  proof: {
    enrichment_queue_read: true,
    task_packet_written: true,
    external_lookup_performed: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(packetPath, JSON.stringify(result, null, 2));

console.log("✅ enrichment task packet written");
console.log(JSON.stringify(result, null, 2));
