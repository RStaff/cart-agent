import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const CONFIG_PATH = "staffordos/operator_daemon/operator_daemon_config_v1.json";
const STATE_PATH = "staffordos/operator_daemon/operator_daemon_state_v1.json";
const HEARTBEAT_PATH = "staffordos/operator_daemon/output/operator_heartbeat_v1.json";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function safeRun(cmd) {
  try {
    execSync(cmd, { stdio: "ignore" });
    return "ok";
  } catch {
    return "fail";
  }
}

async function main() {
  if (!existsSync(CONFIG_PATH)) {
    console.error("❌ Missing config");
    process.exit(1);
  }

  let config = readJson(CONFIG_PATH);
  let state = readJson(STATE_PATH);

  state.started_at = new Date().toISOString();
  state.status = "running";
  writeJson(STATE_PATH, state);

  console.log("===== STAFFORDOS PERSISTENT OPERATOR STARTED =====");

  while (state.loops_run < config.max_loops) {
    const now = new Date().toISOString();

    console.log(`\n===== LOOP ${state.loops_run + 1} =====`);

    let stages = [];
    let status = "ok";

    try {
      // 1. Preflight
      console.log("→ preflight");
      safeRun("node staffordos/preflight/run_preflight_check_v1.mjs");
      stages.push("preflight");

      // 2. Required agents
      console.log("→ required agent validation");
      safeRun("node staffordos/execution/validate_required_agents_v1.mjs primary_action_execution");
      stages.push("agent_validation");

      // 3. Resolve primary action snapshot
      console.log("→ refresh primary action");
      safeRun("node staffordos/decision/resolve_primary_action_v1.mjs");
      stages.push("primary_action");

      // 4. Run canonical spine (SAFE MODE)
      console.log("→ run agent loop (safe)");
      if (config.auto_execute) {
        run(`node staffordos/execution/run_agent_loop.mjs "echo safe execution" --qa-profile=${config.qa_profile}`);
      } else {
        run(`node staffordos/execution/run_agent_loop.mjs "echo observe only" --qa-profile=${config.qa_profile} --operator-approved`);
      }
      stages.push("agent_loop");

      // 5. Loop D feedback
      console.log("→ loop D");
      safeRun("node staffordos/loop_d/build_loop_d_feedback_v1.mjs");
      stages.push("loop_d");

      // 6. Runtime sync agents
      console.log("→ runtime sync");
      safeRun("node scripts/leads/sync_runtime_to_lead_registry.mjs");
      safeRun("node staffordos/agents/system_truth_sync_agent_v1.mjs");
      stages.push("runtime_sync");

      // 7. QA validation
      console.log("→ QA");
      safeRun("node staffordos/qa/runtime_qa_agent_v1.mjs operator_runtime");
      stages.push("qa");

    } catch (e) {
      status = "error";
      console.error("❌ loop failure", e.message);
    }

    const heartbeat = {
      schema: "staffordos.operator_heartbeat.v1",
      generated_at: now,
      loop: state.loops_run + 1,
      status,
      stages,
      safe_mode: config.safe_mode,
      auto_execute: config.auto_execute
    };

    writeJson(HEARTBEAT_PATH, heartbeat);

    state.loops_run += 1;
    state.last_run = now;
    writeJson(STATE_PATH, state);

    console.log("✓ loop complete");

    await sleep(config.loop_interval_ms);
  }

  state.status = "completed";
  writeJson(STATE_PATH, state);
}

main();
