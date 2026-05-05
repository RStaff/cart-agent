import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const senderPath = "web/src/lib/emailSender.js";
const approvedQueuePath = `${outDir}/approved_outreach_queue_v1.json`;
const smtpGatePath = `${outDir}/real_smtp_send_gate_v1.json`;
const productBoundaryPath = `${outDir}/product_boundary_validator_v1.json`;

const readJson = (p) => existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;

const senderExists = existsSync(senderPath);
const senderSource = senderExists ? readFileSync(senderPath, "utf8") : "";

let syntaxCheck = { attempted: false, passed: false, error: null };
if (senderExists) {
  try {
    execSync(`node --check ${senderPath}`, { stdio: "pipe" });
    syntaxCheck = { attempted: true, passed: true, error: null };
  } catch (err) {
    syntaxCheck = { attempted: true, passed: false, error: String(err.message || err) };
  }
}

const queue = readJson(approvedQueuePath);
const smtpGate = readJson(smtpGatePath);
const boundary = readJson(productBoundaryPath);

const first = queue?.items?.[0] || null;
const recipient = first?.contact?.email || "";

const result = {
  schema: "staffordos.real_smtp_dry_run_actual.v1",
  generated_at: new Date().toISOString(),
  status:
    senderExists &&
    syntaxCheck.passed &&
    smtpGate?.status === "smtp_ready_but_send_not_executed" &&
    boundary?.status === "passed" &&
    recipient &&
    recipient !== "test@example.com"
      ? "actual_sender_path_validated_no_send"
      : "blocked_or_incomplete_no_send",
  checks: {
    sender_module_path: senderPath,
    sender_module_exists: senderExists,
    sender_syntax_check: syntaxCheck,
    sender_mentions_required_env_keys: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "FROM_EMAIL"].filter(k => senderSource.includes(k)),
    sender_has_send_function_shape: /send|mail|transport|nodemailer/i.test(senderSource),
    approved_queue_present: !!queue?.items?.length,
    product_boundary_passed: boundary?.status === "passed",
    smtp_gate_ready: smtpGate?.status === "smtp_ready_but_send_not_executed",
    recipient_present: !!recipient,
    recipient_is_placeholder: recipient === "test@example.com"
  },
  blocking_reasons: [
    ...(senderExists ? [] : ["sender_module_missing"]),
    ...(syntaxCheck.passed ? [] : ["sender_syntax_check_failed"]),
    ...(smtpGate?.status === "smtp_ready_but_send_not_executed" ? [] : ["smtp_gate_not_ready"]),
    ...(boundary?.status === "passed" ? [] : ["product_boundary_not_passed"]),
    ...(recipient ? [] : ["recipient_missing"]),
    ...(recipient === "test@example.com" ? ["recipient_is_placeholder_test_email"] : [])
  ],
  proof: {
    actual_sender_module_validated: senderExists && syntaxCheck.passed,
    send_function_invoked: false,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/real_smtp_dry_run_actual_v1.json`, JSON.stringify(result, null, 2));

console.log("✅ actual SMTP sender dry-run complete — NO SEND");
console.log(JSON.stringify(result, null, 2));
