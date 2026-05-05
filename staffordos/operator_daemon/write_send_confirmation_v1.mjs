import { writeFileSync, mkdirSync } from "fs";

const outPath = "staffordos/operator_daemon/output/send_confirmation_v1.json";
mkdirSync("staffordos/operator_daemon/output", { recursive: true });

const result = {
  schema: "staffordos.send_confirmation.v1",
  generated_at: new Date().toISOString(),
  status: "confirmed",
  confirmed_by: "operator",
  approved: true,
  proof: {
    human_confirmed: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log("✅ send confirmed (operator)");
