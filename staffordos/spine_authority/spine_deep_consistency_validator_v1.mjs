import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const paths = {
  resolver: "staffordos/operator_daemon/task_command_resolver_v1.mjs",
  taskToAgentMap: "staffordos/agents/task_to_agent_map_v1.json",
  agentRegistry: "staffordos/agents/agent_registry_v1.json",
  validatorMap: "staffordos/operator_daemon/output/validator_map_refresh_v1.json",
  routerBinding: "staffordos/operator_daemon/output/router_to_gated_runner_binding_v1.json",
  routerDecisionAgentBinding: "staffordos/operator_daemon/output/router_decision_agent_binding_v1.json",
  aliasMap: "staffordos/spine_authority/agent_role_alias_map_v1.json"
};

function readJson(p) {
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}

function readText(p) {
  return existsSync(p)
    ? readFileSync(p, "utf8").replace(/\u00a0/g, " ")
    : "";
}

const failures = [];
const warnings = [];

function fail(x) { failures.push(x); }
function warn(x) { warnings.push(x); }

for (const [key, p] of Object.entries(paths)) {
  if (!existsSync(p)) fail(`missing_file:${key}:${p}`);
}

const resolverText = readText(paths.resolver);
const taskMap = readJson(paths.taskToAgentMap);
const agentRegistry = readJson(paths.agentRegistry);
const validatorMap = readJson(paths.validatorMap);
const routerBinding = readJson(paths.routerBinding);
const routerDecision = readJson(paths.routerDecisionAgentBinding);
const aliasMap = readJson(paths.aliasMap)?.aliases || {};

const resolverTasks = Array.from(
  new Set(
    [...resolverText.matchAll(/^\s*([a-zA-Z0-9_]+):\s*\{/gm)]
      .map(m => m[1])
      .filter(t => !["schema", "proof", "checks", "binding", "sources", "enforcement"].includes(t))
  )
);

const taskMappings = Array.isArray(taskMap?.task_mappings) ? taskMap.task_mappings : [];
const mappedTasks = taskMappings.map(t => t.task_type).filter(Boolean);
const registeredAgents = new Set((agentRegistry?.agents || []).map(a => a.id));
const validatorTasks = Object.keys(validatorMap?.task_validators || {});

function resolveAgentRole(role) {
  if (Object.prototype.hasOwnProperty.call(aliasMap, role)) {
    return aliasMap[role];
  }
  return role;
}

for (const mapping of taskMappings) {
  for (const role of mapping.required_agents || []) {
    const resolved = resolveAgentRole(role);

    if (resolved === null) {
      warn(`agent_role_alias_unresolved:${mapping.task_type}:${role}`);
    } else if (!registeredAgents.has(resolved)) {
      fail(`agent_role_alias_points_to_missing_agent:${mapping.task_type}:${role}->${resolved}`);
    }
  }
}

for (const task of resolverTasks) {
  if (!validatorTasks.includes(task)) {
    warn(`resolver_task_missing_validator_map:${task}`);
  }
  if (!mappedTasks.includes(task)) {
    warn(`resolver_task_missing_required_agent_mapping:${task}`);
  }
}

for (const task of validatorTasks) {
  if (!resolverTasks.includes(task)) {
    warn(`validator_map_task_missing_resolver_mapping:${task}`);
  }
}

for (const task of mappedTasks) {
  if (!resolverTasks.includes(task)) {
    warn(`task_to_agent_task_missing_resolver_mapping:${task}`);
  }
}

for (const [task, config] of Object.entries(validatorMap?.task_validators || {})) {
  if (!config.expected_artifact) fail(`validator_missing_expected_artifact:${task}`);
  if (!config.validation_owner) fail(`validator_missing_validation_owner:${task}`);
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
