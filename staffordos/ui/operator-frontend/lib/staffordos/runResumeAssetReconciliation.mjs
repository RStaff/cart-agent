#!/usr/bin/env node
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
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

const reconciliation = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/resumeAssetReconciliation.ts"),
);
const linkage = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/resumeVersionApplicationLinkage.ts"),
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

function writeIfRequested(args, result) {
  if (!args.write) return { written: false, artifactCount: 0 };
  const written = reconciliation.writeResumeAssetReconciliationOutputs({
    outputRoot: roots(args).outputRoot,
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
      "",
      "Optional roots:",
      "  --source-root <approved-private-career-source-root>",
      "  --career-root <private-career-authority-root>",
      "  --application-root <private-application-root>",
      "  --output-root <private-resume-asset-reconciliation-output-root>",
      "  --existing-resume-version-root <private-existing-resume-version-root>",
      "  --as-of YYYY-MM-DD",
      "",
      "Normal output prints counts or safe labels only.",
      "No application linkage, resume generation, resume mutation, submission, message, provider call, external AI, Ollama, /os, or /operator action is available.",
      "",
    ].join("\n"),
  );
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "resume-inventory" || args.command === "resume-reconcile") commandSummary(args);
  else if (args.command === "resume-health") commandHealth(args);
  else if (args.command === "resume-review-queue") commandReviewQueue(args);
  else commandHelp();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
