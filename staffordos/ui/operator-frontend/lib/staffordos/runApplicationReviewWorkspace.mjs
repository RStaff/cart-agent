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

const review = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/applicationReviewWorkspace.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultDecisionRoot = path.join(homedir(), ".staffordos/private/professional/job-search/application-review-decisions");
const defaultOutputRoot = path.join(homedir(), ".staffordos/private/professional/job-search/application-review-workspace");

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

function loadPackages(args) {
  return review.loadApplicationPackageResultFile(requirePath(args, "packages"));
}

function decisionLogPath(args) {
  return path.join(args["decision-root"] || defaultDecisionRoot, "application_review_decisions.ndjson");
}

function loadDecisions(args) {
  if (typeof args.decisions === "string") return review.loadApplicationReviewDecisionsFile(args.decisions);
  const defaultLog = decisionLogPath(args);
  return existsSync(defaultLog) ? review.loadApplicationReviewDecisionsFile(defaultLog) : [];
}

function writeWorkspaceIfRequested(args, result) {
  if (!args.write) return 0;
  return review.writeApplicationReviewWorkspaceOutputs({
    outputRoot: args["output-root"] || defaultOutputRoot,
    repositoryRoot,
    result,
  }).artifactNames.length;
}

function showWorkspace(args) {
  const result = review.buildApplicationReviewWorkspace({
    generatedAt: generatedAt(args),
    packageResult: loadPackages(args),
    reviewDecisions: loadDecisions(args),
  });
  const writtenCount = writeWorkspaceIfRequested(args, result);
  printJson(
    review.buildApplicationReviewWorkspaceCliSummary({
      result,
      privateArtifactsWritten: writtenCount,
    }),
  );
}

function recordDecision(args) {
  if (args.confirm !== "yes") {
    throw new Error("Recording an application package review decision requires --confirm yes.");
  }
  if (typeof args["package-id"] !== "string" || !args["package-id"]) {
    throw new Error("Missing required --package-id <id>");
  }
  if (typeof args.decision !== "string" || !args.decision) {
    throw new Error("Missing required --decision REVIEWED_READY|NEEDS_CHANGES|HOLD|CANCELLED");
  }

  const packageResult = loadPackages(args);
  const existingDecisions = loadDecisions(args);
  const reviewedAt = generatedAt(args);
  const decision = review.buildApplicationReviewDecision({
    packageResult,
    packageId: args["package-id"],
    reviewDecision: args.decision,
    reviewedAt,
    operatorConfirmed: true,
    reviewNotes: typeof args.notes === "string" ? args.notes : null,
    existingDecisions,
  });
  review.writeApplicationReviewDecision({
    decisionRoot: args["decision-root"] || defaultDecisionRoot,
    repositoryRoot,
    decision,
  });
  const result = review.buildApplicationReviewWorkspace({
    generatedAt: reviewedAt,
    packageResult,
    reviewDecisions: [...existingDecisions, decision],
  });
  const writtenCount = writeWorkspaceIfRequested(args, result);
  printJson(
    review.buildApplicationReviewWorkspaceCliSummary({
      result,
      decisionWritten: decision,
      privateArtifactsWritten: writtenCount,
    }),
  );
}

function printHelp() {
  process.stdout.write(
    [
      "J003.05 Application Review Workspace",
      "",
      "Commands:",
      "  workspace --packages <file>                 Project the human-review workspace from existing J003.04 packages.",
      "  decide --packages <file> --package-id <id>  Record one owner-private package review decision.",
      "",
      "Decision options:",
      "  --decision REVIEWED_READY|NEEDS_CHANGES|HOLD|CANCELLED",
      "  --confirm yes",
      "  --notes <private-review-notes>",
      "",
      "Shared options:",
      "  --decisions <application-review-decisions.ndjson|json>",
      "  --write",
      "  --as-of YYYY-MM-DD",
      "  --decision-root <private-decision-root>",
      "  --output-root <private-output-root>",
      "",
      "REVIEWED_READY means ready for Ross's manual application activity only.",
      "No Application, application submission, provider call, browser automation, resume generation, resume mutation, cover letter, message, /os, /operator, external AI, or Ollama action is available.",
    ].join("\n") + "\n",
  );
}

const args = parseArgs(process.argv.slice(2));

try {
  if (args.command === "workspace") {
    showWorkspace(args);
  } else if (args.command === "decide") {
    recordDecision(args);
  } else {
    printHelp();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
