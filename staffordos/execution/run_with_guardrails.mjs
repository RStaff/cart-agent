import { execSync } from "node:child_process";

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function killPort(port) {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore" });
    console.log(`→ Cleared port ${port}`);
  } catch {}
}

console.log("===== STAFFORDOS EXECUTION GATE =====");

console.log("\n→ Running guardrails...");
run("node staffordos/guards/check_recovery_route_guardrail.mjs");

console.log("\n→ Preparing runtime...");
killPort(8081);   // backend
killPort(3000);   // frontend safety

console.log("\n→ Guardrails passed. Executing slice...");

const userCommand = process.argv.slice(2).join(" ");

if (!userCommand) {
  console.error("❌ No command provided to execute");
  process.exit(1);
}

run(userCommand);

console.log("\n✅ Execution complete under StaffordOS guardrails");
