import { existsSync, writeFileSync } from "fs";

const failures = [];
const warnings = [];

function required(path, label) {
  if (!existsSync(path)) {
    failures.push(`missing_required_path:${label}:${path}`);
  }
}

function optional(path, label) {
  if (!existsSync(path)) {
    warnings.push(`missing_optional_path:${label}:${path}`);
  }
}

// Abando real recovery route
required("web/src/routes/recoveryLiveTest.esm.js", "abando_recovery_live_test_route");
required("web/src/routes/recoveryExecution.esm.js", "abando_recovery_execution_route");
required("web/src/routes/recoveryLedger.esm.js", "abando_recovery_ledger_route");
required("web/src/lib/abandoRecoverySender.js", "abando_recovery_sender");
required("web/src/lib/emailSender.js", "email_sender");
required("web/src/lib/smsSender.js", "sms_sender");

// ShopiFixer route
required("web/src/routes/runAudit.esm.js", "shopifixer_run_audit_route");
required("web/src/routes/guidedAudit.esm.js", "shopifixer_guided_audit_route");
required("web/src/routes/pricing.esm.js", "shopifixer_pricing_route");
required("web/src/lib/shopifixerLeadRegistry.js", "shopifixer_lead_registry");
required("web/src/lib/shopifixerLifecycleTracker.js", "shopifixer_lifecycle_tracker");

// Truth / proof
required("staffordos/system_inventory/output/truth_graph_pass_4_promoted_v1.json", "truth_graph");
required("staffordos/system_inventory/output/execution_proof_register_v1.json", "execution_proof_register");
required("staffordos/system_map/system_map_truth_v1.json", "system_map_truth");

// Surfaces / optional frontend proof
optional("abando-frontend/src/components/audit/FreeAuditForm.tsx", "frontend_free_audit_form");
optional("abando-frontend/src/components/audit/AuditResultPage.tsx", "frontend_audit_result_page");
optional("abando-frontend/src/components/Pricing.tsx", "frontend_pricing_component");

const result = {
  schema: "staffordos.revenue_route_validator.v1",
  generated_at: new Date().toISOString(),
  status: failures.length ? "failed" : warnings.length ? "passed_with_warnings" : "passed",
  checked_routes: {
    abando: [
      "recoveryLiveTest",
      "recoveryExecution",
      "recoveryLedger",
      "abandoRecoverySender",
      "emailSender",
      "smsSender"
    ],
    shopifixer: [
      "runAudit",
      "guidedAudit",
      "pricing",
      "shopifixerLeadRegistry",
      "shopifixerLifecycleTracker"
    ],
    truth: [
      "truth_graph_pass_4_promoted",
      "execution_proof_register",
      "system_map_truth"
    ]
  },
  failures,
  warnings,
  proof: {
    validation_only: true,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(
  "staffordos/operator_daemon/output/revenue_route_validator_v1.json",
  JSON.stringify(result, null, 2)
);

console.log(JSON.stringify(result, null, 2));

if (failures.length) process.exit(1);
