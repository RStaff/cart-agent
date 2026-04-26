import { spawnSync } from "node:child_process";

const MAX_RUNS = 3;

function runLoop() {
  const result = spawnSync(
    "node",
    ["staffordos/agents/execution_loop_v2.mjs"],
    { encoding: "utf8" }
  );

  try {
    return JSON.parse(result.stdout);
  } catch {
    return {
      ok: false,
      error: "loop_parse_failed",
      raw: result.stdout
    };
  }
}

const runs = [];

for (let i = 0; i < MAX_RUNS; i++) {
  const loop = runLoop();

  runs.push(loop);

  if (!loop || !loop.iterations || loop.iterations.length === 0) {
    break;
  }

  const last = loop.iterations[loop.iterations.length - 1];

  if (loop.stopped_reason === "high_risk_agent_requires_manual_approval") {
    console.log(JSON.stringify({
      ok: true,
      driver: "execution_driver_v1",
      action: "needs_approval",
      recommendation: last
    }, null, 2));
    process.exit(0);
  }

  if (loop.stopped_reason === "no_progress_after_execution") {
    console.log(JSON.stringify({
      ok: true,
      driver: "execution_driver_v1",
      action: "stalled",
      recommendation: last
    }, null, 2));
    process.exit(0);
  }

  if (loop.stopped_reason === "completed") {
    console.log(JSON.stringify({
      ok: true,
      driver: "execution_driver_v1",
      action: "completed",
      recommendation: last
    }, null, 2));
    process.exit(0);
  }
}

console.log(JSON.stringify({
  ok: true,
  driver: "execution_driver_v1",
  action: "max_runs_reached",
  runs
}, null, 2));
