import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const HYGIENE_DIR = path.join(CANONICAL_ROOT, "staffordos/hygiene");
const HYGIENE_REPORT_PATH = path.join(HYGIENE_DIR, "hygiene_report_v1.json");
const CLEANUP_GATE_REPORT_PATH = path.join(HYGIENE_DIR, "worktree_cleanup_gate_report.md");
const WORKTREE_REDUCTION_PLAN_PATH = path.join(HYGIENE_DIR, "worktree_reduction_plan.md");
const BRANCH_SCOPE_REPORT_PATH = path.join(HYGIENE_DIR, "branch_scope_report.md");
const OUTPUT_PATH = path.join(HYGIENE_DIR, "cleanup_execution_pack_v2.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function quotePath(targetPath) {
  return `'${String(targetPath).replace(/'/g, `'\\''`)}'`;
}

function extractListSection(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`## ${escaped}\\n\\n([\\s\\S]*?)(\\n## |$)`);
  const match = markdown.match(regex);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- `"))
    .map((line) => {
      const pathMatch = line.match(/- `([^`]+)`/);
      return pathMatch?.[1] || null;
    })
    .filter(Boolean);
}

function extractValue(markdown, pattern, fallback = "UNKNOWN") {
  return markdown.match(pattern)?.[1] || fallback;
}

function buildExpectedEndState(hygieneReport, commitNow, stashNow, ignoreNow, manualDecisions, branchScopeStatus) {
  const targetUnstaged = Math.max(0, hygieneReport.unstaged.length - commitNow.length - stashNow.filter((item) => hygieneReport.unstaged.includes(item)).length);
  const targetUntracked = Math.max(
    0,
    hygieneReport.untracked.length - stashNow.filter((item) => hygieneReport.untracked.includes(item)).length,
  );

  let branchBlocked = "yes";
  if (branchScopeStatus === "CLEAN_SCOPE" && manualDecisions.length === 0 && targetUnstaged === 0 && targetUntracked === 0) {
    branchBlocked = "no";
  }

  return {
    targetUnstaged,
    targetUntracked,
    branchBlocked,
  };
}

function commandBlock(lines) {
  return lines.length ? lines.join("\n") : "# No command needed.";
}

export function runCleanupExecutionPackV2() {
  const hygieneReport = readJson(HYGIENE_REPORT_PATH);
  const cleanupGateReport = readText(CLEANUP_GATE_REPORT_PATH);
  const worktreeReductionPlan = readText(WORKTREE_REDUCTION_PLAN_PATH);
  const branchScopeReport = readText(BRANCH_SCOPE_REPORT_PATH);

  const commitNow = extractListSection(worktreeReductionPlan, "Commit Now");
  const stashNow = extractListSection(worktreeReductionPlan, "Stash Now");
  const ignoreNow = extractListSection(worktreeReductionPlan, "Ignore Permanently")
    .filter((item) => item.startsWith("/Users/rossstafford/projects/cart-agent/"));
  const manualDecisions = extractListSection(worktreeReductionPlan, "Manual Decisions");

  const branchName = hygieneReport.branch || extractValue(cleanupGateReport, /- Branch:\s+`([^`]+)`/, "UNKNOWN");
  const cleanupGateStatus = extractValue(cleanupGateReport, /- Status:\s+`([^`]+)`/, "UNKNOWN");
  const branchScopeStatus = extractValue(branchScopeReport, /- Status:\s+`([^`]+)`/, "UNKNOWN");
  const primaryConcern = extractValue(branchScopeReport, /## Primary Concern[\s\S]*?- ([^\n]+)/, "unknown");

  const expectedEndState = buildExpectedEndState(
    hygieneReport,
    commitNow,
    stashNow,
    ignoreNow,
    manualDecisions,
    branchScopeStatus,
  );

  const commitCommands = commitNow.length
    ? [
        `git -C ${quotePath(CANONICAL_ROOT)} add ${commitNow.map(quotePath).join(" ")}`,
        `git -C ${quotePath(CANONICAL_ROOT)} commit -m "Finalize hygiene governance outputs"`,
      ]
    : [];

  const stashCommands = stashNow.length
    ? [
        `git -C ${quotePath(CANONICAL_ROOT)} stash push -u -m "cleanup-pack-v2-stash" -- ${stashNow.map(quotePath).join(" ")}`,
      ]
    : [];

  const ignoreCommands = ignoreNow.length
    ? [`rm -rf ${ignoreNow.map(quotePath).join(" ")}`]
    : [];

  const markdown = `# Cleanup Execution Pack V2

## Ordered Cleanup Sequence

### STEP 1: remove generated noise

Files:
${ignoreNow.length ? ignoreNow.map((item) => `- ${item}`).join("\n") : "- None"}

Commands:
\`\`\`bash
${commandBlock(ignoreCommands)}
\`\`\`

### STEP 2: commit governance/hygiene changes

Files:
${commitNow.length ? commitNow.map((item) => `- ${item}`).join("\n") : "- None"}

Commands:
\`\`\`bash
${commandBlock(commitCommands)}
\`\`\`

### STEP 3: stash unrelated product or experimental changes

Files:
${stashNow.length ? stashNow.map((item) => `- ${item}`).join("\n") : "- None"}

Commands:
\`\`\`bash
${commandBlock(stashCommands)}
\`\`\`

### STEP 4: re-run hygiene

Commands:
\`\`\`bash
node /Users/rossstafford/projects/cart-agent/staffordos/hygiene/run_hygiene_control_loop.js
\`\`\`

### STEP 5: re-run promotion readiness

Commands:
\`\`\`bash
node /Users/rossstafford/projects/cart-agent/staffordos/hygiene/promotion_readiness_recheck_v1.js
\`\`\`

## Expected End-State

- Current Branch: \`${branchName}\`
- Cleanup Gate Status Before Cleanup: \`${cleanupGateStatus}\`
- Primary Branch Concern: ${primaryConcern}
- Branch Scope Status Before Cleanup: \`${branchScopeStatus}\`
- Target unstaged count: ${expectedEndState.targetUnstaged}
- Target untracked count: ${expectedEndState.targetUntracked}
- Branch should still be blocked: ${expectedEndState.branchBlocked}
- Manual decisions still required after this pack: ${manualDecisions.length}

## Notes

- This pack combines output-integrity-verified hygiene state, the reduction plan, and branch scope risk.
- Promotion should remain blocked until manual decisions are resolved and the branch is reduced to one trustworthy concern.
`;

  return {
    status: "READY",
    branchName,
    commitCount: commitNow.length,
    stashCount: stashNow.length,
    ignoreCount: ignoreNow.length,
    manualDecisionCount: manualDecisions.length,
    markdown,
  };
}

export function writeCleanupExecutionPackV2(markdown) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, markdown, "utf8");
  if (!fs.existsSync(OUTPUT_PATH)) {
    throw new Error(`cleanup_execution_pack_v2.md was not created at ${OUTPUT_PATH}`);
  }
  const stats = fs.statSync(OUTPUT_PATH);
  if (!stats.isFile()) {
    throw new Error(`cleanup_execution_pack_v2.md path is not a file: ${OUTPUT_PATH}`);
  }
  return OUTPUT_PATH;
}

export { OUTPUT_PATH };
