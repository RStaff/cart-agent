import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const OPERATOR_FRONTDOOR_DIR = path.join(CANONICAL_ROOT, "staffordos/operator_frontdoor");
const OUTPUT_REPORT_PATH = path.join(OPERATOR_FRONTDOOR_DIR, "operator_frontdoor_report.md");
const HYGIENE_OUTPUT_DIR = path.join(CANONICAL_ROOT, "staffordos/hygiene/output");
const HYGIENE_REPORT_PATH = path.join(HYGIENE_OUTPUT_DIR, "hygiene_report_v1.json");
const PROMOTION_READINESS_REPORT_PATH = path.join(HYGIENE_OUTPUT_DIR, "promotion_readiness_report_v2.md");
const PROMOTION_BLOCKER_BREAKDOWN_PATH = path.join(HYGIENE_OUTPUT_DIR, "promotion_blocker_breakdown.md");
const WORKTREE_CLEANUP_GATE_REPORT_PATH = path.join(HYGIENE_OUTPUT_DIR, "worktree_cleanup_gate_report.md");
const BRANCH_SCOPE_REPORT_PATH = path.join(HYGIENE_OUTPUT_DIR, "branch_scope_report.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function runNodeScript(scriptPath) {
  try {
    execFileSync("node", [scriptPath], {
      cwd: CANONICAL_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    });
  } catch (error) {
    const stderr =
      error && typeof error === "object" && "stderr" in error
        ? String(error.stderr || "").trim()
        : "";
    const stdout =
      error && typeof error === "object" && "stdout" in error
        ? String(error.stdout || "").trim()
        : "";
    const detail = stderr || stdout || (error instanceof Error ? error.message : String(error));
    throw new Error(`Operator front door dependency failed: ${path.basename(scriptPath)}: ${detail}`);
  }
}

function extractSingle(markdown, pattern, fallback = "UNKNOWN") {
  return markdown.match(pattern)?.[1] || fallback;
}

