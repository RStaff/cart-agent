import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const HYGIENE_DIR = path.join(CANONICAL_ROOT, "staffordos/hygiene");
const HYGIENE_REPORT_PATH = path.join(HYGIENE_DIR, "hygiene_report_v1.json");
const CLEANUP_GATE_REPORT_PATH = path.join(HYGIENE_DIR, "worktree_cleanup_gate_report.md");
const OUTPUT_REPORT_PATH = path.join(HYGIENE_DIR, "promotion_readiness_report.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function runNode(scriptName) {
  execFileSync("node", [path.join(HYGIENE_DIR, scriptName)], {
    cwd: CANONICAL_ROOT,
    stdio: "inherit",
  });
}

function extractCleanupStatus(markdown) {
  const match = markdown.match(/- Status:\s+`([^`]+)`/);
  return match?.[1] || "UNKNOWN";
}

function snapshotState() {
  const hygiene = readJson(HYGIENE_REPORT_PATH);
  const cleanupGate = readText(CLEANUP_GATE_REPORT_PATH);
  return {
    hygieneStatus: hygiene.status || "UNKNOWN",
    cleanupStatus: extractCleanupStatus(cleanupGate),
    stagedCount: Array.isArray(hygiene.staged) ? hygiene.staged.length : 0,
    unstagedCount: Array.isArray(hygiene.unstaged) ? hygiene.unstaged.length : 0,
    untrackedCount: Array.isArray(hygiene.untracked) ? hygiene.untracked.length : 0,
    generatedNoiseCount: Array.isArray(hygiene.generated_noise) ? hygiene.generated_noise.length : 0,
    deployBlockers: Array.isArray(hygiene.deploy_blockers) ? hygiene.deploy_blockers : [],
  };
}

function determineFinalStatus(after) {
  const hasPromotionBlock =
    after.cleanupStatus === "BLOCKED_FOR_PROMOTION" ||
    after.hygieneStatus === "BLOCKED" ||
    after.deployBlockers.length > 0;
  if (hasPromotionBlock) return "STILL_BLOCKED";

  const hasBuildRisk =
    after.unstagedCount > 0 ||
    after.untrackedCount > 0 ||
    after.generatedNoiseCount > 0;
  if (hasBuildRisk) return "READY_FOR_CONTINUED_BUILD";

  return "READY_FOR_PROMOTION";
}

function compareStates(before, after) {
  const improved = [];
  if (after.stagedCount < before.stagedCount) improved.push(`Staged paths decreased from ${before.stagedCount} to ${after.stagedCount}.`);
  if (after.unstagedCount < before.unstagedCount) improved.push(`Unstaged paths decreased from ${before.unstagedCount} to ${after.unstagedCount}.`);
  if (after.untrackedCount < before.untrackedCount) improved.push(`Untracked paths decreased from ${before.untrackedCount} to ${after.untrackedCount}.`);
  if (after.generatedNoiseCount < before.generatedNoiseCount) improved.push(`Generated noise paths decreased from ${before.generatedNoiseCount} to ${after.generatedNoiseCount}.`);
  if (improved.length === 0) improved.push("No material hygiene improvement was detected between snapshots.");
  return improved;
}

function buildRemainingRisks(after) {
  const risks = [];
  if (after.deployBlockers.length > 0) risks.push(...after.deployBlockers);
  if (after.cleanupStatus === "BLOCKED_FOR_PROMOTION") {
    risks.push("Worktree cleanup gate is still blocking promotion.");
  }
  if (after.unstagedCount > 0) risks.push(`${after.unstagedCount} unstaged path(s) remain.`);
  if (after.untrackedCount > 0) risks.push(`${after.untrackedCount} untracked path(s) remain.`);
  if (after.generatedNoiseCount > 0) risks.push(`${after.generatedNoiseCount} generated noise path(s) remain.`);
  return risks;
}

function buildRecommendedNextStep(finalStatus) {
  if (finalStatus === "READY_FOR_PROMOTION") {
    return "Proceed to promotion checks and release preparation.";
  }
  if (finalStatus === "READY_FOR_CONTINUED_BUILD") {
    return "Continue scoped implementation work, then rerun hygiene governance before any promotion attempt.";
  }
  return "Keep reducing worktree scope and resolve deploy credential blockers before attempting promotion.";
}

function writeReport(markdown) {
  fs.mkdirSync(path.dirname(OUTPUT_REPORT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_REPORT_PATH, markdown, "utf8");
  if (!fs.existsSync(OUTPUT_REPORT_PATH)) {
    throw new Error(`promotion_readiness_report.md was not created at ${OUTPUT_REPORT_PATH}`);
  }
  const stats = fs.statSync(OUTPUT_REPORT_PATH);
  if (!stats.isFile()) {
    throw new Error(`promotion_readiness_report.md path is not a file: ${OUTPUT_REPORT_PATH}`);
  }
  return OUTPUT_REPORT_PATH;
}

const before = snapshotState();

runNode("run_hygiene_check.js");
runNode("build_environment_inventory.js");
runNode("run_worktree_cleanup_gate.js");

const after = snapshotState();
const finalStatus = determineFinalStatus(after);
const whatImproved = compareStates(before, after);
const remainingRisks = buildRemainingRisks(after);
const promotionDecision = finalStatus === "READY_FOR_PROMOTION" ? "CLEAR" : "BLOCKED";
const nextStep = buildRecommendedNextStep(finalStatus);

const markdown = `# Promotion Readiness Report

## PROMOTION READINESS

### Before Status

- Hygiene Status: \`${before.hygieneStatus}\`
- Cleanup Gate Status: \`${before.cleanupStatus}\`
- Staged Paths: ${before.stagedCount}
- Unstaged Paths: ${before.unstagedCount}
- Untracked Paths: ${before.untrackedCount}
- Generated Noise Paths: ${before.generatedNoiseCount}

### After Status

- Hygiene Status: \`${after.hygieneStatus}\`
- Cleanup Gate Status: \`${after.cleanupStatus}\`
- Staged Paths: ${after.stagedCount}
- Unstaged Paths: ${after.unstagedCount}
- Untracked Paths: ${after.untrackedCount}
- Generated Noise Paths: ${after.generatedNoiseCount}

### What Improved

${whatImproved.map((item) => `- ${item}`).join("\n")}

### Remaining Risks

${remainingRisks.length ? remainingRisks.map((item) => `- ${item}`).join("\n") : "- None"}

### Promotion Decision (${promotionDecision})

- Final Status: \`${finalStatus}\`
- Promotion: ${promotionDecision}

### Recommended Next Step

- ${nextStep}
`;

const outputPath = writeReport(markdown);
const exists = fs.existsSync(outputPath);

if (!exists) {
  console.error("=== PROMOTION READINESS RECHECK ===");
  console.error("STATUS: FAIL");
  console.error(`OUTPUT FILE: ${outputPath}`);
  console.error(`EXISTS: ${exists}`);
  process.exit(1);
}

console.log("=== PROMOTION READINESS RECHECK ===");
console.log("STATUS: PASS");
console.log(`OUTPUT FILE: ${outputPath}`);
console.log(`EXISTS: ${exists}`);
console.log(`FINAL STATUS: ${finalStatus}`);
console.log(`REPORT: ${OUTPUT_REPORT_PATH}`);
