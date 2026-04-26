import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();

const REGISTRY_PATH = path.join(ROOT, "staffordos/agents/agent_registry_v1.json");
const EXECUTION_LOG_PATH = path.join(ROOT, "staffordos/agents/agent_execution_log_v1.json");

const [, , agentId, ...agentArgs] = process.argv;

function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function usage() {
  console.log(`Usage:
  node staffordos/agents/run_agent_v1.mjs <agent_id> [agent args...]

Examples:
  node staffordos/agents/run_agent_v1.mjs message_validation_agent_v1
  node staffordos/agents/run_agent_v1.mjs send_execution_agent_v1
  node staffordos/agents/run_agent_v1.mjs send_execution_agent_v1 --execute

High-risk agents require --approved-by-ross.`);
}

function fail(message, code = 1) {
  console.error(`❌ ${message}`);
  process.exit(code);
}

if (!agentId || agentId === "help") {
  usage();
  process.exit(agentId ? 0 : 1);
}

const registry = readJson(REGISTRY_PATH, null);

if (!registry || !Array.isArray(registry.agents)) {
  fail(`Missing or invalid registry: ${REGISTRY_PATH}`);
}

const agent = registry.agents.find((a) => a.id === agentId);

if (!agent) {
  fail(`Agent not registered: ${agentId}`);
}

if (!agent.entrypoint) {
  fail(`Agent missing entrypoint: ${agentId}`);
}

const entrypoint = path.join(ROOT, agent.entrypoint);

if (!existsSync(entrypoint)) {
  fail(`Agent entrypoint does not exist: ${agent.entrypoint}`);
}

const approved = agentArgs.includes("--approved-by-ross");
const executeMode = agentArgs.includes("--execute");

if (agent.requires_approval && !approved) {
  fail(
    `Blocked: ${agentId} is ${agent.risk_level} risk and requires --approved-by-ross. Nothing executed.`
  );
}

if (executeMode && agent.forbidden_actions?.includes("write_truth") && agent.allowed_actions?.includes("write_truth") === false) {
  fail(`Blocked: ${agentId} attempted execute mode without write_truth permission.`);
}

// Only block email sending for agents that are actually trying to send.
// Non-email agents may still use --execute to write safe state changes.
if (
  executeMode &&
  agent.forbidden_actions?.includes("send_email") &&
  agent.allowed_actions?.includes("send_email")
) {
  fail(`Blocked: ${agentId} has conflicting send_email permissions.`);
}

const safeArgs = agentArgs.filter((arg) => arg !== "--approved-by-ross");

const startedAt = new Date().toISOString();

const result = spawnSync("node", [agent.entrypoint, ...safeArgs], {
  cwd: ROOT,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  env: process.env,
});

const finishedAt = new Date().toISOString();

const event = {
  generated_at: finishedAt,
  agent_id: agent.id,
  entrypoint: agent.entrypoint,
  department: agent.department,
  risk_level: agent.risk_level,
  requires_approval: agent.requires_approval,
  approved_by_ross: approved,
  args: safeArgs,
  started_at: startedAt,
  finished_at: finishedAt,
  exit_code: result.status,
  ok: result.status === 0,
  stdout_preview: String(result.stdout || "").slice(0, 2000),
  stderr_preview: String(result.stderr || "").slice(0, 2000),
};

const log = readJson(EXECUTION_LOG_PATH, []);
log.push(event);
writeJson(EXECUTION_LOG_PATH, log);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status !== 0) {
  console.error(`❌ Agent failed through execution gate: ${agentId}`);
  process.exit(result.status || 1);
}

console.log(JSON.stringify({
  ok: true,
  gate: "run_agent_v1",
  agent_id: agent.id,
  risk_level: agent.risk_level,
  approved_by_ross: approved,
  exit_code: result.status,
  execution_logged: EXECUTION_LOG_PATH,
}, null, 2));
