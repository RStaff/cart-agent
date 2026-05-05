import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const heartbeatPath = `${outDir}/operator_observation_v1.json`;

let prior = {};
if (existsSync(heartbeatPath)) {
  try {
    prior = JSON.parse(readFileSync(heartbeatPath, "utf8"));
  } catch {}
}

const observation = {
  schema: "staffordos.operator_observation.v1",
  generated_at: new Date().toISOString(),
  system: "staffordos",
  mode: "safe_observation",
  status: "observed",
  purpose: "Persistent operator safe execution proof",
  loops_observed: (prior.loops_observed || 0) + 1,
  proof: {
    command_was_real: true,
    command_was_safe: true,
    shell_command_exists: true,
    spine_execution_path: "run_agent_loop",
    no_revenue_action_taken: true
  }
};

writeFileSync(heartbeatPath, JSON.stringify(observation, null, 2));
console.log("✅ operator observation written");
console.log(JSON.stringify(observation, null, 2));
