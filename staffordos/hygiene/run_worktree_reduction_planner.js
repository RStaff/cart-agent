import fs from "node:fs";
import {
  OUTPUT_PLAN_PATH,
  runWorktreeReductionPlanner,
  writeWorktreeReductionPlan,
} from "./worktree_reduction_planner_v2.js";

const result = runWorktreeReductionPlanner();
const outputPath = writeWorktreeReductionPlan(result.markdown);
const exists = fs.existsSync(outputPath);

if (!exists) {
  console.error("=== WORKTREE REDUCTION PLANNER ===");
  console.error("STATUS: FAIL");
  console.error(`OUTPUT FILE: ${outputPath}`);
  console.error(`EXISTS: ${exists}`);
  process.exit(1);
}

console.log("=== WORKTREE REDUCTION PLANNER ===");
console.log("STATUS: PASS");
console.log(`OUTPUT FILE: ${outputPath}`);
console.log(`EXISTS: ${exists}`);
console.log(`BRANCH: ${result.branch}`);
console.log(`TOTAL CHANGED PATHS: ${result.totalChangedPaths}`);
console.log(`COMMIT NOW: ${result.grouped.COMMIT_NOW.length}`);
console.log(`STASH NOW: ${result.grouped.STASH_NOW.length}`);
console.log(`IGNORE PERMANENTLY: ${result.grouped.IGNORE_PERMANENTLY.length}`);
console.log(`MANUAL DECISIONS: ${result.grouped.MANUAL_DECISION_REQUIRED.length}`);
console.log(`PLAN: ${OUTPUT_PLAN_PATH}`);
