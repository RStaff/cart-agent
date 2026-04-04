import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { classifyNoisePath } from "./noise_classifier_v1.js";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const HYGIENE_DIR = path.join(CANONICAL_ROOT, "staffordos/hygiene");
const HYGIENE_REPORT_PATH = path.join(HYGIENE_DIR, "hygiene_report_v1.json");
const CLEANUP_GATE_REPORT_PATH = path.join(HYGIENE_DIR, "worktree_cleanup_gate_report.md");
const OUTPUT_PLAN_PATH = path.join(HYGIENE_DIR, "worktree_reduction_plan.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function quotePath(targetPath) {
  return `'${String(targetPath).replace(/'/g, `'\\''`)}'`;
}

function uniqueSorted(values) {
  return [...new Set((values || []).filter(Boolean))].sort();
}

function runGit(args) {
  return execFileSync("git", ["-C", CANONICAL_ROOT, ...args], {
    encoding: "utf8",
  }).trimEnd();
}

function parsePorcelainLine(line) {
  const indexStatus = line.slice(0, 1);
  const worktreeStatus = line.slice(1, 2);
  const rawPath = line.slice(3).trim();
  const pathText = rawPath.includes(" -> ") ? rawPath.split(" -> ").at(-1) : rawPath;
  return {
    raw: line,
    indexStatus,
    worktreeStatus,
    path: pathText,
  };
}

function gitStateFor(parsed) {
  if (parsed.indexStatus === "?" && parsed.worktreeStatus === "?") {
    return "UNTRACKED";
  }
  if (parsed.indexStatus === "D" || parsed.worktreeStatus === "D") {
    return "DELETED";
  }
  if (parsed.indexStatus !== " " && parsed.worktreeStatus !== " ") {
    return "STAGED_AND_UNSTAGED";
  }
  if (parsed.indexStatus !== " ") {
    return "STAGED";
  }
  if (parsed.worktreeStatus !== " ") {
    return "UNSTAGED";
  }
  return "UNKNOWN";
}

function concernFor(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");

  if (classifyNoisePath(normalized) === "GENERATED_NOISE") {
    return "generated noise";
  }

  if (normalized.startsWith("staffordos/hygiene/")) {
    return "hygiene/governance";
  }

  if (
    normalized === "package.json" ||
    normalized === "package-lock.json" ||
    normalized === "web/package.json" ||
    normalized === "web/package-lock.json" ||
    normalized === "shopify.app.toml" ||
    normalized === "shopify.app.r12b-dev.toml" ||
    normalized === "abando-frontend/vercel.json" ||
    normalized === "abando-frontend/deploy_prod.sh" ||
    normalized === "abando-frontend/next.config.mjs" ||
    normalized === "abando-frontend/middleware.ts" ||
    normalized.startsWith("staffordos/deploy/")
  ) {
    return "deploy/config";
  }

  if (
    normalized.startsWith("abando-frontend/app/") ||
    normalized.startsWith("abando-frontend/src/") ||
    normalized.startsWith("web/src/") ||
    normalized.startsWith("web/dev/") ||
    normalized.startsWith("web/src/content/")
  ) {
    return "proof-loop/product";
  }

  return "experimental/future";
}

function actionFor(filePath, concern, gitState) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  const noiseClass = classifyNoisePath(normalized);

  if (noiseClass === "GENERATED_NOISE") {
    return "IGNORE_PERMANENTLY";
  }

  if (
    normalized.startsWith("staffordos/hygiene/") &&
    !normalized.endsWith(".json") &&
    !normalized.endsWith(".md")
  ) {
    return "COMMIT_NOW";
  }

  if (
    normalized === "staffordos/hygiene/promotion_readiness_recheck_v1.js" ||
    normalized === "staffordos/hygiene/promotion_readiness_report.md" ||
    normalized === "staffordos/hygiene/hygiene_report_v1.json" ||
    normalized === "staffordos/hygiene/environment_inventory_v1.json" ||
    normalized === "staffordos/hygiene/worktree_cleanup_gate_report.md" ||
    normalized === "staffordos/hygiene/cleanup_execution_plan.md"
  ) {
    return "COMMIT_NOW";
  }

  if (
    normalized === "package.json" ||
    normalized === "package-lock.json" ||
    normalized === "web/package.json" ||
    normalized === "web/package-lock.json" ||
    normalized === "shopify.app.toml" ||
    normalized === "shopify.app.r12b-dev.toml" ||
    normalized.startsWith("staffordos/deploy/") ||
    gitState === "DELETED" ||
    normalized.includes(".pre_") ||
    normalized.includes(".backup") ||
    normalized.endsWith(".bak")
  ) {
    return "MANUAL_DECISION_REQUIRED";
  }

  if (concern === "proof-loop/product" || concern === "experimental/future" || concern === "deploy/config") {
    return "STASH_NOW";
  }

  return "MANUAL_DECISION_REQUIRED";
}

function reasonFor(action, concern, gitState, filePath) {
  if (action === "IGNORE_PERMANENTLY") {
    return "Generated output or cache path. Keep it out of the active review surface.";
  }
  if (action === "COMMIT_NOW") {
    return "Current hygiene/governance work product that reduces ambiguity and belongs in one focused commit.";
  }
  if (action === "STASH_NOW") {
    return `Valid ${concern} work, but not needed for immediate worktree reduction. Stash to isolate the active hygiene slice.`;
  }
  if (gitState === "DELETED") {
    return "Deletion changes need explicit intent review before they are committed or discarded.";
  }
  return "Needs Ross decision because it changes deploy/config truth, dependency truth, or a mixed-scope source surface.";
}

function buildChangedPathSet(hygieneReport, porcelainEntries) {
  return uniqueSorted([
    ...porcelainEntries.map((entry) => entry.path),
    ...(hygieneReport.generated_noise || []),
  ]);
}

function buildRows(hygieneReport) {
  const porcelainOutput = runGit(["status", "--porcelain=v1"]);
  const porcelainEntries = porcelainOutput
    .split("\n")
    .filter(Boolean)
    .map(parsePorcelainLine);
  const gitStateMap = new Map(
    porcelainEntries.map((entry) => [entry.path, gitStateFor(entry)]),
  );
  const changedPaths = buildChangedPathSet(hygieneReport, porcelainEntries);

  return changedPaths.map((filePath) => {
    const concern = concernFor(filePath);
    const gitState = gitStateMap.get(filePath) || "GENERATED_ONLY";
    const action = actionFor(filePath, concern, gitState);
    return {
      path: filePath,
      concern,
      gitState,
      action,
      reason: reasonFor(action, concern, gitState, filePath),
    };
  });
}

function groupByAction(rows) {
  return {
    COMMIT_NOW: rows.filter((row) => row.action === "COMMIT_NOW"),
    STASH_NOW: rows.filter((row) => row.action === "STASH_NOW"),
    IGNORE_PERMANENTLY: rows.filter((row) => row.action === "IGNORE_PERMANENTLY"),
    MANUAL_DECISION_REQUIRED: rows.filter((row) => row.action === "MANUAL_DECISION_REQUIRED"),
  };
}

function groupByConcern(rows) {
  return {
    "hygiene/governance": rows.filter((row) => row.concern === "hygiene/governance"),
    "proof-loop/product": rows.filter((row) => row.concern === "proof-loop/product"),
    "deploy/config": rows.filter((row) => row.concern === "deploy/config"),
    "generated noise": rows.filter((row) => row.concern === "generated noise"),
    "experimental/future": rows.filter((row) => row.concern === "experimental/future"),
  };
}

function toBulletList(rows) {
  if (!rows.length) return "- None";
  return rows
    .map((row) => `- \`${row.path}\` [${row.gitState}] (${row.concern}) — ${row.reason}`)
    .join("\n");
}

