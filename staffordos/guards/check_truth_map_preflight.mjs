import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const truthFiles = [
  "staffordos/system_inventory/output/truth_graph_pass_4_promoted_v1.json",
  "staffordos/system_inventory/output/execution_proof_register_v1.json",
  "staffordos/system_inventory/abando_canonical_proof_path_map_v1.mjs",
  "staffordos/system_map/system_map_truth_v1.json"
];

const requiredOwners = [
  "web/src/routes/recoveryLiveTest.esm.js",
  "web/src/lib/abandoRecoverySender.js",
  "staffordos/guards/check_recovery_route_guardrail.mjs"
];

const failures = [];
const foundTruthFiles = truthFiles.filter(existsSync);

if (foundTruthFiles.length === 0) {
  failures.push("No StaffordOS truth map/proof registry files found.");
}

for (const owner of requiredOwners) {
  if (!existsSync(owner)) {
    failures.push(`Missing canonical owner file: ${owner}`);
  }
}

const routeText = existsSync("web/src/routes/recoveryLiveTest.esm.js")
  ? readFileSync("web/src/routes/recoveryLiveTest.esm.js", "utf8")
  : "";

if (routeText.includes('status: "PASS"')) {
  failures.push("Legacy fake PASS status still exists in recovery route.");
}

if (!routeText.includes("REAL_SEND_SUCCEEDED")) {
  failures.push("Recovery route does not produce REAL_SEND_SUCCEEDED proof.");
}

if (!routeText.includes("sendAbandoRecoveryEmail")) {
  failures.push("Recovery route is not wired to canonical Abando sender.");
}

const report = {
  generated_at: new Date().toISOString(),
  status: failures.length ? "FAILED" : "PASSED",
  found_truth_files: foundTruthFiles,
  required_owners: requiredOwners,
  failures
};

mkdirSync("staffordos/execution/output", { recursive: true });
writeFileSync(
  "staffordos/execution/output/truth_map_preflight_latest.json",
  JSON.stringify(report, null, 2) + "\n"
);

if (failures.length) {
  console.error("❌ Truth map preflight failed:");
  for (const failure of failures) console.error("-", failure);
  process.exit(1);
}

console.log("✅ Truth map preflight passed");
console.log(JSON.stringify(report, null, 2));
