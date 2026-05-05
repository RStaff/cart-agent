import { existsSync, readFileSync, writeFileSync } from "fs";

const failures = [];
const warnings = [];

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function requireFile(path, label) {
  if (!existsSync(path)) failures.push(`missing_file:${label}:${path}`);
}

function requireSignal(content, signal, label) {
  if (!content.includes(signal)) failures.push(`missing_signal:${label}:${signal}`);
}

function warnSignal(content, signal, label) {
  if (!content.includes(signal)) warnings.push(`missing_optional_signal:${label}:${signal}`);
}

// Required files
const files = {
  runAudit: "web/src/routes/runAudit.esm.js",
  runAuditResolver: "staffordos/scorecards/runAuditResolver.js",
  guidedAudit: "web/src/routes/guidedAudit.esm.js",
  pricing: "web/src/routes/pricing.esm.js",
  shopifixerLeadRegistry: "web/src/lib/shopifixerLeadRegistry.js",
  shopifixerLifecycleTracker: "web/src/lib/shopifixerLifecycleTracker.js",

  recoveryLiveTest: "web/src/routes/recoveryLiveTest.esm.js",
  recoveryExecution: "web/src/routes/recoveryExecution.esm.js",
  recoveryLedger: "web/src/routes/recoveryLedger.esm.js",
  abandoRecoverySender: "web/src/lib/abandoRecoverySender.js",
  emailSender: "web/src/lib/emailSender.js",
  smsSender: "web/src/lib/smsSender.js"
};

for (const [label, path] of Object.entries(files)) {
  requireFile(path, label);
}

const runAudit = read(files.runAudit);
const runAuditResolver = read(files.runAuditResolver);
const guidedAudit = read(files.guidedAudit);
const pricing = read(files.pricing);
const leadRegistry = read(files.shopifixerLeadRegistry);
const lifecycle = read(files.shopifixerLifecycleTracker);

const recoveryLiveTest = read(files.recoveryLiveTest);
const recoveryExecution = read(files.recoveryExecution);
const recoveryLedger = read(files.recoveryLedger);
const recoverySender = read(files.abandoRecoverySender);
const emailSender = read(files.emailSender);
const smsSender = read(files.smsSender);

// ShopiFixer logical route checks based on actual proven flow:
// /run-audit -> resolveRunAuditTarget() -> /scorecard/:slug OR /install/shopify?shop=...
requireSignal(runAudit, "resolveRunAuditTarget", "shopifixer_runAudit_uses_resolver");
requireSignal(runAuditResolver, "redirectPath", "shopifixer_resolver_returns_redirect_path");
requireSignal(runAuditResolver, "/scorecard/", "shopifixer_resolver_scorecard_handoff");
requireSignal(runAuditResolver, "/install/shopify", "shopifixer_resolver_install_fallback");
warnSignal(runAudit, "shopifixer", "shopifixer_runAudit_product_signal");
requireSignal(guidedAudit, "audit", "shopifixer_guidedAudit_audit_signal");
requireSignal(pricing, "pricing", "shopifixer_pricing_signal");
warnSignal(pricing, "950", "shopifixer_950_price_signal");
requireSignal(leadRegistry, "shopifixer", "shopifixer_lead_registry_product_signal");
requireSignal(lifecycle, "shopifixer", "shopifixer_lifecycle_product_signal");

// Abando logical route checks
requireSignal(recoveryLiveTest, "recovery", "abando_live_test_recovery_signal");
requireSignal(recoveryExecution, "recovery", "abando_execution_recovery_signal");
requireSignal(recoveryLedger, "ledger", "abando_ledger_signal");
requireSignal(recoverySender, "email", "abando_sender_email_signal");
warnSignal(recoverySender, "sms", "abando_sender_sms_signal");
requireSignal(emailSender, "SMTP", "email_sender_smtp_signal");
requireSignal(smsSender, "TWILIO", "sms_sender_twilio_signal");

// Cross-flow proof signals
const result = {
  schema: "staffordos.revenue_flow_logic_validator.v1",
  generated_at: new Date().toISOString(),
  status: failures.length ? "failed" : warnings.length ? "passed_with_warnings" : "passed",
  flows_checked: {
    shopifixer: [
      "runAudit",
      "runAuditResolver",
      "scorecardOrInstallFallback",
      "guidedAudit",
      "pricing",
      "shopifixerLeadRegistry",
      "shopifixerLifecycleTracker"
    ],
    abando: [
      "recoveryLiveTest",
      "recoveryExecution",
      "recoveryLedger",
      "abandoRecoverySender",
      "emailSender",
      "smsSender"
    ]
  },
  failures,
  warnings,
  proof: {
    validation_only: true,
    routes_executed: false,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(
  "staffordos/operator_daemon/output/revenue_flow_logic_validator_v1.json",
  JSON.stringify(result, null, 2)
);

console.log(JSON.stringify(result, null, 2));

if (failures.length) process.exit(1);
