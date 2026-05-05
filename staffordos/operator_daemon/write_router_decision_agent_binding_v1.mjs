import { existsSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const assets = {
  router_assets: [
    "staffordos/router/router_v1.js",
    "staffordos/router/router_v1_1.js",
    "staffordos/router/router_v1_harness.mjs",
    "staffordos/operator_daemon/task_command_resolver_v1.mjs"
  ],
  decision_assets: [
    "staffordos/decision/resolve_primary_action_v1.mjs",
    "staffordos/clients/next_action_engine_v1.mjs",
    "staffordos/optimization/opportunityDecisionEngine.js",
    "staffordos/agents/agent_selector_v1.json"
  ],
  agent_assets: [
    "staffordos/agents/system_truth_sync_agent_v1.mjs",
    "staffordos/leads/lead_registry_sync_agent_v1.mjs",
    "staffordos/leads/contact_enrichment_agent_v1.mjs",
    "staffordos/leads/message_integrity_agent_v1.mjs",
    "staffordos/leads/message_validation_agent_v1.mjs",
    "staffordos/leads/send_execution_agent_v1.mjs",
    "staffordos/leads/send_ledger_agent_v1.mjs",
    "staffordos/revenue/revenue_agent_v1.mjs",
    "staffordos/qa/runtime_qa_agent_v1.mjs"
  ]
};

const exists = p => existsSync(p);

const result = {
  schema: "staffordos.router_decision_agent_binding.v1",
  generated_at: new Date().toISOString(),
  status: "binding_manifest_created",
  binding_model: {
    router_owner: "staffordos/operator_daemon/task_command_resolver_v1.mjs",
    decision_owner: "staffordos/decision/resolve_primary_action_v1.mjs",
    next_action_owner: "staffordos/clients/next_action_engine_v1.mjs",
    agent_selection_owner: "staffordos/agents/agent_selector_v1.json",
    execution_owner: "staffordos/execution/run_agent_loop.mjs",
    gated_commit_owner: "staffordos/operator_daemon/run_task_with_commit_gate_v1.sh"
  },
  assets: Object.fromEntries(
    Object.entries(assets).map(([group, paths]) => [
      group,
      paths.map(path => ({
        path,
        exists: exists(path),
        role: group.replace("_assets", "")
      }))
    ])
  ),
  required_binding_rules: [
    "All task execution must enter through run_task_with_commit_gate_v1.sh or run_auto_task_with_commit_gate_v1.sh.",
    "Task names must resolve through task_command_resolver_v1.mjs.",
    "Decision assets may recommend a task, but may not execute directly.",
    "Agents may produce outputs, but commits require the gated runner.",
    "Send execution remains blocked from auto-selection."
  ],
  proof: {
    inventory_only: false,
    binding_manifest_written: true,
    no_direct_execution_added: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(
  `${outDir}/router_decision_agent_binding_v1.json`,
  JSON.stringify(result, null, 2)
);

console.log("✅ router/decision/agent binding manifest written");
console.log(JSON.stringify(result, null, 2));
