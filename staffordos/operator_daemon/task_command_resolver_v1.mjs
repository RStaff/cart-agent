import { existsSync, writeFileSync, mkdirSync } from "fs";

const taskType = process.argv[2] || "primary_action_execution";
const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const COMMANDS = {
  primary_action_execution: {
    task_type: "primary_action_execution",
    command: "node staffordos/operator_daemon/write_operator_observation_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "safe_observation",
    system: "staffordos",
    revenue_action: false,
    reason: "Default safe executable command for persistent operator proof loop."
  },

  system_truth_sync: {
    task_type: "system_truth_sync",
    command: "node staffordos/system_inventory/runners/discovery_sync_runner_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "system_sync",
    system: "staffordos",
    revenue_action: false,
    reason: "Sync system discovery + truth inventory state."
  },

  lead_registry_sync: {
    task_type: "lead_registry_sync",
    command: "node staffordos/operator_daemon/write_lead_registry_sync_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "lead_sync",
    system: "shopifixer",
    revenue_action: false,
    reason: "Refresh lead registry status artifacts."
  },

  shopifixer_followup_draft: {
    task_type: "shopifixer_followup_draft",
    command: "node staffordos/operator_daemon/write_followup_draft_v1.mjs",
    approval_level: "operator_review_required",
    execution_class: "outreach_prep",
    system: "shopifixer",
    revenue_action: false,
    reason: "Prepare follow-up message draft from canonical leads (NO sending)."
  },

  shopifixer_followup_approve: {
    task_type: "shopifixer_followup_approve",
    command: "node staffordos/operator_daemon/write_approved_outreach_queue_v1.mjs",
    approval_level: "operator_explicit",
    execution_class: "approval_gate",
    system: "shopifixer",
    revenue_action: false,
    reason: "Move drafted outreach into approved queue (NO sending)."
  },

  send_readiness_gate: {
    task_type: "send_readiness_gate",
    command: "node staffordos/operator_daemon/write_send_readiness_gate_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "readiness_gate",
    system: "shopifixer",
    revenue_action: false,
    reason: "Evaluate approved outreach queue for send readiness (NO sending)."
  },

  contact_completeness_gate: {
    task_type: "contact_completeness_gate",
    command: "node staffordos/operator_daemon/write_contact_completeness_gate_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "contact_quality_gate",
    system: "shopifixer",
    revenue_action: false,
    reason: "Route approved leads with missing contact data to enrichment_needed_queue (NO sending)."
  },

  enrichment_task_packet: {
    task_type: "enrichment_task_packet",
    command: "node staffordos/operator_daemon/write_enrichment_task_packet_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "enrichment_planning",
    system: "shopifixer",
    revenue_action: false,
    reason: "Create contact enrichment task packet from enrichment_needed_queue (NO external lookup/send)."
  }
};

const resolved = COMMANDS[taskType];

const result = {
  schema: "staffordos.task_command_resolution.v1",
  generated_at: new Date().toISOString(),
  task_type: taskType,
  status: resolved ? "resolved" : "unresolved",
  resolution: resolved || null,
  failures: []
};

if (!resolved) {
  result.failures.push(`No approved command mapping found for task_type: ${taskType}`);
}

if (resolved?.command?.startsWith("node ")) {
  const scriptPath = resolved.command.split(" ")[1];
  if (!existsSync(scriptPath)) {
    result.status = "failed";
    result.failures.push(`Resolved command target does not exist: ${scriptPath}`);
  }
}

writeFileSync(
  `${outDir}/task_command_resolution_v1.json`,
  JSON.stringify(result, null, 2)
);

if (result.status !== "resolved") {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(resolved.command);
