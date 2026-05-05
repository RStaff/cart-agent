import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const previewPath = "staffordos/operator_daemon/output/send_preview_v1.json";
const confirmPath = "staffordos/operator_daemon/output/send_confirmation_v1.json";
const outPath = "staffordos/operator_daemon/output/send_execution_v1.json";

mkdirSync("staffordos/operator_daemon/output", { recursive: true });

if (!existsSync(previewPath) || !existsSync(confirmPath)) {
  console.error("❌ preview or confirmation missing");
  process.exit(1);
}

const preview = JSON.parse(readFileSync(previewPath, "utf8"));
const confirm = JSON.parse(readFileSync(confirmPath, "utf8"));

if (!confirm.approved) {
  console.error("❌ not approved");
  process.exit(1);
}

const lead = preview.preview;

const result = {
  schema: "staffordos.send_execution.v1",
  generated_at: new Date().toISOString(),
  status: lead ? "simulated_send_complete" : "no_lead",
  executed_for: lead?.lead_id || null,
  channel: "email",
  simulated: true,
  proof: {
    confirmation_present: true,
    send_attempted: true,
    real_send: false,
    revenue_action: false
  }
};

writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log("✅ send execution simulated (NO REAL SEND)");
console.log(JSON.stringify(result, null, 2));
