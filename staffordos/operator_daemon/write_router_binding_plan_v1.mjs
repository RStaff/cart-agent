import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
const outPath = `${outDir}/router_binding_plan_v1.json`;
const inventoryPath = `${outDir}/neck_router_inventory_v1.json`;

mkdirSync(outDir, { recursive: true });

const inventory = existsSync(inventoryPath)
  ? JSON.parse(readFileSync(inventoryPath, "utf8"))
  : null;

const plan = {
  schema: "staffordos.router_binding_plan.v1",
  generated_at: new Date().toISOString(),
  status: "binding_plan_created",
  principle: "Build less; bind existing router, decision, and agent assets into the gated StaffordOS execution path.",
  owners: {
    task_selection_owner: {
      primary: "staffordos/operator_daemon/select_next_task_v1.mjs",
      candidates: [
        "staffordos/decision/resolve_primary_action_v1.mjs",
        "staffordos/clients/next_action_engine_v1.mjs",
        "staffordos/optimization/opportunityDecisionEngine.js"
      ],
      decision: "Keep select_next_task_v1 as the current operational selector, then evaluate whether next_action_engine or resolve_primary_action should become upstream input."
    },
    agent_activation_owner: {
      primary: "staffordos/agents/agent_selector_v1.json",
      support: [
        "staffordos/agents/task_to_agent_map_v1.json",
        "staffordos/execution/validate_required_agents_v1.mjs",
        "staffordos/agents/agent_registry_v1.json"
      ],
      decision: "Do not create a duplicate agent activation router yet. Use existing agent selector/map as source of truth."
    },
    execution_owner: {
      primary: "staffordos/operator_daemon/run_task_with_commit_gate_v1.sh",
      support: [
        "staffordos/operator_daemon/run_auto_task_with_commit_gate_v1.sh",
        "staffordos/operator_daemon/task_command_resolver_v1.mjs",
        "staffordos/execution/run_agent_loop.mjs",
        "staffordos/operator_daemon/commit_gate_v1.sh"
      ],
      decision: "All work lands only through gated runner path."
    },
    console_ingestion_owner: {
      primary: "staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts",
      support: [
        "staffordos/ui/operator-frontend/app/api/operator/ross-command-center/route.ts",
        "staffordos/ui/operator-frontend/components/operator/RossCommandCenterSurface.tsx",
        "staffordos/ui/operator-frontend/app/operator/command-center/page.tsx"
      ],
      decision: "Console/chat-style commands should resolve into task_type and call the gated runner path, not direct shell/git."
    }
  },
  next_binding_tasks: [
    {
      order: 1,
      task: "validator_map_refresh",
      purpose: "Refresh QA/validator map so every task has an expected artifact and validation owner."
    },
    {
      order: 2,
      task: "router_to_gated_runner_binding",
      purpose: "Bind selected task_type from existing router/decision assets into run_task_with_commit_gate_v1.sh."
    },
    {
      order: 3,
      task: "console_ingestion_binding",
      purpose: "Make operator console submit task_type into gated execution path."
    },
    {
      order: 4,
      task: "real_smtp_send_gate",
      purpose: "Only after product boundary, validator map, and gated routing are proven."
    }
  ],
  inventory_reference: inventory ? {
    total_candidates: inventory.total_candidates,
    has_router_candidates: (inventory.grouped?.router_candidates || []).length > 0,
    has_decision_candidates: (inventory.grouped?.decision_candidates || []).length > 0,
    has_agent_candidates: (inventory.grouped?.agent_candidates || []).length > 0
  } : {
    inventory_missing: true
  },
  proof: {
    binding_plan_only: true,
    no_execution_binding_changed: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(outPath, JSON.stringify(plan, null, 2));

console.log("✅ router binding plan written");
console.log(JSON.stringify(plan, null, 2));
