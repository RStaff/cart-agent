import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const operatorEmail = "rossstafford1@gmail.com";

const filesToPatch = [
  "staffordos/outreach/leads.json",
  "staffordos/operator_daemon/output/shopifixer_followup_draft_v1.json",
  "staffordos/operator_daemon/output/approved_outreach_queue_v1.json"
];

const patchedFiles = [];

function patchObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (obj.contact && typeof obj.contact === "object") {
    if (!obj.contact.email || obj.contact.email === "test@example.com") {
      obj.contact.email = operatorEmail;
      obj.test_control = {
        operator_controlled_recipient: true,
        real_customer: false,
        purpose: "SMTP dry-run validation only"
      };
    }
  }

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "object") patchObject(obj[key]);
  }

  return obj;
}

for (const file of filesToPatch) {
  if (!existsSync(file)) continue;

  const data = JSON.parse(readFileSync(file, "utf8"));
  patchObject(data);
  writeFileSync(file, JSON.stringify(data, null, 2));
  patchedFiles.push(file);
}

const result = {
  schema: "staffordos.fix_operator_test_recipient.v1",
  generated_at: new Date().toISOString(),
  status: "operator_test_recipient_applied",
  recipient: operatorEmail,
  patched_files: patchedFiles,
  proof: {
    operator_controlled_recipient: true,
    real_customer: false,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/fix_operator_test_recipient_v1.json`, JSON.stringify(result, null, 2));

console.log("✅ operator test recipient fixed — NO SEND");
console.log(JSON.stringify(result, null, 2));
