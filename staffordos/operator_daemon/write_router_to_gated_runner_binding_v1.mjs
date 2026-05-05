import { writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const result = {
  schema: "staffordos.router_to_gated_runner_binding.v1",
  generated_at: new Date().toISOString(),
  status: "binding_manifest_created",
  binding: {
    selected_task_source: "staffordos/operator_daemon/select_next_task_v1.mjs",
    command_resolution_source: "staffordos/operator_daemon/task_command_resolver_v1.mjs",
    execution_path: "staffordos/operator_daemon/run_task_with_commit_gate_v1.sh",
    auto_execution_path: "staffordos/operator_daemon/run_auto_task_with_commit_gate_v1.sh",
    commit_gate: "staffordos/operator_daemon/commit_gate_v1.sh",
    direct_git_commit_allowed: false
  },
  rules: [
    "Router may select task_type only.",
    "Router must not call git directly.",
    "Router must not bypass run_agent_loop.",
    "Router must not auto-select send_confirm or send_execute.",
    "All execution must pass expected artifact, heartbeat, forbidden action, and resolver syntax gates."
  ],
  proof: {
    binding_manifest_only: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/router_to_gated_runner_binding_v1.json`, JSON.stringify(result, null, 2));
console.log("✅ router-to-gated-runner binding manifest written");
console.log(JSON.stringify(result, null, 2));
