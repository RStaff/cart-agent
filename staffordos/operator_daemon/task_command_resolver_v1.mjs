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
    reason: "Sync system discovery and truth inventory state."
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
    reason: "Prepare ShopiFixer follow-up message draft from canonical leads. No sending."
  },

  shopifixer_followup_approve: {
    task_type: "shopifixer_followup_approve",
    command: "node staffordos/operator_daemon/write_approved_outreach_queue_v1.mjs",
    approval_level: "operator_explicit",
    execution_class: "approval_gate",
    system: "shopifixer",
    revenue_action: false,
    reason: "Move drafted outreach into approved queue. No sending."
  },

  send_readiness_gate: {
    task_type: "send_readiness_gate",
    command: "node staffordos/operator_daemon/write_send_readiness_gate_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "readiness_gate",
    system: "shopifixer",
    revenue_action: false,
    reason: "Evaluate approved outreach queue for send readiness. No sending."
  },

  contact_completeness_gate: {
    task_type: "contact_completeness_gate",
    command: "node staffordos/operator_daemon/write_contact_completeness_gate_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "contact_quality_gate",
    system: "shopifixer",
    revenue_action: false,
    reason: "Route approved leads with missing contact data to enrichment queue. No sending."
  },

  enrichment_task_packet: {
    task_type: "enrichment_task_packet",
    command: "node staffordos/operator_daemon/write_enrichment_task_packet_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "enrichment_planning",
    system: "shopifixer",
    revenue_action: false,
    reason: "Create contact enrichment task packet. No external lookup or sending."
  },

  operator_reviewed_enrichment_result: {
    task_type: "operator_reviewed_enrichment_result",
    command: "node staffordos/operator_daemon/apply_operator_reviewed_enrichment_v1.mjs",
    approval_level: "operator_explicit",
    execution_class: "lead_enrichment_writeback",
    system: "shopifixer",
    revenue_action: false,
    reason: "Apply operator-reviewed contact enrichment to canonical leads. No lookup or sending."
  },

  merchant_registry_build: {
    task_type: "merchant_registry_build",
    command: "node staffordos/commercial/build_merchant_registry_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "commercial_truth_mapping",
    system: "staffordos",
    revenue_action: false,
    reason: "Map canonical leads into merchant registry with offer routing and lifecycle state."
  },

  send_preview: {
    task_type: "send_preview",
    command: "node staffordos/operator_daemon/write_send_preview_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "preview",
    system: "shopifixer",
    revenue_action: false,
    reason: "Create single-lead send preview. No sending."
  },

  send_confirm: {
    task_type: "send_confirm",
    command: "node staffordos/operator_daemon/write_send_confirmation_v1.mjs",
    approval_level: "operator_explicit",
    execution_class: "confirmation",
    system: "shopifixer",
    revenue_action: false,
    reason: "Record operator confirmation. No sending."
  },

  send_execute: {
    task_type: "send_execute",
    command: "node staffordos/operator_daemon/write_send_execution_v1.mjs",
    approval_level: "operator_explicit",
    execution_class: "controlled_execution",
    system: "shopifixer",
    revenue_action: false,
    reason: "Controlled simulated send execution. Real send remains false."
  },

  security_hygiene_inventory: {
    task_type: "security_hygiene_inventory",
    command: "node staffordos/operator_daemon/write_security_hygiene_inventory_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "security_hygiene_inventory",
    system: "staffordos",
    revenue_action: false,
    reason: "Inventory security/hygiene agents and dependency vulnerability surface. No external send."
  },

  neck_router_inventory: {
    task_type: "neck_router_inventory",
    command: "node staffordos/operator_daemon/write_neck_router_inventory_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "inventory_audit",
    system: "staffordos",
    revenue_action: false,
    reason: "Inventory existing Neck/router/decision assets before adding new activation layer."
  },

  router_decision_agent_binding: {
    task_type: "router_decision_agent_binding",
    command: "node staffordos/operator_daemon/write_router_decision_agent_binding_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "router_decision_agent_binding",
    system: "staffordos",
    revenue_action: false,
    reason: "Bind existing router, decision, and agent assets into gated runner operating model."
  },

  product_boundary_validator: {
    task_type: "product_boundary_validator",
    command: "node staffordos/operator_daemon/write_product_boundary_validator_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "commercial_integrity_gate",
    system: "staffordos",
    revenue_action: false,
    reason: "Validate ShopiFixer/Abando product boundaries before send."
  },

  router_binding_plan: {
    task_type: "router_binding_plan",
    command: "node staffordos/operator_daemon/write_router_binding_plan_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "router_binding_planning",
    system: "staffordos",
    revenue_action: false,
    reason: "Create binding plan for existing router, decision, agent, and gated runner assets."
  },

  validator_map_refresh: {
    task_type: "validator_map_refresh",
    command: "node staffordos/operator_daemon/write_validator_map_refresh_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "validator_map_refresh",
    system: "staffordos",
    revenue_action: false,
    reason: "Refresh validator map for gated StaffordOS execution."
  },

  router_to_gated_runner_binding: {
    task_type: "router_to_gated_runner_binding",
    command: "node staffordos/operator_daemon/write_router_to_gated_runner_binding_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "router_binding_manifest",
    system: "staffordos",
    revenue_action: false,
    reason: "Bind router decisions to gated runner contract."
  },

  console_ingestion_binding: {
    task_type: "console_ingestion_binding",
    command: "node staffordos/operator_daemon/write_console_ingestion_binding_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "console_binding_manifest",
    system: "staffordos",
    revenue_action: false,
    reason: "Define console ingestion contract into gated runner path."
  },

  real_smtp_send_gate: {
    task_type: "real_smtp_send_gate",
    command: "node staffordos/operator_daemon/write_real_smtp_send_gate_v1.mjs",
    approval_level: "operator_explicit",
    execution_class: "smtp_send_readiness_gate",
    system: "shopifixer",
    revenue_action: false,
    reason: "Evaluate real SMTP readiness without sending."
  },

  smtp_env_discovery: {
    task_type: "smtp_env_discovery",
    command: "node staffordos/operator_daemon/write_smtp_env_discovery_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "smtp_config_discovery",
    system: "staffordos",
    revenue_action: false,
    reason: "Discover SMTP env/config binding without printing secrets or sending."
  },

  smtp_env_binding_patch: {
    task_type: "smtp_env_binding_patch",
    command: "node staffordos/operator_daemon/write_smtp_env_binding_patch_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "smtp_env_binding",
    system: "staffordos",
    revenue_action: false,
    reason: "Bind StaffordOS gated runner to existing local SMTP env source without printing secrets or sending."
  },

  real_smtp_dry_run: {
    task_type: "real_smtp_dry_run",
    command: "node staffordos/operator_daemon/write_real_smtp_dry_run_v1.mjs",
    approval_level: "operator_safe",
    execution_class: "smtp_dry_run",
    system: "shopifixer",
    revenue_action: false,
    reason: "Validate SMTP send path without executing real send."
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
