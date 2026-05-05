import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const leadsPath = "staffordos/outreach/leads.json";
const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const operatorTestEmail = "rossstafford1@gmail.com";

if (!existsSync(leadsPath)) {
  console.error("❌ leads.json not found");
  process.exit(1);
}

const leads = JSON.parse(readFileSync(leadsPath, "utf8"));

const updated = leads.map(lead => {
  if (lead.lead_id !== "lead_001") return lead;

  return {
    ...lead,
    contact: {
      ...(lead.contact || {}),
      email: operatorTestEmail
    },
    test_control: {
      operator_controlled_recipient: true,
      purpose: "first SMTP dry-run and controlled send testing",
      real_customer: false
    },
    history: [
      ...(lead.history || []),
      {
        at: new Date().toISOString(),
        event: "operator_test_recipient_bound",
        recipient_is_operator_controlled: true,
        sent_messages: false,
        revenue_action: false
      }
    ]
  };
});

writeFileSync(leadsPath, JSON.stringify(updated, null, 2));

const result = {
  schema: "staffordos.operator_test_recipient_binding.v1",
  generated_at: new Date().toISOString(),
  status: "operator_test_recipient_bound",
  lead_id: "lead_001",
  recipient: operatorTestEmail,
  proof: {
    operator_controlled_recipient: true,
    real_customer: false,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/operator_test_recipient_binding_v1.json`, JSON.stringify(result, null, 2));

console.log("✅ operator-controlled test recipient bound");
console.log(JSON.stringify(result, null, 2));
