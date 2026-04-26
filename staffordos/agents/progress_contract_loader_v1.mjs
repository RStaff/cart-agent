import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTRACT_PATH = path.join(ROOT, "staffordos/agents/progress_contract_v1.json");

export function loadProgressContract() {
  if (!existsSync(CONTRACT_PATH)) {
    return {
      ok: false,
      error: "progress_contract_missing",
      path: CONTRACT_PATH,
      contracts: []
    };
  }

  try {
    const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
    return {
      ok: true,
      path: CONTRACT_PATH,
      version: contract.version,
      contracts: Array.isArray(contract.contracts) ? contract.contracts : []
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      path: CONTRACT_PATH,
      contracts: []
    };
  }
}

export function getProgressContractForAgent(agentId) {
  const loaded = loadProgressContract();

  if (!loaded.ok) return loaded;

  const contract = loaded.contracts.find((item) => item.agent_id === agentId);

  if (!contract) {
    return {
      ok: false,
      error: "agent_progress_contract_missing",
      agent_id: agentId,
      path: loaded.path
    };
  }

  return {
    ok: true,
    path: loaded.path,
    contract
  };
}
