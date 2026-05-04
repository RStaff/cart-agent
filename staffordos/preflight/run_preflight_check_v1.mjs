import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const now = new Date().toISOString();

mkdirSync("staffordos/preflight/output", { recursive: true });

const requiredFiles = {
  agent_inventory: "staffordos/system_inventory/output/agent_inventory_v1.json",
  validator_map: "staffordos/qa/validator_map_v1.json",
  qa_gate: "staffordos/qa/"
};

const findings = [];

function check(path, name) {
  if (!existsSync(path)) {
    findings.push({
      severity: "critical",
      missing: name,
      path
    });
  }
}

check(requiredFiles.agent_inventory, "agent_inventory");
check(requiredFiles.validator_map, "validator_map");

const passed = findings.length === 0;

const report = {
  schema: "staffordos.preflight_report.v1",
  generated_at: now,
  status: passed ? "GO" : "BLOCKED",
  findings
};

writeFileSync(
  "staffordos/preflight/output/preflight_report_v1.json",
  JSON.stringify(report, null, 2)
);

console.log(JSON.stringify(report, null, 2));

if (!passed) {
  console.log("\n❌ PRE-FLIGHT FAILED — DO NOT PROCEED\n");
  process.exit(1);
} else {
  console.log("\n✅ PRE-FLIGHT PASSED — SAFE TO EXECUTE\n");
}
