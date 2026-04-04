import fs from "node:fs";
import path from "node:path";
import { CANONICAL_ROOT, getHygieneOutputPath, MACHINE_ROLES } from "./runtime_support_v1.js";

const HYGIENE_REPORT_PATH = getHygieneOutputPath("hygiene_report_v1.json");
const ENVIRONMENT_INVENTORY_PATH = getHygieneOutputPath("environment_inventory_v1.json");
const REPORT_PATH = getHygieneOutputPath("worktree_cleanup_gate_report.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function findEnvironment(inventory, environmentId) {
  return inventory?.environments?.find(
    (environment) => environment.environment_id === environmentId,
  ) || null;
}

function buildRepoHygieneRisks(hygiene) {
  const risks = [];

  if ((hygiene?.generated_noise || []).length > 0) {
    risks.push(`Generated noise present in ${hygiene.generated_noise.length} path(s).`);
  }
  if ((hygiene?.staged || []).length > 0 && (hygiene?.unstaged || []).length > 0) {
    risks.push("Staged and unstaged work are mixed in the same worktree.");
  }
  if ((hygiene?.unstaged || []).length > 50) {
    risks.push(`Unstaged surface area is high at ${hygiene.unstaged.length} path(s).`);
  }
  if ((hygiene?.untracked || []).length > 25) {
    risks.push(`Untracked surface area is high at ${hygiene.untracked.length} path(s).`);
  }

  const allPaths = [
    ...(hygiene?.staged || []),
    ...(hygiene?.unstaged || []),
    ...(hygiene?.untracked || []),
  ];
  const concernSet = new Set(
    allPaths.map((filePath) => {
      const parts = String(filePath || "").split("/");
      if (parts[0] === "staffordos" && parts[1]) return `staffordos/${parts[1]}`;
      if (parts[0] === "abando-frontend" && parts[1]) return `abando-frontend/${parts[1]}`;
      if (parts[0] === "web" && parts[1]) return `web/${parts[1]}`;
      return parts[0] || "unknown";
    }),
  );
  if (concernSet.size > 8) {
    risks.push(`Mixed concerns detected across ${concernSet.size} top-level areas.`);
  }

  return risks;
}

function buildEnvironmentRisks(hygiene, inventory) {
  const risks = [];
  const productionFrontend = findEnvironment(inventory, "PRODUCTION_FRONTEND");
  const productionApi = findEnvironment(inventory, "PRODUCTION_API");

  if ((hygiene?.deploy_blockers || []).length > 0) {
    risks.push(...hygiene.deploy_blockers);
  }
  if (productionFrontend?.current_known_issues?.length) {
    const relevant = productionFrontend.current_known_issues.filter(
      (issue) =>
        issue.includes("Vercel") ||
        issue.includes("OAuth") ||
        issue.includes("proof loop"),
    );
    risks.push(...relevant);
  }
  if (productionApi?.current_known_issues?.length) {
    const relevant = productionApi.current_known_issues.filter(
      (issue) =>
        issue.includes("proof loop") ||
        issue.includes("OAuth redirect") ||
        issue.includes("base URL"),
    );
    risks.push(...relevant);
  }

  return [...new Set(risks)];
}

function classifyState(hygiene, inventory) {
  const repoRisks = buildRepoHygieneRisks(hygiene);
  const environmentRisks = buildEnvironmentRisks(hygiene, inventory);
  const hasDeployBlockers = (hygiene?.deploy_blockers || []).length > 0;
  const deploymentCapable = hygiene?.machine_role === MACHINE_ROLES.DEPLOYMENT_CAPABLE;
  const hasUnsafePromotion =
    hygiene?.status === "BLOCKED" ||
    (hasDeployBlockers && deploymentCapable) ||
    repoRisks.some((risk) => risk.includes("Mixed concerns")) ||
    (hygiene?.unstaged || []).length > 80 ||
    (hygiene?.untracked || []).length > 50;

  if (hasUnsafePromotion) {
    return {
      status: "BLOCKED_FOR_PROMOTION",
      allowedNextStep: "targeted local cleanup and scope reduction",
      blockedNextStep: "promotion",
      repoRisks,
      environmentRisks,
    };
  }

  const hasCleanupNeed =
    (hygiene?.generated_noise || []).length > 0 ||
    (hygiene?.staged || []).length > 0 ||
    (hygiene?.unstaged || []).length > 10 ||
    (hygiene?.untracked || []).length > 10;

  if (hasCleanupNeed) {
    return {
      status: "CLEANUP_REQUIRED",
      allowedNextStep: "clean generated noise and isolate the active work slice",
      blockedNextStep: "promotion",
      repoRisks,
      environmentRisks,
    };
  }

  return {
    status: "READY_TO_WORK",
    allowedNextStep: "continue scoped implementation work",
    blockedNextStep: "broad multi-surface changes without a fresh hygiene check",
    repoRisks,
    environmentRisks,
  };
}

