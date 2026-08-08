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

const pipeline = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/privateApplicationPipelineReview.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultRoots = {
  applicationRoot: path.join(homedir(), ".staffordos/private/professional/job-search/applications"),
  reviewRoot: path.join(homedir(), ".staffordos/private/professional/job-search/application-pipeline-review"),
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
    applicationRoot: args["application-root"] || defaultRoots.applicationRoot,
    reviewRoot: args["review-root"] || defaultRoots.reviewRoot,
    repositoryRoot,
  };
}

function generatedAt(args) {
  return typeof args["as-of"] === "string" ? `${args["as-of"].slice(0, 10)}T12:00:00Z` : new Date().toISOString();
}

function loadResult(args, decisions = []) {
  const currentRoots = roots(args);
  const store = pipeline.loadPrivateApplicationPipelineStore({
    applicationRoot: currentRoots.applicationRoot,
    repositoryRoot,
  });
  return pipeline.buildPrivateApplicationPipelineReviewResult({
    store,
    generatedAt: generatedAt(args),
    decisions,
  });
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printLines(lines) {
  process.stdout.write(`${lines.join("\n")}\n`);
}

function printCountsOnly(result, extra = {}) {
  printJson({
    ...pipeline.buildPrivateApplicationPipelineCliSummary(result),
    ...extra,
  });
}

function printAction(action, index = null, total = null) {
  const header = index === null ? "PRIMARY NEXT ACTION" : `ACTION ${index + 1} OF ${total}`;
  printLines([
    "",
    header,
    `Title: ${action.title}`,
    `Why: ${action.reason}`,
    `Status: ${action.currentStage}`,
    `Review date: ${action.reviewDate || "None recorded"}`,
    `Submitted date: ${action.submittedDate || "UNKNOWN"}`,
    `Days since submission: ${action.daysSinceSubmission === null ? "UNKNOWN" : action.daysSinceSubmission}`,
    `Employer response: ${action.employerResponseStatus}`,
    `What to do: ${action.whatRossShouldDo}`,
    `Requires: ${action.authorityRequired}`,
    `Completion proof: ${action.completionProof}`,
    `Communication allowed: ${action.communicationAllowed}`,
    `Operator approval required: ${action.operatorApprovalRequired}`,
    "",
    "Known:",
    ...action.known.map((item) => `- ${item}`),
    "Unknown:",
    ...action.unknown.map((item) => `- ${item}`),
    "",
    "Options:",
    ...action.allowedActions.map((item, optionIndex) => `${optionIndex + 1}. ${item}`),
    "",
    "No message, application submission, resume mutation, provider call, external AI call, API call, database call, or browser route is available.",
  ]);
}

function printDailyCommand(result) {
  const command = result.dailyCommand;
  printLines([
    "JOB SEARCH COMMAND",
    "",
    `Generated: ${command.generatedAt}`,
    `Submitted applications: ${command.pipelineSummary.submittedApplications}`,
    `Follow-ups due: ${command.pipelineSummary.followUpReviewsDue}`,
    `Confirmation needed: ${command.pipelineSummary.applicationsNeedingOperatorConfirmation}`,
    `Interviews active: ${command.searchHealth.interviewsActive}`,
    `Recent outcomes: ${command.searchHealth.recentOutcomes}`,
    "",
    "Search health:",
    command.searchHealth.descriptiveSummary,
  ]);

  if (command.primaryNextAction) {
    printAction(command.primaryNextAction);
  } else {
    printLines(["", "PRIMARY NEXT ACTION", "No recorded application action needs attention."]);
  }
}

function chooseDecision(action, input) {
  const normalized = input.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === "STOP") return "STOP";
  const numeric = Number.parseInt(normalized, 10);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= action.allowedActions.length) {
    return action.allowedActions[numeric - 1];
  }
  return action.allowedActions.includes(normalized) ? normalized : null;
}

function commandInventory(args) {
  const result = loadResult(args);
  printCountsOnly(result, {
    surface: "OWNER_PRIVATE_LOCAL_CLI",
    interactiveReviewAvailable: true,
  });
}

function commandSummary(args) {
  const currentRoots = roots(args);
  const result = loadResult(args);
  if (args["write-snapshot"]) {
    const written = pipeline.writePrivateApplicationPipelineReviewOutputs({
      outputRoot: currentRoots.reviewRoot,
      repositoryRoot,
      result,
    });
    if (args["counts-only"]) {
      printCountsOnly(result, {
        written: true,
        artifactCount: written.artifactNames.length,
      });
      return;
    }
  }
  if (args.json) printJson(result.dailyCommand);
  else if (args["counts-only"]) printCountsOnly(result);
  else printDailyCommand(result);
}

async function commandReview(args) {
  const currentRoots = roots(args);
  let result = loadResult(args);
  const actions = result.nextActions;
  if (!actions.length) {
    printLines(["No current application pipeline review actions are available."]);
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const savedDecisions = [];
  try {
    for (let index = 0; index < actions.length; index += 1) {
      const action = actions[index];
      printAction(action, index, actions.length);
      const answer = await rl.question("> ");
      const decisionType = chooseDecision(action, answer);
      if (decisionType === "STOP") break;
      if (!decisionType) {
        printLines(["Invalid option; item deferred without saving."]);
        continue;
      }
      const confirmation = (await rl.question("Type SAVE to record this owner-private decision, or anything else to skip.\n> ")).trim().toUpperCase();
      if (confirmation !== "SAVE") {
        printLines(["Decision skipped."]);
        continue;
      }
      const now = new Date().toISOString();
      const decision = pipeline.buildPipelineReviewDecision({
        action,
        decisionType,
        operatorConfirmed: true,
        createdAt: now,
      });
      savedDecisions.push(decision);
      result = pipeline.buildPrivateApplicationPipelineReviewResult({
        store: pipeline.loadPrivateApplicationPipelineStore({
          applicationRoot: currentRoots.applicationRoot,
          repositoryRoot,
        }),
        generatedAt: now,
        decisions: savedDecisions,
      });
      pipeline.writePrivateApplicationPipelineReviewOutputs({
        outputRoot: currentRoots.reviewRoot,
        repositoryRoot,
        result,
      });
      printLines(["Decision saved privately. No external action was performed."]);
    }
  } finally {
    rl.close();
  }

  printCountsOnly(result, {
    decisionsSaved: savedDecisions.length,
    written: savedDecisions.length > 0,
  });
}

function commandHelp() {
  process.stdout.write(
    [
      "J001.05B owner-private application pipeline review CLI",
      "",
      "Commands:",
      "  inventory",
      "  summary [--write-snapshot] [--counts-only] [--json]",
      "  review",
      "",
      "Optional roots:",
      "  --application-root <private-application-root>",
      "  --review-root <private-review-output-root>",
      "  --as-of YYYY-MM-DD",
      "",
      "The summary command answers: What should Ross do next in his job search today?",
      "The review command records owner-private decisions one item at a time.",
      "No application submission, message, resume mutation, provider call, AI call, API, database, public route, or deployed UI is available.",
      "",
    ].join("\n"),
  );
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "inventory") commandInventory(args);
  else if (args.command === "summary") commandSummary(args);
  else if (args.command === "review") await commandReview(args);
  else commandHelp();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
