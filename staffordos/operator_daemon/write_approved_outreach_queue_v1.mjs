import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
const draftPath = `${outDir}/shopifixer_followup_draft_v1.json`;
const queuePath = `${outDir}/approved_outreach_queue_v1.json`;

mkdirSync(outDir, { recursive: true });

if (!existsSync(draftPath)) {
  console.error("❌ No draft file found. Cannot approve.");
  process.exit(1);
}

const draftData = JSON.parse(readFileSync(draftPath, "utf8"));

const approved = (draftData.drafts || []).map(d => ({
  ...d,
  approval: {
    status: "approved",
    approved_at: new Date().toISOString(),
    approved_by: "operator"
  }
}));

const result = {
  schema: "staffordos.approved_outreach_queue.v1",
  generated_at: new Date().toISOString(),
  source: draftPath,
  approved_count: approved.length,
  items: approved,
  proof: {
    drafts_read: true,
    approved_items_created: approved.length > 0,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(queuePath, JSON.stringify(result, null, 2));

console.log("✅ approved outreach queue written");
console.log(JSON.stringify(result, null, 2));
