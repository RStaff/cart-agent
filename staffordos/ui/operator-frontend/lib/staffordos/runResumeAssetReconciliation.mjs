#!/usr/bin/env node
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import readline from "node:readline/promises";

const repositoryRoot = process.cwd();
const frontendPackage = path.join(repositoryRoot, "staffordos/ui/operator-frontend/package.json");
const requireFromFrontend = createRequire(frontendPackage);
const ts = requireFromFrontend("typescript");

const originalTsExtension = Module._extensions[".ts"];
Module._extensions[".ts"] = function compileTypeScriptModule(mod, filename) {
  const source = readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });
  mod._compile(compiled.outputText, filename);
};

const reconciliation = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/resumeAssetReconciliation.ts"),
);
const linkage = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/resumeVersionApplicationLinkage.ts"),
);
const reviewResolution = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/resumeReviewQueueResolution.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultRoots = {
  sourceRoots: [path.join(homedir(), "staffordos-private-intake/career")],
  careerRoots: [
    path.join(homedir(), ".staffordos/private/professional/career-evidence"),
    path.join(homedir(), ".staffordos/private/professional/career"),
  ],
  applicationRoot: path.join(homedir(), ".staffordos/private/professional/job-search/applications"),
  outputRoot: path.join(homedir(), ".staffordos/private/professional/job-search/resume-asset-reconciliation"),
  existingResumeVersionRoot: path.join(homedir(), ".staffordos/private/professional/job-search/resume-linkage"),
  reviewResolutionRoot: path.join(homedir(), ".staffordos/private/professional/job-search/resume-review-queue"),
};

function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const args = { command };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      if (args[key]) {
        args[key] = Array.isArray(args[key]) ? [...args[key], next] : [args[key], next];
      } else {
        args[key] = next;
      }
      index += 1;
    }
  }
  return args;
}

function arrayArg(value, fallback) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return fallback;
}

function roots(args) {
  return {
    sourceRoots: arrayArg(args["source-root"], defaultRoots.sourceRoots),
    careerRoots: arrayArg(args["career-root"], defaultRoots.careerRoots),
    applicationRoot: args["application-root"] || defaultRoots.applicationRoot,
    outputRoot: args["output-root"] || defaultRoots.outputRoot,
    existingResumeVersionRoot: args["existing-resume-version-root"] || defaultRoots.existingResumeVersionRoot,
    reconciliationRoot: args["reconciliation-root"] || args["output-root"] || defaultRoots.outputRoot,
    reviewResolutionRoot: args["review-resolution-root"] || defaultRoots.reviewResolutionRoot,
    repositoryRoot,
  };
}

function generatedAt(args) {
  return typeof args["as-of"] === "string" ? `${args["as-of"].slice(0, 10)}T12:00:00Z` : new Date().toISOString();
}

