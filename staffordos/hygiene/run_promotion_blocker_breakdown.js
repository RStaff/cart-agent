import fs from "node:fs";
import {
  OUTPUT_PATH,
  runPromotionBlockerBreakdown,
  writePromotionBlockerBreakdown,
} from "./promotion_blocker_breakdown_v1.js";

const result = runPromotionBlockerBreakdown();
const outputPath = writePromotionBlockerBreakdown(result.markdown);
const exists = fs.existsSync(outputPath);

if (!exists) {
  console.error("=== PROMOTION BLOCKER BREAKDOWN ===");
  console.error("STATUS: FAIL");
  console.error(`OUTPUT FILE: ${outputPath}`);
  console.error(`EXISTS: ${exists}`);
  process.exit(1);
}

const topBlockers = [
  ...result.grouped.HYGIENE_BLOCKERS,
  ...result.grouped.DEPLOY_BLOCKERS,
  ...result.grouped.PRODUCT_BLOCKERS,
  ...result.grouped.ENVIRONMENT_BLOCKERS,
  ...result.grouped.GOVERNANCE_BLOCKERS,
].slice(0, 3);

console.log("=== PROMOTION BLOCKER BREAKDOWN ===");
console.log(`STATUS: ${result.status}`);
console.log(`CURRENT OPERATING STATE: ${result.currentOperatingState}`);
console.log(`DEPLOYMENT STATE: ${result.deploymentState}`);
console.log(`MERCHANT PROOF STATE: ${result.merchantProofState}`);
console.log(`PROMOTION STATE: ${result.status}`);
console.log("TOP BLOCKERS:");
for (const blocker of topBlockers) {
  console.log(`- ${blocker.blockerName}`);
}
console.log("NEXT RESOLUTION ORDER:");
for (const item of result.nextOrder) {
  console.log(`- ${item}`);
}
console.log(`OUTPUT FILE: ${OUTPUT_PATH}`);
console.log(`EXISTS: ${exists}`);
