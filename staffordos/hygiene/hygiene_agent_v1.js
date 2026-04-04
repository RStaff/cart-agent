import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { classifyNoisePath, classifyNoisePaths } from "./noise_classifier_v1.js";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const REPORT_PATH = path.join(CANONICAL_ROOT, "staffordos/hygiene/hygiene_report_v1.json");

function runGit(args) {
  return execFileSync("git", ["-C", CANONICAL_ROOT, ...args], {
    encoding: "utf8",
  }).trim();
}

function runGitRaw(args) {
  return execFileSync("git", ["-C", CANONICAL_ROOT, ...args], {
    encoding: "utf8",
  });
}

function safeAccess(targetPath) {
  try {
    fs.accessSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

function walkDirs(root, results, depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return;
  let entries = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(root, entry.name);
    const classification = classifyNoisePath(fullPath);
    const matchesNoise = classification === "GENERATED_NOISE";
    const reviewRequired = classification === "REVIEW_REQUIRED";

    if (matchesNoise) {
      results.push(fullPath);
      continue;
    }

    if (reviewRequired) {
      continue;
    }

    if (entry.name === "node_modules") {
      const cacheDir = path.join(fullPath, ".cache");
      if (safeAccess(cacheDir) && classifyNoisePath(cacheDir) === "GENERATED_NOISE") {
        results.push(cacheDir);
      }
      continue;
    }

    walkDirs(fullPath, results, depth + 1, maxDepth);
  }
}

function walkFiles(root, predicate, results, depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return;
  let entries = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      walkFiles(fullPath, predicate, results, depth + 1, maxDepth);
      continue;
    }
    if (predicate(entry.name, fullPath)) {
      results.push(fullPath);
    }
  }
}

function parsePorcelainLine(line) {
  const indexStatus = line.slice(0, 1);
  const worktreeStatus = line.slice(1, 2);
  const rawPath = line.slice(3).trim();
  const pathText = rawPath.includes(" -> ") ? rawPath.split(" -> ").at(-1) : rawPath;
  return {
    indexStatus,
    worktreeStatus,
    path: pathText,
  };
}

function parsePorcelain(output) {
  const lines = output ? output.split("\n").filter(Boolean) : [];
  const staged = [];
  const unstaged = [];
  const untracked = [];

  for (const line of lines) {
    const parsed = parsePorcelainLine(line);
    if (parsed.indexStatus === "?" && parsed.worktreeStatus === "?") {
      untracked.push(parsed.path);
      continue;
    }
    if (parsed.indexStatus !== " " && parsed.indexStatus !== "?") {
      staged.push(parsed.path);
    }
    if (parsed.worktreeStatus !== " " && parsed.worktreeStatus !== "?") {
      unstaged.push(parsed.path);
    }
  }

  return {
    staged: [...new Set(staged)].sort(),
    unstaged: [...new Set(unstaged)].sort(),
    untracked: [...new Set(untracked)].sort(),
  };
}

function getTopLevelConcern(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  if (!normalized) return "unknown";
  const segments = normalized.split("/");
  if (segments.length === 1) return segments[0];
  if (segments[0] === "staffordos" && segments[1]) return `staffordos/${segments[1]}`;
  if (segments[0] === "abando-frontend" && segments[1]) return `abando-frontend/${segments[1]}`;
  if (segments[0] === "web" && segments[1]) return `web/${segments[1]}`;
  return segments[0];
}

function detectMixedConcernRisk(paths) {
  const concerns = new Set(paths.map(getTopLevelConcern));
  return {
    count: concerns.size,
    concerns: [...concerns].sort(),
  };
}

function collectEnvFiles() {
  const results = [];
  walkFiles(
    CANONICAL_ROOT,
    (name) =>
      name === ".env" ||
      name.startsWith(".env.") ||
      name === ".env.local" ||
      name.endsWith(".env.local") ||
      name.endsWith(".env.production") ||
      name.endsWith(".env.production.local") ||
      name === ".env.example",
    results,
    0,
    3,
  );
  return [...new Set(results)].sort();
}

