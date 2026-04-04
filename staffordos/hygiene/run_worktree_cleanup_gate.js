import {
  REPORT_PATH,
  renderWorktreeCleanupGateReport,
  runWorktreeCleanupGate,
  writeWorktreeCleanupGateReport,
} from "./worktree_cleanup_gate_v1.js";

const result = runWorktreeCleanupGate();
writeWorktreeCleanupGateReport(renderWorktreeCleanupGateReport(result));

console.log("=== WORKTREE CLEANUP GATE ===");
console.log(`STATUS: ${result.status}`);
console.log("ALLOWED NEXT STEP:");
console.log(`- ${result.allowedNextStep}`);
console.log("BLOCKED NEXT STEP:");
console.log(`- ${result.blockedNextStep}`);
console.log("TOP ACTIONS:");
for (const action of result.recommendedActions) {
  console.log(`- ${action}`);
}
console.log(`REPORT: ${REPORT_PATH}`);