function extractBullets(markdown, headingLevel, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${headingLevel} ${escaped}\\n\\n([\\s\\S]*?)(\\n${headingLevel} |$)`);
  const match = markdown.match(regex);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

function ensureDependencies() {
  runNodeScript(path.join(CANONICAL_ROOT, "staffordos/hygiene/run_hygiene_control_loop.js"));
  runNodeScript(path.join(CANONICAL_ROOT, "staffordos/hygiene/promotion_readiness_recheck_v2.js"));
  runNodeScript(path.join(CANONICAL_ROOT, "staffordos/hygiene/run_promotion_blocker_breakdown.js"));

  const requiredPaths = [
    HYGIENE_REPORT_PATH,
    PROMOTION_READINESS_REPORT_PATH,
    PROMOTION_BLOCKER_BREAKDOWN_PATH,
    WORKTREE_CLEANUP_GATE_REPORT_PATH,
  ];

  for (const requiredPath of requiredPaths) {
    if (!fs.existsSync(requiredPath)) {
      throw new Error(`Required operator dependency missing: ${requiredPath}`);
    }
  }
}

function extractTopBlockers(markdown) {
  return extractBullets(markdown, "##", "Exact Resolution Order");
}

function extractNoLongerBlocks(markdown) {
  return extractBullets(markdown, "##", "What No Longer Blocks");
}

function determineExactNextAction(resolutionOrder) {
  return resolutionOrder[0] || "No action required.";
}

function determineSecondaryActions(resolutionOrder) {
  return resolutionOrder.slice(1, 4);
}

function relevantArtifacts() {
  return [
    HYGIENE_REPORT_PATH,
    PROMOTION_READINESS_REPORT_PATH,
    PROMOTION_BLOCKER_BREAKDOWN_PATH,
    WORKTREE_CLEANUP_GATE_REPORT_PATH,
    BRANCH_SCOPE_REPORT_PATH,
  ].filter((filePath) => fs.existsSync(filePath));
}

export function runOperatorFrontDoor() {
  ensureDependencies();

  const hygieneReport = readJson(HYGIENE_REPORT_PATH);
  const promotionReadinessReport = readText(PROMOTION_READINESS_REPORT_PATH);
  const promotionBlockerBreakdown = readText(PROMOTION_BLOCKER_BREAKDOWN_PATH);

  const machineRole = hygieneReport.machine_role || "UNKNOWN";
  const currentOperatingState =
    extractSingle(promotionReadinessReport, /- Current Operating State:\s+`([^`]+)`/, hygieneReport.current_operating_state || "UNKNOWN");
  const deploymentState =
    extractSingle(promotionReadinessReport, /- Deployment State:\s+`([^`]+)`/, hygieneReport.deployment_state || "UNKNOWN");
  const merchantProofState =
    extractSingle(promotionReadinessReport, /- Merchant Proof State:\s+`([^`]+)`/, hygieneReport.merchant_proof_state || "UNKNOWN");
  const promotionState =
    extractSingle(promotionReadinessReport, /- Promotion State:\s+`([^`]+)`/, hygieneReport.promotion_state || "UNKNOWN");

  const topBlockers = [
    ...extractBullets(promotionBlockerBreakdown, "###", "HYGIENE_BLOCKERS"),
    ...extractBullets(promotionBlockerBreakdown, "###", "DEPLOY_BLOCKERS"),
    ...extractBullets(promotionBlockerBreakdown, "###", "PRODUCT_BLOCKERS"),
    ...extractBullets(promotionBlockerBreakdown, "###", "ENVIRONMENT_BLOCKERS"),
    ...extractBullets(promotionBlockerBreakdown, "###", "GOVERNANCE_BLOCKERS"),
  ]
    .filter((line) => line.startsWith("Blocker:"))
    .map((line) => line.replace(/^Blocker:\s*/, ""))
    .slice(0, 3);

  const resolutionOrder = extractTopBlockers(promotionBlockerBreakdown);
  const noLongerBlocks = extractNoLongerBlocks(promotionBlockerBreakdown);
  const exactNextAction = determineExactNextAction(resolutionOrder);
  const secondaryActions = determineSecondaryActions(resolutionOrder);
  const artifacts = relevantArtifacts();

  const markdown = `# Operator Front Door Report

## Current Operating State

- Machine Role: \`${machineRole}\`
- CURRENT OPERATING STATE: ${currentOperatingState}

## Deployment State

- DEPLOYMENT STATE: ${deploymentState}

## Merchant Proof State

- MERCHANT PROOF STATE: ${merchantProofState}

## Promotion State

- PROMOTION STATE: ${promotionState}

## Top Blockers

${topBlockers.length ? topBlockers.map((item) => `- ${item}`).join("\n") : "- None"}

## What No Longer Blocks

${noLongerBlocks.length ? noLongerBlocks.map((item) => `- ${item}`).join("\n") : "- None"}

## Exact Next Action

- ${exactNextAction}

## Secondary Actions

${secondaryActions.length ? secondaryActions.map((item) => `- ${item}`).join("\n") : "- None"}

## Relevant Artifacts

${artifacts.map((item) => `- ${item}`).join("\n")}
`;

  return {
    machineRole,
    currentOperatingState,
    deploymentState,
    merchantProofState,
    promotionState,
    topBlockers,
    noLongerBlocks,
    exactNextAction,
    secondaryActions,
    artifacts,
    markdown,
  };
}

export function writeOperatorFrontDoorReport(markdown) {
  fs.mkdirSync(path.dirname(OUTPUT_REPORT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_REPORT_PATH, markdown, "utf8");
  if (!fs.existsSync(OUTPUT_REPORT_PATH)) {
    throw new Error(`operator_frontdoor_report.md was not created at ${OUTPUT_REPORT_PATH}`);
  }
  const stats = fs.statSync(OUTPUT_REPORT_PATH);
  if (!stats.isFile()) {
    throw new Error(`operator_frontdoor_report.md path is not a file: ${OUTPUT_REPORT_PATH}`);
  }
  return OUTPUT_REPORT_PATH;
}

export { OUTPUT_REPORT_PATH };