function collectLockfiles() {
  const results = [];
  walkFiles(
    CANONICAL_ROOT,
    (name) =>
      name === "package-lock.json" ||
      name === "pnpm-lock.yaml" ||
      name === "yarn.lock" ||
      name.endsWith(".lock"),
    results,
    0,
    3,
  );
  return [...new Set(results)].sort();
}

function collectGeneratedNoise() {
  const results = [];
  walkDirs(CANONICAL_ROOT, results, 0, 3);
  return [...new Set(results)].sort();
}

function collectDeployBlockers() {
  const blockers = [];
  const hasVercelProject = safeAccess(path.join(CANONICAL_ROOT, "abando-frontend", ".vercel"));
  const hasRenderConfig =
    safeAccess(path.join(CANONICAL_ROOT, "render.yaml")) ||
    safeAccess(path.join(CANONICAL_ROOT, "render.backend.yaml"));

  if (hasVercelProject && !process.env.VERCEL_TOKEN) {
    blockers.push("VERCEL_TOKEN missing while abando-frontend/.vercel is present");
  }

  if (hasRenderConfig && !process.env.RENDER_API_KEY && !process.env.RENDER_TOKEN) {
    blockers.push("RENDER_API_KEY/RENDER_TOKEN missing while Render config is present");
  }

  return blockers;
}

function buildRecommendedActions({
  staged,
  unstaged,
  untracked,
  generatedNoise,
  deployBlockers,
  mixedConcernRisk,
  lockfiles,
}) {
  const actions = [];

  if (deployBlockers.length > 0) {
    actions.push("Restore deploy credentials before relying on local promotion actions.");
  }
  if (mixedConcernRisk.count > 5) {
    actions.push(`Split changes by concern. Current worktree spans ${mixedConcernRisk.count} top-level areas.`);
  }
  if (generatedNoise.length > 0) {
    actions.push("Review generated build output and cache directories before trusting git status.");
  }
  if (staged.length > 0 && unstaged.length > 0) {
    actions.push("Separate staged and unstaged work before promotion or release review.");
  }
  if (untracked.length > 20) {
    actions.push("Triage large untracked surface area and keep only intended new files.");
  }
  if (lockfiles.length > 3) {
    actions.push("Confirm which lockfiles are intentional so dependency drift is explicit.");
  }
  if (actions.length === 0) {
    actions.push("No cleanup needed.");
  }

  return actions;
}

function determineStatus({ staged, unstaged, untracked, deployBlockers, mixedConcernRisk, generatedNoise }) {
  if (deployBlockers.length > 0) return "BLOCKED";
  const totalChanges = staged.length + unstaged.length + untracked.length;
  if (totalChanges === 0 && generatedNoise.length === 0) return "CLEAN";
  if (mixedConcernRisk.count > 8 || totalChanges > 80) return "BLOCKED";
  return "DIRTY";
}

export function runHygieneAgentCheck() {
  const branch = runGit(["branch", "--show-current"]);
  const porcelain = runGitRaw(["status", "--porcelain=v1"]);
  const { staged, unstaged, untracked } = parsePorcelain(porcelain);
  const generatedNoise = collectGeneratedNoise();
  const envFiles = collectEnvFiles();
  const lockfiles = collectLockfiles();
  const deployBlockers = collectDeployBlockers();
  const mixedConcernRisk = detectMixedConcernRisk([...staged, ...unstaged, ...untracked]);
  const noiseSummary = classifyNoisePaths([
    ...staged,
    ...unstaged,
    ...untracked,
    ...generatedNoise,
  ]);
  const recommendedActions = buildRecommendedActions({
    staged,
    unstaged,
    untracked,
    generatedNoise,
    deployBlockers,
    mixedConcernRisk,
    lockfiles,
  });

  const report = {
    status: determineStatus({
      staged,
      unstaged,
      untracked,
      deployBlockers,
      mixedConcernRisk,
      generatedNoise,
    }),
    branch,
    staged,
    unstaged,
    untracked,
    generated_noise: generatedNoise,
    noise_summary: noiseSummary,
    env_files: envFiles,
    deploy_blockers: deployBlockers,
    recommended_actions: recommendedActions,
  };

  return report;
}

export function writeHygieneReport(report) {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return REPORT_PATH;
}

export { REPORT_PATH, CANONICAL_ROOT };
