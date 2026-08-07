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
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/roleFocusedCareerEvidenceReview.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultRoots = {
  analysisRoot: path.join(homedir(), ".staffordos/private/professional/job-search/analysis"),
  opportunityDirectory: path.join(homedir(), ".staffordos/private/professional/job-search/opportunities"),
  careerRoots: [
    path.join(homedir(), ".staffordos/private/professional/career-evidence"),
    path.join(homedir(), ".staffordos/private/professional/career"),
    path.join(homedir(), ".staffordos/private/professional"),
  ],
  decisionRoot: path.join(homedir(), ".staffordos/private/professional/career-evidence/role-focused-decisions"),
};

const outcomeMenu = [
  { key: "1", outcome: "NEEDS_EVIDENCE", label: "Needs more evidence" },
  { key: "2", outcome: "TRANSFERABLE", label: "Transferable only" },
  { key: "3", outcome: "PARTIALLY_SUPPORTED", label: "Partially supported" },
  { key: "4", outcome: "CONFLICTING", label: "Conflicting" },
  { key: "5", outcome: "REJECTED", label: "Rejected" },
  { key: "6", outcome: "DEFERRED", label: "Deferred" },
  { key: "7", outcome: "VERIFIED", label: "Verified, only with direct non-resume authority" },
];

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
    careerRoots: typeof args["career-root"] === "string" ? [args["career-root"]] : defaultRoots.careerRoots,
    decisionRoot: args["decision-root"] || defaultRoots.decisionRoot,
    repositoryRoot,
  };
}

function loadContext(args) {
  if (typeof args["analysis-run-id"] !== "string") throw new Error("Missing --analysis-run-id.");
  const currentRoots = roots(args);
  const analysis = review.loadRoleFocusedAnalysis({
    analysisRoot: currentRoots.analysisRoot,
    repositoryRoot,
    opportunityDirectory: currentRoots.opportunityDirectory,
    analysisRunId: args["analysis-run-id"],
  });
  const careerStore = review.loadPrivateCareerEvidenceStore({
    careerRoots: currentRoots.careerRoots,
    repositoryRoot,
  });
  const decisions = review.loadRoleFocusedCareerEvidenceDecisions({
    decisionRoot: currentRoots.decisionRoot,
    repositoryRoot,
    analysisRunId: analysis.metadata.analysisRunId,
  });
  const maxItems = Number.parseInt(args["max-items"] || "8", 10);
  const items = review
    .buildRoleFocusedCareerEvidenceReviewItems({
      analysis,
      facts: careerStore.facts,
      evidence: careerStore.evidence,
      maxItems: Number.isFinite(maxItems) ? maxItems : 8,
    })
    .filter((item) => !decisions.some((decision) => decision.reviewItemId === item.reviewItemId));
  return { analysis, careerStore, decisions, items };
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printLines(lines) {
  process.stdout.write(`${lines.join("\n")}\n`);
}

function summarizeItemForJson(item) {
  return {
    reviewItemId: item.reviewItemId,
    requirementId: item.requirementId,
    requirement: item.requirementText,
    currentClassification: item.currentClassification,
    currentConflictStatus: item.currentConflictStatus,
    reusableCareerLanes: item.reusableCareerLanes,
    candidateFactCount: item.candidateFacts.length,
    candidateEvidenceCount: item.candidateEvidence.length,
    whatWouldMoveToPartial: item.whatWouldMoveToPartial,
    whatWouldMoveToProven: item.whatWouldMoveToProven,
    conciseQuestion: item.conciseQuestion,
    priority: item.priority,
  };
}

function runList(args) {
  const context = loadContext(args);
  printJson({
    surface: "OWNER_PRIVATE_LOCAL_CLI",
    analysisRunId: context.analysis.metadata.analysisRunId,
    opportunityId: context.analysis.metadata.opportunityId,
    currentCoverage: context.analysis.bundle.fitAssessment.coverage,
    selectedReviewItemCount: context.items.length,
    items: context.items.map(summarizeItemForJson),
    privatePathVisible: false,
  });
}

function printInteractiveItem(item, index, total) {
  printLines([
    "",
    `Career evidence question ${index + 1} of ${total}`,
    `Requirement: ${item.requirementText}`,
    `Current classification: ${item.currentClassification}`,
    `Current conflict status: ${item.currentConflictStatus}`,
    `Reusable lanes: ${item.reusableCareerLanes.join(", ")}`,
    "",
    "Candidate Career facts:",
    ...item.candidateFacts.map(
      (fact, factIndex) =>
        `  ${factIndex + 1}. ${fact.statement}\n     status=${fact.verificationStatus}; authority=${fact.authorityClassification}; skillContext=${fact.skillContext || "none"}; metric=${fact.metricClassification || "none"}`,
    ),
    "",
    "Candidate evidence:",
    ...item.candidateEvidence.map(
      (evidence, evidenceIndex) =>
        `  ${evidenceIndex + 1}. ${evidence.evidenceType}; authority=${evidence.authorityClassification}; freshness=${evidence.freshness}; sourceKind=${evidence.sourceKind || "unknown"}`,
    ),
    "",
    `To move to PARTIAL: ${item.whatWouldMoveToPartial}`,
    `To move to PROVEN: ${item.whatWouldMoveToProven}`,
    "",
    item.conciseQuestion,
    ...outcomeMenu.map((entry) => `  ${entry.key}. ${entry.outcome} - ${entry.label}`),
    "",
    "Type a number, an outcome, or STOP.",
  ]);
}

function normalizeOutcome(answer) {
  const normalized = answer.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === "STOP" || normalized === "EXIT" || normalized === "QUIT") return "STOP";
  const byKey = outcomeMenu.find((entry) => entry.key === normalized);
  if (byKey) return byKey.outcome;
  return outcomeMenu.find((entry) => entry.outcome === normalized)?.outcome || null;
}

