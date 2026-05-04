import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const now = new Date().toISOString();

mkdirSync("staffordos/execution/output", { recursive: true });

function readJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

const taskType = process.argv[2] || "primary_action_execution";

const selector = readJson("staffordos/agents/agent_selector_v1.json", { agents: [] });
const map = readJson("staffordos/agents/task_to_agent_map_v1.json", { task_mappings: [] });

const mapping = (map.task_mappings || []).find((m) => m.task_type === taskType);
const available = new Set((selector.agents || []).map((a) => a.agent_id));

const requiredAgents = mapping?.required_agents || [];
const missingAgents = requiredAgents.filter((agentId) => !available.has(agentId));

const report = {
  schema: "staffordos.required_agent_validation.v1",
  generated_at: now,
  task_type: taskType,
  status: mapping && missingAgents.length === 0 ? "GO" : "BLOCKED",
  required_agents: requiredAgents,
  missing_agents: missingAgents,
  mapping_found: Boolean(mapping)
};

writeFileSync(
  "staffordos/execution/output/required_agent_validation_v1.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));

if (report.status !== "GO") process.exit(1);
