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

const review = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/privateJobAnalysisReview.ts"),
);
const presentation = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/jobAnalysisReviewPresentation.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultRoots = {
  analysisRoot: path.join(homedir(), ".staffordos/private/professional/job-search/analysis"),
  opportunityDirectory: path.join(homedir(), ".staffordos/private/professional/job-search/opportunities"),
  decisionRoot: path.join(homedir(), ".staffordos/private/professional/job-search/analysis-decisions"),
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
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function roots(args) {
  return {
    analysisRoot: args["analysis-root"] || defaultRoots.analysisRoot,
    opportunityDirectory: args["opportunity-root"] || defaultRoots.opportunityDirectory,
    decisionRoot: args["decision-root"] || defaultRoots.decisionRoot,
    repositoryRoot,
  };
}

function loadSelected(args) {
  const selected = review.loadPrivateJobAnalysisRun({
    ...roots(args),
    analysisRunId: typeof args["analysis-run-id"] === "string" ? args["analysis-run-id"] : null,
    latest: args.latest !== false,
  });
  const decisions = review.loadPrivateJobAnalysisDecisions({
    decisionRoot: roots(args).decisionRoot,
    repositoryRoot,
    opportunityId: selected.metadata.opportunityId,
    analysisRunId: selected.metadata.analysisRunId,
  });
  return { ...selected, decisions };
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printLines(lines) {
  process.stdout.write(`${lines.join("\n")}\n`);
}

function redactedQuestionForCli(question) {
  if (!question) return null;
  return {
    reviewQuestionId: question.reviewQuestionId,
    opportunityId: question.opportunityId,
    requirementId: question.requirementId,
    question: question.question,
    whyItMatters: question.whyItMatters,
    candidateCareerFactCount: question.candidateCareerFactIds.length,
    candidateEvidenceCount: question.candidateEvidenceIds.length,
    currentClassification: question.currentClassification,
    currentLimitation: question.currentLimitation,
    allowedDecisionTypes: question.allowedDecisionTypes,
    priority: question.priority,
    status: question.status,
    answeredAt: question.answeredAt,
    operatorDecisionId: question.operatorDecisionId,
  };
}

function redactedPresentationForCli(model) {
  return {
    ...model,
    priorityReviewQuestions: model.priorityReviewQuestions.map(redactedQuestionForCli),
    positioning: {
      ...model.positioning,
      currentPrimaryGap: model.positioning.currentPrimaryGap
        ? "Private requirement detail available through inspect-requirement."
        : model.positioning.currentPrimaryGap,
    },
  };
}

function runList(args) {
  const runs = review.listPrivateJobAnalysisRuns(roots(args));
  printJson({
    surface: "OWNER_PRIVATE_LOCAL_CLI",
    privatePathVisible: false,
    runs: presentation.buildJobAnalysisRunListPresentation(runs),
  });
}

function runSummary(args) {
  const selected = loadSelected(args);
  const model = presentation.buildJobAnalysisReviewPresentation({
    metadata: selected.metadata,
    bundle: selected.bundle,
    decisions: selected.decisions,
  });
  printJson(redactedPresentationForCli(model));
}

function runNextQuestion(args) {
  const selected = loadSelected(args);
  const model = presentation.buildJobAnalysisReviewPresentation({
    metadata: selected.metadata,
    bundle: selected.bundle,
    decisions: selected.decisions,
    maxQuestions: 1,
  });
  const question = model.priorityReviewQuestions[0] || null;
  printJson({
    surface: "OWNER_PRIVATE_LOCAL_CLI",
    analysisRunId: selected.metadata.analysisRunId,
    opportunityId: selected.metadata.opportunityId,
    question: redactedQuestionForCli(question),
    privatePathVisible: false,
    rawListingTextVisible: false,
    sourceUrlVisible: false,
    contactVisible: false,
  });
}

function runInspectRequirement(args) {
  if (typeof args["requirement-id"] !== "string") throw new Error("Missing --requirement-id.");
  const selected = loadSelected(args);
  const requirement = selected.bundle.requirements.find((item) => item.id === args["requirement-id"]);
  const mapping = selected.bundle.mappings.find((item) => item.requirementId === args["requirement-id"]);
  if (!requirement || !mapping) throw new Error("Requirement was not found in selected analysis.");
  printJson({
    surface: "OWNER_PRIVATE_LOCAL_CLI",
    requirement: {
      requirementId: requirement.id,
      requirementText: requirement.requirementText,
      category: requirement.requirementCategory,
      level: requirement.requirementLevel,
      ambiguity: requirement.ambiguity,
    },
    mapping: {
      classification: mapping.classification,
      limitation: mapping.supportLimitations[0] || null,
      candidateCareerFactCount: mapping.careerFactIds.length,
      candidateEvidenceCount: mapping.careerEvidenceIds.length,
      safePositioning: mapping.safePositioning,
    },
    rawListingTextVisible: false,
    sourceUrlVisible: false,
    privatePathVisible: false,
  });
}

async function confirmDecision(args) {
  if (args.confirm === "yes") return;
  if (!process.stdin.isTTY) throw new Error("Decision save requires --confirm yes in non-interactive mode.");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("Type SAVE to append this private operator decision: ");
    if (answer !== "SAVE") throw new Error("Decision save not confirmed.");
  } finally {
    rl.close();
  }
}

function commaList(value) {
  if (typeof value !== "string" || !value.trim()) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function runDecide(args) {
  const selected = loadSelected(args);
  if (typeof args["review-question-id"] !== "string") throw new Error("Missing --review-question-id.");
  if (typeof args["requirement-id"] !== "string") throw new Error("Missing --requirement-id.");
  if (typeof args["decision-type"] !== "string") throw new Error("Missing --decision-type.");
  await confirmDecision(args);
  const mapping = selected.bundle.mappings.find((item) => item.requirementId === args["requirement-id"]);
  const useAllCandidateEvidence = args["use-candidate-evidence"] === "all";
  const decision = review.createPrivateJobAnalysisOperatorDecision({
    bundle: selected.bundle,
    analysisRunId: selected.metadata.analysisRunId,
    reviewQuestionId: args["review-question-id"],
    requirementId: args["requirement-id"],
    decisionType: args["decision-type"],
    selectedCareerFactIds: useAllCandidateEvidence ? mapping?.careerFactIds || [] : commaList(args["career-fact-ids"]),
    selectedEvidenceIds: useAllCandidateEvidence ? mapping?.careerEvidenceIds || [] : commaList(args["evidence-ids"]),
    operatorContext: typeof args.context === "string" ? args.context : null,
    existingDecisions: selected.decisions,
    createdAt: new Date().toISOString(),
    operatorConfirmed: true,
  });
  review.appendPrivateJobAnalysisOperatorDecision({
    decisionRoot: roots(args).decisionRoot,
    repositoryRoot,
    decision,
  });
  printJson({
    saved: true,
    decisionId: decision.decisionId,
    decisionType: decision.decisionType,
    reviewQuestionId: decision.reviewQuestionId,
    requirementId: decision.requirementId,
    privatePathVisible: false,
    applicationSubmitted: false,
    messageSent: false,
    resumeMutated: false,
  });
}

function runRegenerate(args) {
  const selected = loadSelected(args);
  if (!selected.decisions.length) throw new Error("No private decisions are available for this analysis run.");
  const generatedAt = new Date().toISOString();
  const regenerated = review.regeneratePrivateJobAnalysisFromDecisions({
    previous: { metadata: selected.metadata, bundle: selected.bundle },
    decisions: selected.decisions,
    generatedAt,
  });
  const written = review.writeRegeneratedPrivateJobAnalysis({
    outputRoot: roots(args).analysisRoot,
    repositoryRoot,
    previous: { metadata: selected.metadata, bundle: selected.bundle },
    regeneratedBundle: regenerated.regeneratedBundle,
    changeReport: regenerated.changeReport,
  });
  printJson({
    regenerated: true,
    previousAnalysisRunId: written.previousAnalysisRunId,
    regeneratedAnalysisRunId: written.regeneratedAnalysisRunId,
    artifactCount: written.privateArtifactNames.length,
    artifactNames: written.privateArtifactNames,
    classificationChanges: written.changeReport.classificationChanges,
    coverageBefore: written.changeReport.coverageBefore,
    coverageAfter: written.changeReport.coverageAfter,
    recommendationBefore: written.changeReport.recommendationBefore,
    recommendationAfter: written.changeReport.recommendationAfter,
    nextActionAfter: written.changeReport.nextActionAfter,
    privatePathVisible: false,
  });
}

function printHelp() {
  printLines([
    "J001.03B owner-private local review CLI",
    "",
    "Commands:",
    "  list",
    "  summary --latest",
    "  next-question --latest",
    "  inspect-requirement --latest --requirement-id <id>",
    "  decide --latest --review-question-id <id> --requirement-id <id> --decision-type <type> --confirm yes [--use-candidate-evidence all]",
    "  regenerate --latest",
    "",
    "Safety:",
    "  No /os route, /operator route, API, provider call, AI call, message, application submission, or resume mutation is available.",
  ]);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "help" || args.command === "--help") return printHelp();
  if (args.command === "list") return runList(args);
  if (args.command === "summary") return runSummary(args);
  if (args.command === "next-question") return runNextQuestion(args);
  if (args.command === "inspect-requirement") return runInspectRequirement(args);
  if (args.command === "decide") return runDecide(args);
  if (args.command === "regenerate") return runRegenerate(args);
  throw new Error(`Unsupported command: ${args.command}`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
