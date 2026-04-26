import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTRACT_PATH = path.join(ROOT, "staffordos/agents/progress_contract_v1.json");
const REGISTRY_PATH = path.join(ROOT, "staffordos/agents/agent_registry_v1.json");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, "utf8"));
}

const contract = readJson(CONTRACT_PATH, null);
const registry = readJson(REGISTRY_PATH, { agents: [] });

if (!contract) {
  fail("Missing progress_contract_v1.json");
  process.exit(1);
}

const contracts = Array.isArray(contract.contracts) ? contract.contracts : [];
const registryAgents = Array.isArray(registry.agents) ? registry.agents : [];

const contractIds = new Set();

for (const item of contracts) {
  if (!item.agent_id) fail("Contract missing agent_id.");
  if (contractIds.has(item.agent_id)) fail(`Duplicate progress contract: ${item.agent_id}`);
  contractIds.add(item.agent_id);

  if (!Array.isArray(item.expected_progress) || item.expected_progress.length === 0) {
    fail(`${item.agent_id} missing expected_progress.`);
  }

  for (const progress of item.expected_progress || []) {
    if (!progress.metric) fail(`${item.agent_id} progress missing metric.`);
    if (!progress.direction) fail(`${item.agent_id} progress missing direction.`);
  }

  if (!item.acceptable_no_progress_reason) {
    fail(`${item.agent_id} missing acceptable_no_progress_reason.`);
  }
}

for (const agent of registryAgents) {
  if (agent.department === "revenue" && !contractIds.has(agent.id)) {
    fail(`Revenue agent missing progress contract: ${agent.id}`);
  }
}

if (process.exitCode) {
  console.error("Progress contract validation failed.");
  process.exit(process.exitCode);
}

console.log(JSON.stringify({
  ok: true,
  contract: CONTRACT_PATH,
  contracts: contracts.length,
  registry_revenue_agents: registryAgents.filter((a) => a.department === "revenue").length
}, null, 2));