function buildResult(args) {
  const currentRoots = roots(args);
  const applicationStore = linkage.loadResumeLinkageApplicationStore({
    applicationRoot: currentRoots.applicationRoot,
    repositoryRoot,
  });
  return reconciliation.buildResumeAssetReconciliation({
    sourceRoots: currentRoots.sourceRoots,
    careerRoots: currentRoots.careerRoots,
    applicationStore,
    repositoryRoot,
    generatedAt: generatedAt(args),
    outputRoot: currentRoots.outputRoot,
    existingResumeVersionRoot: currentRoots.existingResumeVersionRoot,
  });
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printLines(lines) {
  process.stdout.write(`${lines.join("\n")}\n`);
}

function writeIfRequested(args, result) {
  if (!args.write) return { written: false, artifactCount: 0 };
  const written = reconciliation.writeResumeAssetReconciliationOutputs({
    outputRoot: roots(args).outputRoot,
    repositoryRoot,
    result,
  });
  return { written: true, artifactCount: written.artifactNames.length };
}

function buildReviewResolution(args, extraDecisions = []) {
  const currentRoots = roots(args);
  const artifacts = reviewResolution.loadLatestResumeAssetReconciliationArtifacts({
    reconciliationRoot: currentRoots.reconciliationRoot,
    repositoryRoot,
  });
  const applicationStore = linkage.loadResumeLinkageApplicationStore({
    applicationRoot: currentRoots.applicationRoot,
    repositoryRoot,
  });
  const existingDecisions = args["ignore-decisions"]
    ? []
    : reviewResolution.loadResumeReviewDecisions({
        decisionRoot: currentRoots.reviewResolutionRoot,
        repositoryRoot,
      });
  const decisionsById = new Map([...existingDecisions, ...extraDecisions].map((decision) => [decision.decisionId, decision]));
  return {
    applicationStore,
    result: reviewResolution.buildResumeReviewQueueResolution({
      artifacts,
      applicationStore,
      generatedAt: generatedAt(args),
      decisions: [...decisionsById.values()],
    }),
  };
}

function writeReviewResolutionIfRequested(args, result) {
  if (!args.write) return { written: false, artifactCount: 0 };
  const written = reviewResolution.writeResumeReviewQueueResolutionOutputs({
    outputRoot: roots(args).reviewResolutionRoot,
    repositoryRoot,
    result,
  });
  return { written: true, artifactCount: written.artifactNames.length };
}

function commandSummary(args) {
  const result = buildResult(args);
  const written = writeIfRequested(args, result);
  printJson({
    ...reconciliation.buildResumeAssetReconciliationCliSummary(result),
    ...written,
  });
}

function commandHealth(args) {
  const result = buildResult(args);
  const written = writeIfRequested(args, result);
  printJson({
    workflowVersion: result.workflowVersion,
    resumeLibraryHealth: result.resumeLibraryHealth,
    sourceIntegrityUnchanged: result.sourceIntegrity.every((record) => record.unchanged),
    applicationResumeLinksCreated: result.auditSummary.applicationResumeLinksCreated,
    privatePathVisible: false,
    ...written,
  });
}

function commandReviewQueue(args) {
  const result = buildResult(args);
  const written = writeIfRequested(args, result);
  printJson({
    workflowVersion: result.workflowVersion,
    reviewQueueItems: result.operatorReviewQueue,
    privatePathVisible: false,
    rawResumeContentVisible: false,
    ...written,
  });
}

function commandReviewResolution(args) {
  const { result } = buildReviewResolution(args);
  const written = writeReviewResolutionIfRequested(args, result);
  printJson({
    ...reviewResolution.buildResumeReviewQueueResolutionCliSummary(result),
    ...written,
  });
}

function printReviewItem(item, index, total) {
  printLines([
    "",
    `REVIEW ITEM ${index + 1} OF ${total}`,
    `Application: ${item.company} / ${item.role}`,
    `Previous state: ${item.previousReadiness}`,
    `Current state: ${item.readiness}`,
    `Historical resume reference: ${item.knownHistoricalResumeReference}`,
    `Duplicate aliases collapsed: ${item.duplicateAliasesCollapsed}`,
    `Eliminated candidates: ${item.eliminatedCount}`,
    "",
    "Candidates:",
    ...(item.candidates.length
      ? item.candidates.map(
          (candidate) => `${candidate.key}. ${candidate.safeLabel} - ${candidate.reasonCandidateRemains}`,
        )
      : ["None under approved private source authority."]),
    "",
    `Question: ${item.question}`,
    "",
    "Allowed responses:",
    ...item.candidates.map((candidate) => `CANDIDATE_${candidate.key}`),
    "UNKNOWN",
    "DEFER",
    "SOURCE_MISSING",
    "STOP",
    "",
    "This records review decisions only. No submitted-resume linkage, message, application submission, resume mutation, provider call, external AI call, /os route, or /operator route is available.",
  ]);
}

function chooseReviewDecision(item, input) {
  const normalized = input.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === "STOP") return "STOP";
  if (normalized === "UNKNOWN" || normalized === "DEFER") {
    return { decisionType: normalized, selectedResumeVersionId: null, rejectedResumeVersionIds: [] };
  }
  if (normalized === "SOURCE_MISSING") {
    return { decisionType: "SOURCE_MISSING_CONFIRMED", selectedResumeVersionId: null, rejectedResumeVersionIds: [] };
  }
  const candidateMatch = normalized.match(/^CANDIDATE_([A-Z])$/);
  const candidateKey = candidateMatch?.[1] || (normalized.length === 1 ? normalized : null);
  const selected = candidateKey ? item.candidates.find((candidate) => candidate.key === candidateKey) : null;
  if (!selected) return null;
  return {
    decisionType: "CANDIDATE_PREFERRED",
    selectedResumeVersionId: selected.resumeVersionId,
    rejectedResumeVersionIds: [],
  };
}