function selectedEvidenceForOutcome(item, outcome) {
  if (outcome === "PARTIALLY_SUPPORTED" || outcome === "TRANSFERABLE" || outcome === "VERIFIED") {
    return {
      selectedCareerFactIds: item.candidateFacts.map((fact) => fact.id),
      selectedEvidenceIds: item.candidateEvidence.map((evidence) => evidence.id),
    };
  }
  return { selectedCareerFactIds: [], selectedEvidenceIds: [] };
}

function regenerate(args, context) {
  const decisions = review.loadRoleFocusedCareerEvidenceDecisions({
    decisionRoot: roots(args).decisionRoot,
    repositoryRoot,
    analysisRunId: context.analysis.metadata.analysisRunId,
  });
  const generatedAt = new Date().toISOString();
  const regenerated = review.regenerateAnalysisAfterRoleFocusedCareerReview({
    previous: context.analysis,
    decisions,
    generatedAt,
  });
  const written = review.writeRegeneratedAnalysisAfterRoleFocusedCareerReview({
    outputRoot: roots(args).analysisRoot,
    repositoryRoot,
    previous: context.analysis,
    regeneratedBundle: regenerated.regeneratedBundle,
    changeReport: regenerated.changeReport,
  });
  printJson({
    completed: true,
    regenerated: true,
    previousAnalysisRunId: written.previousAnalysisRunId,
    regeneratedAnalysisRunId: written.regeneratedAnalysisRunId,
    decisionsApplied: written.changeReport.decisionsApplied,
    classificationChanges: written.changeReport.classificationChanges,
    coverageBefore: written.changeReport.coverageBefore,
    coverageAfter: written.changeReport.coverageAfter,
    remainingMajorGaps: written.changeReport.remainingMajorGaps,
    reusableCareerFactsImproved: written.changeReport.reusableCareerFactsImproved,
    positioningImplications: written.changeReport.positioningImplications,
    recommendationBefore: written.changeReport.recommendationBefore,
    recommendationAfter: written.changeReport.recommendationAfter,
    nextActionAfter: written.changeReport.nextActionAfter,
    canonicalCareerEvidenceUpdated: written.changeReport.canonicalCareerEvidenceUpdated,
    privatePathVisible: false,
    applicationSubmitted: false,
    messageSent: false,
    resumeMutated: false,
  });
}

