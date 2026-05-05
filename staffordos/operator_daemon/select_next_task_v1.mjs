import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const readJson = (path) => {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
};

const merchantRegistryPath = "staffordos/commercial/merchant_registry_v1.json";
const readinessPath = `${outDir}/send_readiness_gate_v1.json`;
const previewPath = `${outDir}/send_preview_v1.json`;

const merchantRegistry = readJson(merchantRegistryPath);
const readiness = readJson(readinessPath);
const preview = readJson(previewPath);

let selection;

if (!merchantRegistry) {
  selection = {
    task_type: "merchant_registry_build",
    expected_artifact: merchantRegistryPath,
    commit_message: "auto build merchant registry through gated StaffordOS runner",
    reason: "Merchant registry is missing. Build commercial truth layer first."
  };
} else if (!readiness || readiness.generated_at < merchantRegistry.generated_at) {
  selection = {
    task_type: "send_readiness_gate",
    expected_artifact: readinessPath,
    commit_message: "auto run send readiness gate through gated StaffordOS runner",
    reason: "Merchant registry exists. Evaluate send readiness before any preview or send."
  };
} else if ((readiness.ready_items || 0) > 0 && !preview) {
  selection = {
    task_type: "send_preview",
    expected_artifact: previewPath,
    commit_message: "auto create send preview through gated StaffordOS runner",
    reason: "At least one merchant is send-ready. Create preview only. No send."
  };
} else {
  selection = {
    task_type: "merchant_registry_build",
    expected_artifact: merchantRegistryPath,
    commit_message: "auto refresh merchant registry through gated StaffordOS runner",
    reason: "No higher safe auto-task selected. Refresh merchant registry."
  };
}

const result = {
  schema: "staffordos.next_task_selection.v1",
  generated_at: new Date().toISOString(),
  selected: selection,
  safety: {
    never_auto_selects_send_confirm: true,
    never_auto_selects_send_execute: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/next_task_selection_v1.json`, JSON.stringify(result, null, 2));

console.log(JSON.stringify(result, null, 2));
