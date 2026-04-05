import {
  OUTPUT_PATH,
  runMerchantProofLoopCompletionPack,
  writeMerchantProofLoopCompletionPack,
} from "./merchant_proof_loop_completion_pack_v1.js";
import fs from "node:fs";

try {
  const result = runMerchantProofLoopCompletionPack();
  const outputPath = writeMerchantProofLoopCompletionPack(result.markdown);
  const exists = fs.existsSync(outputPath);
  if (!exists) {
    throw new Error(`Missing output file: ${outputPath}`);
  }

  console.log("=== MERCHANT PROOF LOOP COMPLETION PACK ===");
  console.log(`STATUS: ${result.status}`);
  console.log(`PRIMARY TARGET SHOP: ${result.primaryTargetShop}`);
  console.log("EXACT NEXT ACTION:");
  console.log(`- ${result.exactNextAction}`);
  console.log(`OUTPUT FILE: ${outputPath}`);
  console.log(`EXISTS: ${exists}`);
} catch (error) {
  console.log("=== MERCHANT PROOF LOOP COMPLETION PACK ===");
  console.log("STATUS: FAIL");
  console.log(`OUTPUT FILE: ${OUTPUT_PATH}`);
  console.log(`EXISTS: ${fs.existsSync(OUTPUT_PATH)}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
