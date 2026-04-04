import fs from "node:fs";
import {
  OUTPUT_REPORT_PATH,
  runOperatorFrontDoor,
  writeOperatorFrontDoorReport,
} from "./operator_frontdoor_v1.js";

const result = runOperatorFrontDoor();
const outputPath = writeOperatorFrontDoorReport(result.markdown);
const exists = fs.existsSync(outputPath);

if (!exists) {
  console.error("=== OPERATOR FRONT DOOR ===");
  console.error("STATUS: FAIL");
  console.error(`REPORT: ${outputPath}`);
  process.exit(1);
}

console.log("=== OPERATOR FRONT DOOR ===");
console.log("");
console.log(`MACHINE ROLE: ${result.machineRole}`);
console.log(`CURRENT OPERATING STATE: ${result.currentOperatingState}`);
console.log(`DEPLOYMENT STATE: ${result.deploymentState}`);
console.log(`MERCHANT PROOF STATE: ${result.merchantProofState}`);
console.log(`PROMOTION STATE: ${result.promotionState}`);
console.log("");
console.log("TOP BLOCKERS:");
for (const blocker of result.topBlockers) {
  console.log(`- ${blocker}`);
}
console.log("");
console.log("EXACT NEXT ACTION:");
console.log(`- ${result.exactNextAction}`);
console.log("");
console.log("SECONDARY ACTIONS:");
for (const action of result.secondaryActions) {
  console.log(`- ${action}`);
}
console.log("");
console.log(`REPORT: ${OUTPUT_REPORT_PATH}`);
