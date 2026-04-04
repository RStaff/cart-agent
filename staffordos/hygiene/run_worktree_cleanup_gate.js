import fs from "node:fs";
import {
  REPORT_PATH,
  renderWorktreeCleanupGateReport,
  runWorktreeCleanupGate,
  writeWorktreeCleanupGateReport,
} from "./worktree_cleanup_gate_v1.js";

const result = runWorktreeCleanupGate();
const outputPath = writeWorktreeCleanupGateReport(renderWorktreeCleanupGateReport(result));
const exists = fs.existsSync(outputPath);

if (!exists) {
  console.error("=== WORKTREE CLEANUP GATE ===");
  console.error("STATUS: FAIL");
  console.error(`OUTPUT FILE: ${outputPath}`);
  console.error(`EXISTS: ${exists}`);
  process.exit(1);
}

console.log("=== WORKTREE CLEANUP GATE ===");
console.log("STATUS: PASS");
console.log(`OUTPUT FILE: ${outputPath}`);
console.log(`EXISTS: ${exists}`);
console.log(`CURRENT OPERATING STATE: ${result.currentOperatingState}`);
console.log(`DEPLOYMENT STATE: ${result.deploymentState}`);
console.log(`MERCHANT PROOF STATE: ${result.merchantProofState}`);
console.log(`PROMOTION STATE: ${result.promotionState}`);
console.log("ALLOWED NEXT STEP:");
console.log(`- ${result.allowedNextStep}`);
console.log("BLOCKED NEXT STEP:");
console.log(`- ${result.blockedNextStep}`);
console.log("TOP ACTIONS:");
for (const action of result.recommendedActions) {
  console.log(`- ${action}`);
}
console.log(`REPORT: ${REPORT_PATH}`);
