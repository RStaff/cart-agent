import fs from "node:fs";
import {
  OUTPUT_PLAN_PATH,
  runCleanupExecutionPack,
  writeCleanupExecutionPlan,
} from "./cleanup_execution_pack_v1.js";

const result = runCleanupExecutionPack();
const outputPath = writeCleanupExecutionPlan(result.markdown);
const exists = fs.existsSync(outputPath);

if (!exists) {
  console.error("=== CLEANUP EXECUTION PACK ===");
  console.error("STATUS: FAIL");
  console.error(`ERROR: cleanup_execution_plan.md was not created at ${outputPath}`);
  console.error(`OUTPUT FILE: ${outputPath}`);
  console.error(`EXISTS: ${exists}`);
  process.exit(1);
}

console.log("=== CLEANUP EXECUTION PACK ===");
console.log("STATUS: PASS");
console.log(`OUTPUT FILE: ${outputPath}`);
console.log(`EXISTS: ${exists}`);
console.log(`TOTAL ACTIONS: ${result.totalActions}`);
console.log(`CRITICAL DECISIONS: ${result.criticalDecisions}`);
console.log(`PLAN: ${outputPath}`);