async function commandReview(args) {
  let { applicationStore, result } = buildReviewResolution(args);
  const items = reviewResolution.buildSafeReviewItemsForCli({ result, applicationStore });
  const unresolved = items.filter((item) =>
    ["MULTIPLE_CANDIDATES", "SOURCE_NOT_PRESENT", "UNRESOLVED", "SINGLE_CANDIDATE_NEEDS_OPERATOR_CONFIRMATION", "EXACT_SOURCE_READY"].includes(
      item.readiness,
    ),
  );
  if (!unresolved.length) {
    printLines(["No resume review queue items require operator review."]);
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const savedDecisions = [];
  try {
    for (let index = 0; index < unresolved.length; index += 1) {
      const item = unresolved[index];
      printReviewItem(item, index, unresolved.length);
      const answer = await rl.question("> ");
      const selected = chooseReviewDecision(item, answer);
      if (selected === "STOP") break;
      if (!selected) {
        printLines(["Invalid option; item deferred without saving."]);
        continue;
      }
      const confirmation = (await rl.question("Type SAVE to record this owner-private review decision, or anything else to skip.\n> "))
        .trim()
        .toUpperCase();
      if (confirmation !== "SAVE") {
        printLines(["Decision skipped."]);
        continue;
      }
      const now = new Date().toISOString();
      const decision = reviewResolution.createResumeReviewDecision({
        applicationId: item.applicationId,
        reviewItemId: null,
        decisionType: selected.decisionType,
        selectedResumeVersionId: selected.selectedResumeVersionId,
        rejectedResumeVersionIds: selected.rejectedResumeVersionIds,
        createdAt: now,
      });
      reviewResolution.appendResumeReviewDecision({
        decisionRoot: roots(args).reviewResolutionRoot,
        repositoryRoot,
        decision,
      });
      savedDecisions.push(decision);
      ({ applicationStore, result } = buildReviewResolution(args, savedDecisions));
      reviewResolution.writeResumeReviewQueueResolutionOutputs({
        outputRoot: roots(args).reviewResolutionRoot,
        repositoryRoot,
        result,
      });
      printLines(["Review decision saved privately. No submitted-resume linkage was created."]);
    }
  } finally {
    rl.close();
  }

  printJson({
    ...reviewResolution.buildResumeReviewQueueResolutionCliSummary(result),
    decisionsSaved: savedDecisions.length,
    written: savedDecisions.length > 0,
  });
}

function commandHelp() {
  process.stdout.write(
    [
      "J001.06B owner-private resume asset reconciliation CLI",
      "",
      "Commands:",
      "  resume-inventory [--write]",
      "  resume-reconcile [--write]",
      "  resume-health [--write]",
      "  resume-review-queue [--write]",
      "  review-resolution [--write]",
      "  review",
      "",
      "Optional roots:",
      "  --source-root <approved-private-career-source-root>",
      "  --career-root <private-career-authority-root>",
      "  --application-root <private-application-root>",
      "  --output-root <private-resume-asset-reconciliation-output-root>",
      "  --existing-resume-version-root <private-existing-resume-version-root>",
      "  --reconciliation-root <private-J001.06B-output-root>",
      "  --review-resolution-root <private-J001.06C-output-root>",
      "  --as-of YYYY-MM-DD",
      "",
      "Normal output prints counts or safe labels only.",
      "The review command records candidate-narrowing decisions only.",
      "No application linkage, USED_FOR_SUBMISSION, resume generation, resume mutation, submission, message, provider call, external AI, Ollama, /os, or /operator action is available.",
      "",
    ].join("\n"),
  );
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "resume-inventory" || args.command === "resume-reconcile") commandSummary(args);
  else if (args.command === "resume-health") commandHealth(args);
  else if (args.command === "resume-review-queue") commandReviewQueue(args);
  else if (args.command === "review-resolution") commandReviewResolution(args);
  else if (args.command === "review") await commandReview(args);
  else commandHelp();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
