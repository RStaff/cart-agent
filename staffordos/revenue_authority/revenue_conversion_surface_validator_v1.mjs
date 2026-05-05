import { existsSync, readFileSync, writeFileSync } from "fs";

const failures = [];
const warnings = [];

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function requiredFile(path, label) {
  if (!existsSync(path)) failures.push(`missing_file:${label}:${path}`);
}

function requireAny(content, signals, label) {
  if (!signals.some((s) => content.toLowerCase().includes(s.toLowerCase()))) {
    failures.push(`missing_conversion_signal:${label}:${signals.join("|")}`);
  }
}

function warnAny(content, signals, label) {
  if (!signals.some((s) => content.toLowerCase().includes(s.toLowerCase()))) {
    warnings.push(`missing_optional_conversion_signal:${label}:${signals.join("|")}`);
  }
}

const files = {
  runAudit: "web/src/routes/runAudit.esm.js",
  pricing: "web/src/routes/pricing.esm.js",
  recoveryLiveTest: "web/src/routes/recoveryLiveTest.esm.js",
  recoveryExecution: "web/src/routes/recoveryExecution.esm.js",
  abandoRecoverySender: "web/src/lib/abandoRecoverySender.js",
  freeAuditForm: "abando-frontend/src/components/audit/FreeAuditForm.tsx",
  auditResultPage: "abando-frontend/src/components/audit/AuditResultPage.tsx",
  pricingComponent: "abando-frontend/src/components/Pricing.tsx"
};

for (const [label, path] of Object.entries(files)) {
  requiredFile(path, label);
}

const runAudit = read(files.runAudit);
const pricing = read(files.pricing);
const recoveryLiveTest = read(files.recoveryLiveTest);
const recoveryExecution = read(files.recoveryExecution);
const freeAuditForm = read(files.freeAuditForm);
const auditResultPage = read(files.auditResultPage);
const pricingComponent = read(files.pricingComponent);

// ShopiFixer conversion surface
requireAny(runAudit, ["audit", "run audit", "shopifixer"], "run_audit_entry_offer");
requireAny(runAudit, ["store", "shopify"], "run_audit_store_input");
requireAny(auditResultPage, ["audit", "result", "score"], "audit_result_surface");
warnAny(auditResultPage, ["email", "full audit", "check your email"], "audit_result_email_handoff");
requireAny(pricing, ["pricing", "$", "950", "service", "checkout"], "pricing_conversion_intent");
requireAny(pricingComponent, ["pricing", "$", "checkout", "buy", "start"], "frontend_pricing_conversion_intent");

// Abando conversion surface
requireAny(recoveryLiveTest, ["recovery", "preview", "test", "email"], "abando_recovery_preview_surface");
requireAny(recoveryExecution, ["recovery", "execute", "ledger"], "abando_recovery_execution_surface");
warnAny(recoveryLiveTest, ["install", "subscription", "connect"], "abando_install_or_subscription_cta");

const result = {
  schema: "staffordos.revenue_conversion_surface_validator.v1",
  generated_at: new Date().toISOString(),
  status: failures.length ? "failed" : warnings.length ? "passed_with_warnings" : "passed",
  surfaces_checked: {
    shopifixer: ["runAudit", "auditResultPage", "pricing", "frontendPricing"],
    abando: ["recoveryLiveTest", "recoveryExecution"]
  },
  failures,
  warnings,
  proof: {
    validation_only: true,
    routes_executed: false,
    payment_attempted: false,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(
  "staffordos/operator_daemon/output/revenue_conversion_surface_validator_v1.json",
  JSON.stringify(result, null, 2)
);

console.log(JSON.stringify(result, null, 2));

if (failures.length) process.exit(1);
