import fs from "node:fs";
import {
  OUTPUT_PATH,
  runCleanupExecutionPackV2,
  writeCleanupExecutionPackV2,
} from "./cleanup_execution_pack_v2.js";

const result = runCleanupExecutionPackV2();
const outputPath = writeCleanupExecutionPackV2(result.markdown);
const exists = fs.existsSync(outputPath);

if (!exists) {
  console.error("=== CLEANUP EXECUTION PACK V2 ===");
  console.error("STATUS: FAIL");
  console.error(`OUTPUT FILE: ${outputPath}`);
  console.error(`EXISTS: ${exists}`);
  process.exit(1);
}

console.log("=== CLEANUP EXECUTION PACK V2 ===");
console.log("STATUS: PASS");
console.log(`OUTPUT FILE: ${outputPath}`);
console.log(`EXISTS: ${exists}`);
console.log(`BRANCH: ${result.branchName}`);
console.log(`COMMIT COUNT: ${result.commitCount}`);
console.log(`STASH COUNT: ${result.stashCount}`);
console.log(`IGNORE COUNT: ${result.ignoreCount}`);
console.log(`MANUAL DECISIONS: ${result.manualDecisionCount}`);
console.log(`PLAN: ${OUTPUT_PATH}`);