function commandBlock(lines) {
  return lines.length ? lines.join("\n") : "# No command needed.";
}

function relativePaths(rows) {
  return rows.map((row) => row.path);
}

function buildCommands(grouped) {
  const commitPaths = relativePaths(grouped.COMMIT_NOW);
  const stashPaths = relativePaths(grouped.STASH_NOW);
  const ignorePaths = grouped.IGNORE_PERMANENTLY.map((row) => row.path);

  return {
    commit: commitPaths.length
      ? [
          `git -C ${quotePath(CANONICAL_ROOT)} add ${commitPaths.map(quotePath).join(" ")}`,
          `git -C ${quotePath(CANONICAL_ROOT)} commit -m "Finalize hygiene governance reporting"`,
        ]
      : [],
    stash: stashPaths.length
      ? [
          `git -C ${quotePath(CANONICAL_ROOT)} stash push -u -m "worktree-reduction-stash" -- ${stashPaths.map(quotePath).join(" ")}`,
        ]
      : [],
    ignore: ignorePaths.length
      ? [`rm -rf ${ignorePaths.map(quotePath).join(" ")}`]
      : [],
  };
}

function buildExpectedCleanerState(grouped) {
  const notes = [];
  if (grouped.IGNORE_PERMANENTLY.length) {
    notes.push(`Generated noise drops by ${grouped.IGNORE_PERMANENTLY.length} path(s).`);
  }
  if (grouped.COMMIT_NOW.length) {
    notes.push(`Hygiene/governance work collapses into one focused commit covering ${grouped.COMMIT_NOW.length} path(s).`);
  }
  if (grouped.STASH_NOW.length) {
    notes.push(`Non-hygiene scope is removed from the active worktree across ${grouped.STASH_NOW.length} path(s).`);
  }
  if (grouped.MANUAL_DECISION_REQUIRED.length) {
    notes.push(`${grouped.MANUAL_DECISION_REQUIRED.length} path(s) still require Ross to decide commit vs stash vs revert.`);
  }
  return notes.length ? notes : ["No cleaner-state change detected."];
}

