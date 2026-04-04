import fs from "node:fs";
import path from "node:path";
import { classifyNoisePath } from "./noise_classifier_v1.js";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const HYGIENE_DIR = path.join(CANONICAL_ROOT, "staffordos/hygiene");
const HYGIENE_REPORT_PATH = path.join(HYGIENE_DIR, "hygiene_report_v1.json");
const CLEANUP_GATE_REPORT_PATH = path.join(HYGIENE_DIR, "worktree_cleanup_gate_report.md");
const OUTPUT_PLAN_PATH = path.join(HYGIENE_DIR, "cleanup_execution_plan.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function quotePath(targetPath) {
  return `'${String(targetPath).replace(/'/g, `'\\''`)}'`;
}

function isGeneratedNoise(filePath, generatedNoise) {
  if (classifyNoisePath(filePath) === "GENERATED_NOISE") {
    return true;
  }
  const normalized = String(filePath || "").replace(/\\/g, "/");
  return generatedNoise.some((noisePath) => {
    const normalizedNoise = String(noisePath || "").replace(/\\/g, "/");
    return normalized === normalizedNoise || normalized.startsWith(`${normalizedNoise}/`);
  });
}

function isEnvFile(filePath, envFiles) {
  return envFiles.includes(filePath);
}

function classifyPath(filePath, context) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  const noiseClassification = classifyNoisePath(filePath);

  if (isGeneratedNoise(filePath, context.generatedNoise)) {
    return "GENERATED_NOISE";
  }

  if (noiseClassification === "REVIEW_REQUIRED") {
    return "REQUIRES_DECISION";
  }

  if (isEnvFile(filePath, context.envFiles)) {
    return "DO_NOT_TOUCH";
  }

  if (
    normalized.startsWith("staffordos/hygiene/") ||
    normalized === "staffordos/hygiene"
  ) {
    return "SAFE_TO_COMMIT";
  }

  if (
    normalized.includes(".bak") ||
    normalized.includes(".backup") ||
    normalized.includes("index.before-") ||
    normalized.includes("index.pre_") ||
    normalized.endsWith(".pre_recover") ||
    normalized.startsWith("_archive_repo_cleanup/") ||
    normalized === "web/src/dev/checkoutPublic.esm.js.bak"
  ) {
    return "SAFE_TO_STASH";
  }

  if (
    normalized.startsWith("abando-frontend/app/marketing/") ||
    normalized.startsWith("staffordos/ui/operator-frontend/") ||
    normalized.startsWith("staffordos/leads/") ||
    normalized.startsWith("ross_operator/") ||
    normalized.startsWith("staffordos/pm/") ||
    normalized.startsWith("staffordos/proof/") ||
    normalized.startsWith("staffordos/governance/") ||
    normalized.startsWith("staffordos/docs/")
  ) {
    return "SAFE_TO_STASH";
  }

  return "REQUIRES_DECISION";
}

function buildClassification(hygieneReport) {
  const allPaths = uniqueSorted([
    ...hygieneReport.staged,
    ...hygieneReport.unstaged,
    ...hygieneReport.untracked,
    ...hygieneReport.generated_noise,
    ...hygieneReport.env_files,
  ]);

  const context = {
    generatedNoise: hygieneReport.generated_noise || [],
    envFiles: hygieneReport.env_files || [],
  };

  const buckets = {
    SAFE_TO_COMMIT: [],
    SAFE_TO_STASH: [],
    GENERATED_NOISE: [],
    REQUIRES_DECISION: [],
    DO_NOT_TOUCH: [],
  };

  for (const filePath of allPaths) {
    const classification = classifyPath(filePath, context);
    buckets[classification].push(filePath);
  }

  for (const key of Object.keys(buckets)) {
    buckets[key] = uniqueSorted(buckets[key]);
  }

  return buckets;
}

function extractCleanupGateStatus(markdown) {
  const match = markdown.match(/- Status:\s+`([^`]+)`/);
  return match?.[1] || "UNKNOWN";
}

function buildPlan(hygieneReport, cleanupGateReport) {
  const buckets = buildClassification(hygieneReport);
  const cleanupGateStatus = extractCleanupGateStatus(cleanupGateReport);

  const generatedNoiseCommands = buckets.GENERATED_NOISE.length
    ? [`rm -rf ${buckets.GENERATED_NOISE.map(quotePath).join(" ")}`]
    : ["# No generated noise paths detected."];

  const safeCommitCommands = buckets.SAFE_TO_COMMIT.length
    ? [
        `git -C ${quotePath(CANONICAL_ROOT)} add ${buckets.SAFE_TO_COMMIT.map(quotePath).join(" ")}`,
        `git -C ${quotePath(CANONICAL_ROOT)} commit -m "Add hygiene governance tooling"`,
      ]
    : ["# No safe-to-commit files detected."];

  const safeStashCommands = buckets.SAFE_TO_STASH.length
    ? [
        `git -C ${quotePath(CANONICAL_ROOT)} stash push -u -m "cleanup-stash" -- ${buckets.SAFE_TO_STASH.map(quotePath).join(" ")}`,
      ]
    : ["# No safe-to-stash files detected."];

  const environmentRiskNotes = uniqueSorted([
    ...(hygieneReport.deploy_blockers || []),
    "Do not touch or rotate .env files during cleanup without an explicit config decision.",
    "Frontend production deployment remains blocked from this environment if VERCEL_TOKEN is absent.",
    "Promotion remains blocked while the worktree cleanup gate is not READY_TO_WORK.",
  ]);

  const markdown = `# Cleanup Execution Plan

## CLEANUP PLAN

### STEP 1 — Generated Noise Removal

Files/dirs:
${buckets.GENERATED_NOISE.length ? buckets.GENERATED_NOISE.map((item) => `- ${item}`).join("\n") : "- None"}

Commands:
\`\`\`bash
${generatedNoiseCommands.join("\n")}
\`\`\`

### STEP 2 — Safe Commits

Files:
${buckets.SAFE_TO_COMMIT.length ? buckets.SAFE_TO_COMMIT.map((item) => `- ${item}`).join("\n") : "- None"}

Commands:
\`\`\`bash
${safeCommitCommands.join("\n")}
\`\`\`

### STEP 3 — Safe Stash

Files:
${buckets.SAFE_TO_STASH.length ? buckets.SAFE_TO_STASH.map((item) => `- ${item}`).join("\n") : "- None"}

Commands:
\`\`\`bash
${safeStashCommands.join("\n")}
\`\`\`

### STEP 4 — Decision Required

Files:
${buckets.REQUIRES_DECISION.length ? buckets.REQUIRES_DECISION.map((item) => `- ${item}`).join("\n") : "- None"}

### STEP 5 — Environment Risk Notes

${environmentRiskNotes.map((item) => `- ${item}`).join("\n")}

### STEP 6 — Post-Cleanup Verification

Command:
\`\`\`bash
node /Users/rossstafford/projects/cart-agent/staffordos/hygiene/run_hygiene_control_loop.js
\`\`\`

## CLASSIFICATION SUMMARY

- Cleanup gate status: \`${cleanupGateStatus}\`
- SAFE_TO_COMMIT: ${buckets.SAFE_TO_COMMIT.length}
- SAFE_TO_STASH: ${buckets.SAFE_TO_STASH.length}
- GENERATED_NOISE: ${buckets.GENERATED_NOISE.length}
- REQUIRES_DECISION: ${buckets.REQUIRES_DECISION.length}
- DO_NOT_TOUCH: ${buckets.DO_NOT_TOUCH.length}

## DO NOT TOUCH

${buckets.DO_NOT_TOUCH.length ? buckets.DO_NOT_TOUCH.map((item) => `- ${item}`).join("\n") : "- None"}
`;

  return {
    status: "READY",
    totalActions:
      (buckets.GENERATED_NOISE.length ? 1 : 0) +
      (buckets.SAFE_TO_COMMIT.length ? 1 : 0) +
      (buckets.SAFE_TO_STASH.length ? 1 : 0) +
      1,
    criticalDecisions: buckets.REQUIRES_DECISION.length,
    cleanupGateStatus,
    buckets,
    markdown,
  };
}

export function runCleanupExecutionPack() {
  const hygieneReport = readJson(HYGIENE_REPORT_PATH);
  const cleanupGateReport = readText(CLEANUP_GATE_REPORT_PATH);
  return buildPlan(hygieneReport, cleanupGateReport);
}

export function writeCleanupExecutionPlan(markdown) {
  fs.writeFileSync(OUTPUT_PLAN_PATH, markdown, "utf8");
  return OUTPUT_PLAN_PATH;
}

export { OUTPUT_PLAN_PATH };
