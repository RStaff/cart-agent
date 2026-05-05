import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import nodemailer from "nodemailer";

const outDir = "staffordos/operator_daemon/output";
const ledgerDir = "staffordos/operator_daemon/send_ledger";
mkdirSync(outDir, { recursive: true });
mkdirSync(ledgerDir, { recursive: true });

const now = new Date().toISOString();
const approvedQueuePath = `${outDir}/approved_outreach_queue_v1.json`;
const dryRunPath = `${outDir}/real_smtp_dry_run_actual_v1.json`;
const outputPath = `${outDir}/operator_confirmed_real_send_v1.json`;

function fail(reason, extra = {}) {
  const result = {
    schema: "staffordos.operator_confirmed_real_send.v1",
    generated_at: now,
    status: "blocked",
    blocking_reason: reason,
    ...extra,
    proof: {
      real_send: false,
      sent_messages: false,
      revenue_action: false
    }
  };
  writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

if (process.env.STAFFORDOS_ALLOW_REAL_SEND !== "true") {
  fail("STAFFORDOS_ALLOW_REAL_SEND_not_true");
}

if (!existsSync(approvedQueuePath)) fail("approved_queue_missing");
if (!existsSync(dryRunPath)) fail("dry_run_missing");

const approved = JSON.parse(readFileSync(approvedQueuePath, "utf8"));
const dryRun = JSON.parse(readFileSync(dryRunPath, "utf8"));

if (dryRun.status !== "actual_sender_path_validated_no_send") {
  fail("dry_run_not_validated", { dry_run_status: dryRun.status });
}

const item = approved.items?.[0];
if (!item) fail("no_approved_item");

const recipient = item.contact?.email;
if (!recipient) fail("recipient_missing");
if (recipient === "test@example.com") fail("placeholder_recipient_blocked");
if (recipient !== "rossstafford1@gmail.com") fail("recipient_not_operator_controlled", { recipient });

const requiredEnv = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "FROM_EMAIL"];
const missingEnv = requiredEnv.filter((k) => !process.env[k]);
if (missingEnv.length) fail("smtp_env_missing", { missing_env_keys: missingEnv });

const subject = `[StaffordOS Test Send] ${item.subject || "ShopiFixer follow-up"}`;
const body = `${item.body || "ShopiFixer follow-up test."}

---
Operator-controlled test send.
Lead ID: ${item.lead_id}
No real customer outreach was performed.
`;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

let providerResponse;
try {
  providerResponse = await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: recipient,
    subject,
    text: body
  });
} catch (err) {
  fail("smtp_send_failed", {
    error_message: err?.message || String(err)
  });
}

const ledgerEntry = {
  schema: "staffordos.send_ledger_entry.v1",
  sent_at: now,
  mode: "operator_controlled_test_send",
  lead_id: item.lead_id,
  merchant_id: item.merchant_id || null,
  recipient,
  subject,
  provider: "smtp",
  provider_message_id: providerResponse?.messageId || null,
  operator_confirmation_id: `operator_confirmed_${Date.now()}`,
  product_boundary_version: "shopifixer_only_first_touch",
  proof: {
    operator_controlled_test_send: true,
    max_leads: 1,
    batch_send: false,
    real_send: true,
    sent_messages: true,
    revenue_action: false
  }
};

const ledgerPath = `${ledgerDir}/send_ledger_entry_${Date.now()}_${item.lead_id}.json`;
writeFileSync(ledgerPath, JSON.stringify(ledgerEntry, null, 2));

const result = {
  schema: "staffordos.operator_confirmed_real_send.v1",
  generated_at: now,
  status: "real_send_executed",
  execution: {
    mode: "single_lead_only",
    lead_id: item.lead_id,
    channel: "email",
    recipient,
    send_attempted: true,
    send_status: "provider_accepted",
    provider_message_id: providerResponse?.messageId || null
  },
  ledger_path: ledgerPath,
  constraints: {
    max_leads: 1,
    operator_confirmed: true,
    operator_controlled_test_send: true,
    batch_send: false,
    allowlist_required: true
  },
  proof: {
    operator_controlled_test_send: true,
    real_send: true,
    sent_messages: true,
    revenue_action: false
  }
};

writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log("✅ REAL SMTP TEST SEND EXECUTED + LEDGER WRITTEN");
console.log(JSON.stringify(result, null, 2));
