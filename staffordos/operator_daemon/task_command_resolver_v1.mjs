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
