import fs from "node:fs";
import path from "node:path";
import {
  renderBranchScopeReport,
  runBranchScopeGate,
  writeBranchScopeReport,
} from "./branch_scope_gate_v1.js";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const HYGIENE_DIR = path.join(CANONICAL_ROOT, "staffordos/hygiene");
const HYGIENE_REPORT_PATH = path.join(HYGIENE_DIR, "hygiene_report_v1.json");
const CLEANUP_GATE_REPORT_PATH = path.join(HYGIENE_DIR, "worktree_cleanup_gate_report.md");
const BRANCH_SCOPE_REPORT_PATH = path.join(HYGIENE_DIR, "branch_scope_report.md");
const OUTPUT_REPORT_PATH = path.join(HYGIENE_DIR, "promotion_readiness_report_v2.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function ensureBranchScopeReport() {
  if (fs.existsSync(BRANCH_SCOPE_REPORT_PATH)) {
    return readText(BRANCH_SCOPE_REPORT_PATH);
  }

  try {
    const branchScopeResult = runBranchScopeGate();
    const outputPath = writeBranchScopeReport(renderBranchScopeReport(branchScopeResult));
    if (!fs.existsSync(outputPath)) {
      throw new Error(`branch_scope_report.md was not created at ${outputPath}`);
    }
    return readText(outputPath);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Branch scope dependency unavailable: ${detail}`);
  }
}

function extractSingle(markdown, pattern, fallback = "UNKNOWN") {
  return markdown.match(pattern)?.[1] || fallback;
}

function extractBullets(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`## ${escaped}\\n\\n([\\s\\S]*?)(\\n## |$)`);
  const match = markdown.match(regex);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function categorizeBlockers(hygiene, cleanupGateReport, branchScopeReport) {
  const hygieneBlockers = [];
  const branchBlockers = [];
  const productBlockers = [];
  const deployBlockers = [];

  if (hygiene.status === "BLOCKED") {
    hygieneBlockers.push("Dirty worktree remains blocked at hygiene level.");
  }
  if ((hygiene.generated_noise || []).length > 0) {
    hygieneBlockers.push(`Generated noise remains in ${hygiene.generated_noise.length} path(s).`);
  }
  if ((hygiene.unstaged || []).length > 0) {
    hygieneBlockers.push(`${hygiene.unstaged.length} unstaged path(s) remain.`);
  }
  if ((hygiene.untracked || []).length > 0) {
    hygieneBlockers.push(`${hygiene.untracked.length} untracked path(s) remain.`);
  }

  const cleanupStatus = extractSingle(cleanupGateReport, /- Status:\s+`([^`]+)`/, "UNKNOWN");
  if (cleanupStatus === "BLOCKED_FOR_PROMOTION") {
    hygieneBlockers.push("Worktree cleanup gate is still blocking promotion.");
  }

  const branchStatus = extractSingle(branchScopeReport, /- Status:\s+`([^`]+)`/, "UNKNOWN");
  const primaryConcern = extractSingle(
    branchScopeReport,
    /## Primary Concern[\s\S]*?- ([^\n]+)/,
    "unknown",
  );
  if (branchStatus === "MIXED_SCOPE") {
    branchBlockers.push(`Branch scope is mixed instead of clean. Primary concern is ${primaryConcern}.`);
  }
  const mixedConcerns = extractBullets(branchScopeReport, "Mixed Concerns Detected");
  if (branchStatus === "MIXED_SCOPE") {
    branchBlockers.push(...mixedConcerns);
  }

  for (const blocker of hygiene.deploy_blockers || []) {
    deployBlockers.push(blocker);
  }
  const environmentRisks = extractBullets(cleanupGateReport, "Environment Risks");
  for (const risk of environmentRisks) {
    if (risk.includes("TOKEN") || risk.includes("OAuth") || risk.includes("base URL") || risk.includes("Render API")) {
      deployBlockers.push(risk);
    }
    if (risk.includes("proof loop") || risk.includes("storefront checkout")) {
      productBlockers.push(risk);
    }
  }

  productBlockers.push("Live proof loop is not yet fully completed end to end.");

  return {
    hygieneBlockers: unique(hygieneBlockers),
    branchBlockers: unique(branchBlockers),
    productBlockers: unique(productBlockers),
    deployBlockers: unique(deployBlockers),
  };
}

function determineFinalStatus(blockers) {
  const anyHardBlock =
    blockers.hygieneBlockers.length > 0 ||
    blockers.branchBlockers.length > 0 ||
    blockers.deployBlockers.length > 0;

  if (anyHardBlock) {
    return "STILL_BLOCKED";
  }

  if (blockers.productBlockers.length > 0) {
    return "READY_FOR_CONTINUED_BUILD";
  }

  return "READY_FOR_PROMOTION";
}

function buildReasoning(blockers) {
  const reasoning = [];
  if (blockers.hygieneBlockers.length > 0) {
    reasoning.push("blocked by dirty worktree");
  }
  if (blockers.branchBlockers.length > 0) {
    reasoning.push("blocked by mixed branch scope");
  }
  if (blockers.deployBlockers.length > 0) {
    reasoning.push("blocked by deploy credential issues");
  }
  if (blockers.productBlockers.length > 0) {
    reasoning.push("blocked by proof-loop incompleteness");
  }
  return reasoning;
}

function buildNextStep(finalStatus) {
  if (finalStatus === "READY_FOR_PROMOTION") {
    return "Proceed to promotion checks from a clean-scope branch with no remaining hygiene or deploy blockers.";
  }
  if (finalStatus === "READY_FOR_CONTINUED_BUILD") {
    return "Finish the proof loop on a clean branch, then rerun the promotion recheck.";
  }
  return "Reduce the dirty worktree, split branch scope, and clear deploy blockers before treating this repo as promotion-capable.";
}

function toBulletList(items) {
  if (!items.length) return "- None";
  return items.map((item) => `- ${item}`).join("\n");
}

function writeReport(markdown) {
  fs.mkdirSync(path.dirname(OUTPUT_REPORT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_REPORT_PATH, markdown, "utf8");
  if (!fs.existsSync(OUTPUT_REPORT_PATH)) {
    throw new Error(`promotion_readiness_report_v2.md was not created at ${OUTPUT_REPORT_PATH}`);
  }
  const stats = fs.statSync(OUTPUT_REPORT_PATH);
  if (!stats.isFile()) {
    throw new Error(`promotion_readiness_report_v2.md path is not a file: ${OUTPUT_REPORT_PATH}`);
  }
  return OUTPUT_REPORT_PATH;
}

const hygiene = readJson(HYGIENE_REPORT_PATH);
const cleanupGateReport = readText(CLEANUP_GATE_REPORT_PATH);
const branchScopeReport = ensureBranchScopeReport();

const blockers = categorizeBlockers(hygiene, cleanupGateReport, branchScopeReport);
const finalStatus = determineFinalStatus(blockers);
const reasoning = buildReasoning(blockers);
const nextStep = buildNextStep(finalStatus);

const markdown = `# Promotion Readiness Report V2

## PROMOTION READINESS

### Final Status

- Final Status: \`${finalStatus}\`

### Explicit Reasoning

${toBulletList(reasoning)}

### Hygiene Blockers

${toBulletList(blockers.hygieneBlockers)}

### Branch Blockers

${toBulletList(blockers.branchBlockers)}

### Product Blockers

${toBulletList(blockers.productBlockers)}

### Deploy Blockers

${toBulletList(blockers.deployBlockers)}

### Recommended Next Step

- ${nextStep}
`;

const outputPath = writeReport(markdown);
const exists = fs.existsSync(outputPath);

if (!exists) {
  console.error("=== PROMOTION READINESS RECHECK V2 ===");
  console.error("STATUS: FAIL");
  console.error(`OUTPUT FILE: ${outputPath}`);
  console.error(`EXISTS: ${exists}`);
  process.exit(1);
}

console.log("=== PROMOTION READINESS RECHECK V2 ===");
console.log("STATUS: PASS");
console.log(`OUTPUT FILE: ${outputPath}`);
console.log(`EXISTS: ${exists}`);
console.log(`FINAL STATUS: ${finalStatus}`);
console.log(`REPORT: ${OUTPUT_REPORT_PATH}`);