function buildRecommendedCleanupActions(hygiene, classification) {
  const actions = [];

  if ((hygiene?.generated_noise || []).length > 0) {
    actions.push("Clean generated build output and cache directories from the active review path.");
  }
  if ((hygiene?.staged || []).length > 0 && (hygiene?.unstaged || []).length > 0) {
    actions.push("Separate staged and unstaged changes before continuing promotion-oriented work.");
  }
  if ((hygiene?.untracked || []).length > 20) {
    actions.push("Triage untracked directories and keep only intentionally created new surfaces.");
  }
  if ((hygiene?.deploy_blockers || []).length > 0) {
    actions.push("Restore missing deploy credentials before treating this worktree as promotion-capable.");
  }
  if (classification.status !== "READY_TO_WORK") {
    actions.push("Reduce the worktree to a single active concern before the next promotion attempt.");
  }

  return [...new Set(actions)];
}

function buildReasoning(hygiene, classification) {
  const reasons = [];
  reasons.push(`Hygiene status input is ${hygiene.status}.`);
  reasons.push(`Branch ${hygiene.branch} currently has ${hygiene.staged.length} staged, ${hygiene.unstaged.length} unstaged, and ${hygiene.untracked.length} untracked path(s).`);
  if (classification.environmentRisks.length > 0) {
    reasons.push(`Environment inventory reports ${classification.environmentRisks.length} current environment risk(s) relevant to promotion trust.`);
  }
  if ((hygiene.generated_noise || []).length > 0) {
    reasons.push(`Generated noise exists in ${hygiene.generated_noise.length} path(s).`);
  }
  return reasons;
}

function toBulletList(items) {
  if (!items.length) return "- None";
  return items.map((item) => `- ${item}`).join("\n");
}

export function runWorktreeCleanupGate() {
  const hygiene = readJson(HYGIENE_REPORT_PATH);
  const inventory = readJson(ENVIRONMENT_INVENTORY_PATH);
  const classification = classifyState(hygiene, inventory);
  const recommendedActions = buildRecommendedCleanupActions(hygiene, classification);
  const reasons = buildReasoning(hygiene, classification);

  return {
    status: classification.status,
    currentOperatingState:
      hygiene?.status === "CLEAN" && (hygiene?.generated_noise || []).length === 0
        ? "READY_TO_WORK"
        : "SCOPED_CLEANUP_REQUIRED",
    deploymentState: hygiene?.deployment_state || "UNKNOWN",
    merchantProofState:
      classification.environmentRisks.some((risk) => risk.includes("proof loop"))
        ? "INCOMPLETE"
        : "UNKNOWN",
    promotionState: classification.status,
    allowedNextStep: classification.allowedNextStep,
    blockedNextStep: classification.blockedNextStep,
    reasons,
    repoHygieneRisks: classification.repoRisks,
    environmentRisks: classification.environmentRisks,
    recommendedActions,
    hygiene,
  };
}

export function renderWorktreeCleanupGateReport(result) {
  return `# Worktree Cleanup Gate Report

## Current Status

- Status: \`${result.status}\`
- Current Operating State: \`${result.currentOperatingState}\`
- Deployment State: \`${result.deploymentState}\`
- Merchant Proof State: \`${result.merchantProofState}\`
- Promotion State: \`${result.promotionState}\`
- Branch: \`${result.hygiene.branch}\`
- Allowed Next Step: ${result.allowedNextStep}
- Blocked Next Step: ${result.blockedNextStep}

## Why This State Was Assigned

${toBulletList(result.reasons)}

## Repo Hygiene Risks

${toBulletList(result.repoHygieneRisks)}

## Environment Risks

${toBulletList(result.environmentRisks)}

## Recommended Cleanup Actions

${toBulletList(result.recommendedActions)}

## Allowed Next Step

- ${result.allowedNextStep}

## Blocked Next Step

- ${result.blockedNextStep}
`;
}

export function writeWorktreeCleanupGateReport(markdown) {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, markdown, "utf8");
  if (!fs.existsSync(REPORT_PATH)) {
    throw new Error(`worktree_cleanup_gate_report.md was not created at ${REPORT_PATH}`);
  }
  const stats = fs.statSync(REPORT_PATH);
  if (!stats.isFile()) {
    throw new Error(`worktree_cleanup_gate_report.md path is not a file: ${REPORT_PATH}`);
  }
  return REPORT_PATH;
}

export { REPORT_PATH };
