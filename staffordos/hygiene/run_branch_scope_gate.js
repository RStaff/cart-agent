import fs from "node:fs";
import {
  REPORT_PATH,
  renderBranchScopeReport,
  runBranchScopeGate,
  writeBranchScopeReport,
} from "./branch_scope_gate_v1.js";

const result = runBranchScopeGate();
const outputPath = writeBranchScopeReport(renderBranchScopeReport(result));
const exists = fs.existsSync(outputPath);

if (!exists) {
  console.error("=== BRANCH SCOPE GATE ===");
  console.error("STATUS: FAIL");
  console.error(`OUTPUT FILE: ${outputPath}`);
  console.error(`EXISTS: ${exists}`);
  process.exit(1);
}

console.log("=== BRANCH SCOPE GATE ===");
console.log("STATUS: PASS");
console.log(`OUTPUT FILE: ${outputPath}`);
console.log(`EXISTS: ${exists}`);
console.log(`BRANCH: ${result.branchName}`);
console.log(`PRIMARY CONCERN: ${result.scopeSummary.primaryConcern}`);
console.log(`MIXED SCOPE STATUS: ${result.scopeSummary.status}`);
console.log(`REPORT: ${REPORT_PATH}`);
