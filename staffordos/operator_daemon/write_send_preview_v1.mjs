import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const inPath = "staffordos/operator_daemon/output/approved_outreach_queue_v1.json";
const outPath = "staffordos/operator_daemon/output/send_preview_v1.json";

mkdirSync("staffordos/operator_daemon/output", { recursive: true });

if (!existsSync(inPath)) {
  console.error("❌ approved queue missing");
  process.exit(1);
}

const queue = JSON.parse(readFileSync(inPath, "utf8"));
const first = (queue.items || [])[0];

const result = {
  schema: "staffordos.send_preview.v1",
  generated_at: new Date().toISOString(),
  status: first ? "preview_ready" : "no_items",
  preview: first || null,
  proof: {
    preview_only: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log("✅ send preview created");
console.log(JSON.stringify(result, null, 2));
