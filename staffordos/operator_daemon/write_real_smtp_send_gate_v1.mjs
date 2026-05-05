import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const approvedQueuePath = `${outDir}/approved_outreach_queue_v1.json`;
const productBoundaryPath = `${outDir}/product_boundary_validator_v1.json`;
const readinessPath = `${outDir}/send_readiness_gate_v1.json`;

const read = p => existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;

const queue = read(approvedQueuePath);
const boundary = read(productBoundaryPath);
const readiness = read(readinessPath);

const smtpKeys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
const fromKeys = ["FROM_EMAIL", "DEFAULT_FROM", "SMTP_FROM"];

const smtpPresence = Object.fromEntries(
  [...smtpKeys, ...fromKeys].map(k => [k, Boolean(process.env[k])])
);

const smtpReady =
  smtpKeys.every(k => Boolean(process.env[k])) &&
  fromKeys.some(k => Boolean(process.env[k]));

const readyItems = readiness?.ready_items || 0;
const boundaryPassed = boundary?.status === "passed";
const hasApprovedQueue = !!queue?.items?.length;

const result = {
  schema: "staffordos.real_smtp_send_gate.v1",
  generated_at: new Date().toISOString(),
  status: smtpReady && readyItems > 0 && boundaryPassed && hasApprovedQueue
    ? "smtp_ready_but_send_not_executed"
    : "not_ready",
  checks: {
    smtp_config_present_without_secrets: smtpPresence,
    smtp_ready_minimum: smtpReady,
    approved_queue_present: hasApprovedQueue,
    ready_items: readyItems,
    product_boundary_passed: boundaryPassed
  },
  blocking_reasons: [
    ...(smtpReady ? [] : ["smtp_env_missing_or_incomplete"]),
    ...(hasApprovedQueue ? [] : ["approved_outreach_queue_missing_or_empty"]),
    ...(readyItems > 0 ? [] : ["no_send_ready_items"]),
    ...(boundaryPassed ? [] : ["product_boundary_not_passed"])
  ],
  proof: {
    readiness_gate_only: true,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/real_smtp_send_gate_v1.json`, JSON.stringify(result, null, 2));
console.log("✅ real SMTP send gate evaluated — NO SEND");
console.log(JSON.stringify(result, null, 2));