async function runReview(args) {
  if (!process.stdin.isTTY) throw new Error("Interactive review requires a terminal.");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    let context = loadContext(args);
    const total = context.items.length;
    if (!total) {
      printLines(["No focused Career evidence review items remain. Regenerating from saved decisions..."]);
      regenerate(args, context);
      return;
    }
    printLines([
      "S010.02D owner-private role-focused Career evidence review",
      `Analysis: ${context.analysis.metadata.analysisRunId}`,
      `Opportunity: ${context.analysis.metadata.opportunityId}`,
      `Selected review items: ${total}`,
      "No application, message, resume, provider, /os, or /operator action is available.",
    ]);

    while (true) {
      context = loadContext(args);
      const remaining = context.items;
      const answered = total - remaining.length;
      if (!remaining.length) {
        printLines(["", "Focused Career evidence review decisions complete. Regenerating analysis..."]);
        regenerate(args, context);
        return;
      }

      const item = remaining[0];
      printInteractiveItem(item, answered, total);
      const answer = await rl.question("> ");
      const outcome = normalizeOutcome(answer);
      if (outcome === "STOP") {
        printJson({
          stopped: true,
          saved: false,
          remainingReviewItemCount: remaining.length,
          privatePathVisible: false,
        });
        return;
      }
      if (!outcome) {
        printLines(["Unsupported outcome. Choose a listed number, outcome, or STOP."]);
        continue;
      }

      const selectedEvidence = selectedEvidenceForOutcome(item, outcome);
      let operatorContext = null;
      if (outcome === "PARTIALLY_SUPPORTED" || outcome === "NEEDS_EVIDENCE" || outcome === "CONFLICTING") {
        operatorContext = (await rl.question("Optional private context, or Enter to skip: ")).trim() || null;
      }

      let decision;
      try {
        decision = review.createRoleFocusedCareerEvidenceDecision({
          item,
          outcome,
          ...selectedEvidence,
          operatorContext,
          existingDecisions: context.decisions,
          createdAt: new Date().toISOString(),
          operatorConfirmed: true,
        });
      } catch (error) {
        printLines([`Decision rejected: ${error instanceof Error ? error.message : String(error)}`]);
        continue;
      }

      printLines([
        "",
        `Outcome: ${decision.outcome}`,
        "This appends a private role-focused Career evidence decision and does not verify canonical Career facts.",
        "Type SAVE to append, BACK to choose again, or STOP.",
      ]);
      const confirmation = (await rl.question("> ")).trim().toUpperCase();
      if (confirmation === "STOP") {
        printJson({
          stopped: true,
          saved: false,
          remainingReviewItemCount: remaining.length,
          privatePathVisible: false,
        });
        return;
      }
      if (confirmation !== "SAVE") {
        printLines(["Decision not saved."]);
        continue;
      }
      review.appendRoleFocusedCareerEvidenceDecision({
        decisionRoot: roots(args).decisionRoot,
        repositoryRoot,
        decision,
      });
      printJson({
        saved: true,
        decisionId: decision.decisionId,
        outcome: decision.outcome,
        requirementId: decision.requirementId,
        privatePathVisible: false,
        canonicalCareerEvidenceUpdated: false,
        applicationSubmitted: false,
        messageSent: false,
        resumeMutated: false,
      });
    }
  } finally {
    rl.close();
  }
}

function printHelp() {
  printLines([
    "S010.02D owner-private role-focused Career evidence review CLI",
    "",
    "Commands:",
    "  list --analysis-run-id <id> [--max-items 8]",
    "  review --analysis-run-id <id> [--max-items 8]",
    "",
    "Safety:",
    "  No /os route, /operator route, API, provider call, AI call, message, application submission, or resume mutation is available.",
  ]);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "help" || args.command === "--help") return printHelp();
  if (args.command === "list") return runList(args);
  if (args.command === "review") return runReview(args);
  throw new Error(`Unsupported command: ${args.command}`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
