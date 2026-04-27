import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const SYSTEM_TRUTH = "staffordos/system_map/system_map_truth_v1.json";
const LOG = "staffordos/agents/system_truth_sync_log_v1.json";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function runJson(command, fallback) {
  try {
    return JSON.parse(execSync(command, { encoding: "utf8" }).trim());
  } catch {
    return fallback;
  }
}

const capability = runJson("node staffordos/capabilities/capability_matrix_v1.mjs", null);
const revenue = runJson("node staffordos/agents/run_agent_v1.mjs revenue_agent_v1", null);

const revenueTruth = readJson("staffordos/revenue/revenue_truth_v1.json", {});
const existingTruth = readJson(SYSTEM_TRUTH, {});

const truth = {
  ...existingTruth,
  ok: true,
  artifact: "system_map_truth_v1",
  generated_at: new Date().toISOString(),
  source: "system_truth_sync_agent_v1",
  system_status: {
    capability_matrix_ok: Boolean(capability?.ok),
    capability_summary: capability?.summary || {},
    revenue_truth_ok: Boolean(revenueTruth?.ok),
    current_bottleneck: revenueTruth?.current_bottleneck || "unknown",
    next_actions: revenueTruth?.next_actions || []
  },
  latest_revenue_truth: revenueTruth,
  latest_capability_matrix: capability,
  operating_rule: "System truth reflects local StaffordOS files only. No fake metrics."
};

writeJson(SYSTEM_TRUTH, truth);

const log = readJson(LOG, []);
log.push({
  agent: "system_truth_sync_agent_v1",
  capability_matrix_ok: Boolean(capability?.ok),
  revenue_truth_ok: Boolean(revenueTruth?.ok),
  current_bottleneck: truth.system_status.current_bottleneck,
  at: new Date().toISOString()
});
writeJson(LOG, log);

console.log(JSON.stringify({
  ok: true,
  agent: "system_truth_sync_agent_v1",
  system_truth: SYSTEM_TRUTH,
  current_bottleneck: truth.system_status.current_bottleneck,
  next_actions: truth.system_status.next_actions
}, null, 2));