function buildMarkdown({ branch, hygieneReport, gateReport, rows, grouped, commands, expectedCleanerState }) {
  const byConcern = groupByConcern(rows);

  return `# Worktree Reduction Plan

## Current Branch

- Branch: \`${branch}\`

## Dirty State Summary

- Hygiene Status: \`${hygieneReport.status}\`
- Cleanup Gate: ${gateReport.match(/- Status:\s+`([^`]+)`/)?.[1] || "UNKNOWN"}
- Staged Paths: ${hygieneReport.staged.length}
- Unstaged Paths: ${hygieneReport.unstaged.length}
- Untracked Paths: ${hygieneReport.untracked.length}
- Generated Noise Paths: ${hygieneReport.generated_noise.length}

### Concern Groups

- hygiene/governance: ${byConcern["hygiene/governance"].length}
- proof-loop/product: ${byConcern["proof-loop/product"].length}
- deploy/config: ${byConcern["deploy/config"].length}
- generated noise: ${byConcern["generated noise"].length}
- experimental/future: ${byConcern["experimental/future"].length}

## Commit Now

${toBulletList(grouped.COMMIT_NOW)}

## Stash Now

${toBulletList(grouped.STASH_NOW)}

## Ignore Permanently

${toBulletList(grouped.IGNORE_PERMANENTLY)}

## Manual Decisions

${toBulletList(grouped.MANUAL_DECISION_REQUIRED)}

## Exact Commands To Run

### Commit Now

\`\`\`bash
${commandBlock(commands.commit)}
\`\`\`

### Stash Now

\`\`\`bash
${commandBlock(commands.stash)}
\`\`\`

### Ignore Permanently

\`\`\`bash
${commandBlock(commands.ignore)}
\`\`\`

## Expected Cleaner State

${expectedCleanerState.map((item) => `- ${item}`).join("\n")}
`;
}

export function runWorktreeReductionPlanner() {
  const hygieneReport = readJson(HYGIENE_REPORT_PATH);
  const gateReport = readText(CLEANUP_GATE_REPORT_PATH);
  const branch = runGit(["branch", "--show-current"]);
  const rows = buildRows(hygieneReport);
  const grouped = groupByAction(rows);
  const commands = buildCommands(grouped);
  const expectedCleanerState = buildExpectedCleanerState(grouped);
  const markdown = buildMarkdown({
    branch,
    hygieneReport,
    gateReport,
    rows,
    grouped,
    commands,
    expectedCleanerState,
  });

  return {
    branch,
    totalChangedPaths: rows.length,
    grouped,
    markdown,
  };
}

export function writeWorktreeReductionPlan(markdown) {
  fs.mkdirSync(path.dirname(OUTPUT_PLAN_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PLAN_PATH, markdown, "utf8");
  if (!fs.existsSync(OUTPUT_PLAN_PATH)) {
    throw new Error(`worktree_reduction_plan.md was not created at ${OUTPUT_PLAN_PATH}`);
  }
  const stats = fs.statSync(OUTPUT_PLAN_PATH);
  if (!stats.isFile()) {
    throw new Error(`worktree_reduction_plan.md path is not a file: ${OUTPUT_PLAN_PATH}`);
  }
  return OUTPUT_PLAN_PATH;
}

export { OUTPUT_PLAN_PATH };
