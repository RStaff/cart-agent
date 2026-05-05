import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const paths = {
  manifest: "staffordos/spine_authority/spine_authority_manifest_v1.json",
  resolver: "staffordos/operator_daemon/task_command_resolver_v1.mjs",
  taskToAgentMap: "staffordos/agents/task_to_agent_map_v1.json",
  agentRegistry: "staffordos/agents/agent_registry_v1.json",
  validatorMap: "staffordos/operator_daemon/output/validator_map_refresh_v1.json",
  routerBinding: "staffordos/operator_daemon/output/router_to_gated_runner_binding_v1.json",
  routerDecisionAgentBinding: "staffordos/operator_daemon/output/router_decision_agent_binding_v1.json"
};

function readJson(p) {
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

function readText(p) {
  return existsSync(p) ? readFileSync(p, "utf8").replace(/\u00a0/g, " ") : "";
}

const manifest = readJson(paths.manifest);
const taskMap = readJson(paths.taskToAgentMap);
const agentRegistry = readJson(paths.agentRegistry);
const validatorMap = readJson(paths.validatorMap);
const routerBinding = readJson(paths.routerBinding);
const routerDecision = readJson(paths.routerDecisionAgentBinding);
const resolverText = readText(paths.resolver);

const failures = [];
const warnings = [];

function fail(x) { failures.push(x); }
function warn(x) { warnings.push(x); }

for (const [k, p] of Object.entries(paths)) {
  if (!existsSync(p)) fail(`missing_file:${k}:${p}`);
}

const resolverTaskMatches = [...resolverText.matchAll(/^\s*([a-zA-Z0-9_]+):\s*\{/gm)]
  .map(m => m[1])
  .filter(t => !["schema", "proof", "checks", "binding", "sources", "enforcement"].includes(t));

const resolverTasks = Array.from(new Set(resolverTaskMatches));

const taskMappings = Array.isArray(taskMap?.task_mappings) ? taskMap.task_mappings : [];
const mappedTasks = taskMappings.map(t => t.task_type).filter(Boolean);

const registeredAgents = new Set((agentRegistry?.agents || []).map(a => a.id));
const validatorTasks = Object.keys(validatorMap?.task_validators || {});

for (const t of resolverTasks) {
  if (!validatorTasks.includes(t)) {
    warn(`resolver_task_missing_validator_map:${t}`);
  }
}

for (const t of validatorTasks) {
  if (!resolverTasks.includes(t)) {
    warn(`validator_map_task_missing_resolver_mapping:${t}`);
  }
}

for (const t of mappedTasks) {
  if (!resolverTasks.includes(t)) {
    warn(`task_to_agent_task_missing_resolver_mapping:${t}`);
  }
}

for (const t of resolverTasks) {
  if (!mappedTasks.includes(t)) {
    warn(`resolver_task_missing_required_agent_mapping:${t}`);
  }
}

for (const mapping of taskMappings) {
  for (const agent of mapping.required_agents || []) {
    if (!registeredAgents.has(agent)) {
      fail(`required_agent_not_registered:${mapping.task_type}:${agent}`);
    }
  }
}

for (const [task, config] of Object.entries(validatorMap?.task_validators || {})) {
  if (!config.expected_artifact) {
    fail(`validator_missing_expected_artifact:${task}`);
  }
  if (!config.validation_owner) {
    fail(`validator_missing_validation_owner:${task}`);
  }
}

if (routerBinding?.binding?.execution_path !== "staffordos/operator_daemon/run_task_with_commit_gate_v1.sh") {
  fail("router_binding_execution_path_not_gated_runner");
}

if (routerBinding?.binding?.direct_git_commit_allowed !== false) {
  fail("router_binding_allows_direct_git_commit");
}

if (!routerBinding?.rules?.some(r => String(r).includes("must not bypass run_agent_loop"))) {
  fail("router_binding_missing_no_bypass_run_agent_loop_rule");
}

if (routerDecision?.binding_model?.gated_commit_owner !== "staffordos/operator_daemon/run_task_with_commit_gate_v1.sh") {
  fail("router_decision_binding_gated_commit_owner_mismatch");
}

const result = {
  schema: "staffordos.spine_deep_consistency_validator.v1",
  generated_at: new Date().toISOString(),
  status: failures.length ? "failed" : warnings.length ? "passed_with_warnings" : "passed",
  counts: {
    resolver_tasks: resolverTasks.length,
    task_to_agent_mappings: mappedTasks.length,
    registered_agents: registeredAgents.size,
    validator_mapped_tasks: validatorTasks.length,
    failures: failures.length,
    warnings: warnings.length
  },
  resolver_tasks: resolverTasks,
  validator_tasks: validatorTasks,
  mapped_tasks: mappedTasks,
  failures,
  warnings,
  proof: {
    validation_only: true,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/spine_deep_consistency_validator_v1.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

if (failures.length) process.exit(1);
