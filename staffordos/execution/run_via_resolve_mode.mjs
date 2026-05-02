import { execSync } from "node:child_process";
import { resolveExecutionMode } from "./resolveExecutionMode.js";

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function killPort(port) {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore" });
    console.log(`→ Cleared port ${port}`);
  } catch {}
}

console.log("===== STAFFORDOS TRUE EXECUTION GATE =====");

const userCommand = process.argv.slice(2).join(" ");

if (!userCommand) {
  console.error("❌ No command provided");
  process.exit(1);
}

console.log("\n→ Resolving execution mode...");
const mode = resolveExecutionMode({ command: userCommand });

console.log("Mode:", mode);

const decision = String(mode.decision || "").toUpperCase();

if (mode.blocked || ["IGNORE", "BLOCK", "BLOCKED", "REJECT", "REJECTED"].includes(decision)) {
  console.error("❌ BLOCKED by execution mode");
  console.error("Decision:", mode.decision);
  console.error("Reasons:", mode.reasons || []);
  process.exit(1);
}

console.log("\n→ Running guardrails...");
run("node staffordos/guards/check_recovery_route_guardrail.mjs");

console.log("\n→ Preparing runtime...");
killPort(8081);
killPort(3000);

console.log("\n→ Executing...");
run(userCommand);

console.log("\n✅ Execution complete (true StaffordOS path)");
