import { execSync, spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolveExecutionMode } from "./resolveExecutionMode.js";

const args = process.argv.slice(2);
const operatorApproved = args.includes("--operator-approved");
const command = args.filter((a) => a !== "--operator-approved").join(" ");

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function killPort(port) {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore" });
    console.log(`→ Cleared port ${port}`);
  } catch {}
}

function writeProof(proof) {
  mkdirSync("staffordos/execution/output", { recursive: true });
  writeFileSync(
    "staffordos/execution/output/agent_loop_latest.json",
    JSON.stringify(proof, null, 2) + "\n"
  );
}

console.log("===== STAFFORDOS AGENT LOOP =====");

if (!command) {
  console.error("❌ No command provided");
  process.exit(1);
}

const proof = {
  generated_at: new Date().toISOString(),
  command,
  operatorApproved,
  stages: [],
  status: "STARTED",
};

console.log("\n1) Resolving execution mode...");
const mode = resolveExecutionMode({ command });
proof.mode = mode;
proof.stages.push("mode_resolved");

console.log("Mode:", mode);

const decision = String(mode.decision || "").toUpperCase();
const blockedDecision = mode.blocked || ["IGNORE", "BLOCK", "BLOCKED", "REJECT", "REJECTED"].includes(decision);

if (blockedDecision && !operatorApproved) {
  proof.status = "BLOCKED_BY_EXECUTION_MODE";
  proof.completed_at = new Date().toISOString();
  writeProof(proof);

  console.error("❌ BLOCKED by execution mode");
  console.error("Decision:", mode.decision);
  console.error("Reasons:", mode.reasons || []);
  console.error("");
  console.error("To override as operator, rerun with: --operator-approved");
  process.exit(1);
}

if (blockedDecision && operatorApproved) {
  console.log("⚠️ Operator override accepted for low-score/ignored command.");
  proof.stages.push("operator_override_accepted");
}

console.log("\n2) Running truth map preflight...");
run("node staffordos/guards/check_truth_map_preflight.mjs");

console.log("\n3) Running guardrails...");
run("node staffordos/guards/check_recovery_route_guardrail.mjs");
proof.stages.push("truth_map_preflight_passed", "guardrails_passed");

console.log("\n3) Preparing runtime truth...");
if (command.includes("npm --prefix web run dev") || command.includes("node src/index.js")) {
  killPort(8081);
}
if (command.includes("npm --prefix abando-frontend") || command.includes("PORT=3000")) {
  killPort(3000);
}
proof.stages.push("runtime_prepared");

console.log("\n4) Executing command...");
proof.status = "EXECUTING";
writeProof(proof);

const child = spawn(command, {
  shell: true,
  stdio: "inherit",
});

child.on("exit", (code) => {
  proof.completed_at = new Date().toISOString();
  proof.exit_code = code;
  proof.status = code === 0 ? "COMPLETED" : "FAILED";
  proof.stages.push("execution_finished");
  writeProof(proof);
  process.exit(code ?? 1);
});
