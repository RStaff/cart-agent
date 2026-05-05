import { writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const result = {
  schema: "staffordos.console_ingestion_binding.v1",
  generated_at: new Date().toISOString(),
  status: "binding_manifest_created",
  console_binding: {
    primary_route: "staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts",
    command_center_route: "staffordos/ui/operator-frontend/app/api/operator/ross-command-center/route.ts",
    surface: "staffordos/ui/operator-frontend/components/operator/RossCommandCenterSurface.tsx",
    required_contract: {
      input: "operator_intent_or_task_type",
      output: "task_type",
      execution_path: "run_task_with_commit_gate_v1.sh",
      no_direct_shell_from_ui_without_gate: true,
      no_direct_git_from_ui: true
    }
  },
  next_implementation_task: "patch_execute_primary_action_route_to_call_gated_runner",
  proof: {
    binding_manifest_only: true,
    no_ui_route_changed_yet: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/console_ingestion_binding_v1.json`, JSON.stringify(result, null, 2));
console.log("✅ console ingestion binding manifest written");
console.log(JSON.stringify(result, null, 2));
