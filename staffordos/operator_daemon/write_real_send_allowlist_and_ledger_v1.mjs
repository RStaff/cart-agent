import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
const ledgerDir = "staffordos/operator_daemon/send_ledger";
mkdirSync(outDir, { recursive: true });
mkdirSync(ledgerDir, { recursive: true });

const allowlistPath = `${outDir}/real_send_allowlist_v1.json`;
const ledgerManifestPath = `${ledgerDir}/send_ledger_manifest_v1.json`;

const allowlist = {
  schema: "staffordos.real_send_allowlist.v1",
  generated_at: new Date().toISOString(),
  status: "created_disabled_by_default",
  allowed_task_type: "operator_confirmed_real_send",
  enablement_flag_required: "STAFFORDOS_ALLOW_REAL_SEND=true",
  hard_requirements: [
    "operator_confirmed_real_send_manifest exists",
    "real_smtp_dry_run_actual status is actual_sender_path_validated_no_send",
    "real_smtp_send_gate status is smtp_ready_but_send_not_executed",
    "product_boundary_validator status is passed",
    "recipient is present and not test@example.com",
    "max one lead",
    "immutable send ledger entry is written"
  ],
  auto_select_allowed: false,
  batch_send_allowed: false,
  proof: {
    allowlist_created: true,
    allowlist_enabled_now: false,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

const existingLedger = existsSync(ledgerManifestPath)
  ? JSON.parse(readFileSync(ledgerManifestPath, "utf8"))
  : null;

const ledgerManifest = existingLedger || {
  schema: "staffordos.send_ledger_manifest.v1",
  created_at: new Date().toISOString(),
  append_only: true,
  ledger_dir: ledgerDir,
  entry_pattern: "send_ledger_entry_<timestamp>_<lead_id>.json",
  required_entry_fields: [
    "lead_id",
    "merchant_id",
    "recipient",
    "subject",
    "provider",
    "provider_message_id",
    "sent_at",
    "operator_confirmation_id",
    "product_boundary_version",
    "proof"
  ],
  proof: {
    ledger_manifest_created: true,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(allowlistPath, JSON.stringify(allowlist, null, 2));
writeFileSync(ledgerManifestPath, JSON.stringify(ledgerManifest, null, 2));

console.log("✅ real send allowlist and ledger contract written — NOT ENABLED");
console.log(JSON.stringify({ allowlist, ledgerManifest }, null, 2));
