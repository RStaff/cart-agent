#!/usr/bin/env node
import { createRequire } from "node:module";
import Module from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

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

const workflow = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/careerWorkflowActions.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultActionRoot = path.join(homedir(), ".staffordos/private/professional/job-search/career-workflow-actions");
const defaultJobSearchRoot = path.dirname(defaultActionRoot);
const defaultOutputRoot = path.join(homedir(), ".staffordos/private/professional/job-search/career-workflow-state");

function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const args = { command };
  for (let index = 0; index < rest.length; index += 1) {
    const argToken = rest[index];
    if (!argToken.startsWith("--")) continue;
    const key = argToken.slice(2);
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

function generatedAt(args) {
  return typeof args["as-of"] === "string" ? `${args["as-of"].slice(0, 10)}T12:00:00Z` : new Date().toISOString();
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function requirePath(args, key) {
  if (typeof args[key] !== "string" || !args[key]) {
    throw new Error(`Missing required --${key} <file>`);
  }
  return args[key];
}

function loadRecommendations(args) {
  return workflow.loadOpportunityRecommendationResultFile(requirePath(args, "recommendations"));
}

function actionLogPath(args) {
  return path.join(args["action-root"] || defaultActionRoot, "workflow_actions.ndjson");
}

function loadActions(args) {
  if (typeof args.actions === "string") return workflow.loadCareerWorkflowActionsFile(args.actions);
  const defaultLog = actionLogPath(args);
  return existsSync(defaultLog) ? workflow.loadLatestCareerWorkflowActions(args["action-root"] ? path.dirname(args["action-root"]) : defaultJobSearchRoot) : [];
}

function writeStateIfRequested(args, result) {
  if (!args.write) return 0;
  return workflow.writeCareerWorkflowStateOutputs({
    outputRoot: args["output-root"] || defaultOutputRoot,
    repositoryRoot,
    result,
  }).artifactNames.length;
}

function showState(args) {
  const result = workflow.buildCareerWorkflowState({
    recommendationResult: loadRecommendations(args),
    workflowActions: loadActions(args),
    generatedAt: generatedAt(args),
  });
  const writtenCount = writeStateIfRequested(args, result);
  printJson(
    workflow.buildCareerWorkflowCliSummary({
      result,
      privateArtifactsWritten: writtenCount,
    }),
  );
}

function recordAction(args) {
  if (args.confirm !== "yes") {
    throw new Error("Recording a workflow action requires --confirm yes.");
  }
  if (typeof args["recommendation-id"] !== "string" || !args["recommendation-id"]) {
    throw new Error("Missing required --recommendation-id <id>");
  }
  if (typeof args.action !== "string" || !args.action) {
    throw new Error("Missing required --action APPLY|REVIEW_LATER|SKIP|NOT_INTERESTED");
  }

  const recommendationResult = loadRecommendations(args);
  const existingActions = loadActions(args);
  const createdAt = generatedAt(args);
  const action = workflow.createCareerWorkflowAction({
    recommendationResult,
    recommendationId: args["recommendation-id"],
    actionType: args.action,
    generatedAt: createdAt,
    operatorConfirmed: true,
    existingActions,
  });
  workflow.writeCareerWorkflowAction({
    actionRoot: args["action-root"] || defaultActionRoot,
    repositoryRoot,
    action,
  });
  const result = workflow.buildCareerWorkflowState({
    recommendationResult,
    workflowActions: [...existingActions, action],
    generatedAt: createdAt,
  });
  const writtenCount = writeStateIfRequested(args, result);
  printJson(
    workflow.buildCareerWorkflowCliSummary({
      result,
      actionWritten: action,
      privateArtifactsWritten: writtenCount,
    }),
  );
}

function printHelp() {
  process.stdout.write(
    [
      "J003.03 Career Workflow Actions",
      "",
      "Commands:",
      "  state --recommendations <file>                         Project workflow state from an existing J003.01 recommendation result.",
      "  act --recommendations <file> --recommendation-id <id>  Record one owner-private workflow action.",
      "",
      "Action options:",
      "  --action APPLY|REVIEW_LATER|SKIP|NOT_INTERESTED",
      "  --confirm yes",
      "",
      "Shared options:",
      "  --actions <workflow-actions.ndjson|json>",
      "  --write",
      "  --as-of YYYY-MM-DD",
      "  --action-root <private-action-root>",
      "  --output-root <private-output-root>",
      "",
      "APPLY moves the recommendation to a private READY_TO_APPLY planning queue only.",
      "No Application, provider call, browser automation, resume, cover letter, message, /os, /operator, external AI, or Ollama action is available.",
    ].join("\n") + "\n",
  );
}

const args = parseArgs(process.argv.slice(2));

try {
  if (args.command === "state") {
    showState(args);
  } else if (args.command === "act") {
    recordAction(args);
  } else {
    printHelp();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
