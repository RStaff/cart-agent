import {
  OUTPUT_PLAN_PATH,
  runCleanupExecutionPack,
  writeCleanupExecutionPlan,
} from "./cleanup_execution_pack_v1.js";

const result = runCleanupExecutionPack();
writeCleanupExecutionPlan(result.markdown);

console.log("=== CLEANUP EXECUTION PACK ===");
console.log(`STATUS: ${result.status}`);
console.log(`TOTAL ACTIONS: ${result.totalActions}`);
console.log(`CRITICAL DECISIONS: ${result.criticalDecisions}`);
console.log(`PLAN: ${OUTPUT_PLAN_PATH}`);
