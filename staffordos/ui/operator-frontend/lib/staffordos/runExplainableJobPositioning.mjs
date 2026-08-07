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

const positioning = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/explainableJobPositioning.ts"),
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
  outputRoot: path.join(homedir(), ".staffordos/private/professional/job-search/positioning"),
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
    careerRoots: typeof args["career-root"] === "string" ? [args["career-root"]] : defaultRoots.careerRoots,
    outputRoot: args["output-root"] || defaultRoots.outputRoot,
    repositoryRoot,
  };
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function loadAndBuild(args) {
  if (typeof args["analysis-run-id"] !== "string") throw new Error("Missing --analysis-run-id.");
  const currentRoots = roots(args);
  const { analysis, careerStore } = positioning.loadExplainableJobPositioningInputs({
    analysisRoot: currentRoots.analysisRoot,
    repositoryRoot,
    opportunityDirectory: currentRoots.opportunityDirectory,
    careerRoots: currentRoots.careerRoots,
    analysisRunId: args["analysis-run-id"],
  });
  const model = positioning.buildExplainableJobPositioningModel({
    analysis,
    facts: careerStore.facts,
    evidence: careerStore.evidence,
    generatedAt: new Date().toISOString(),
  });
  positioning.assertNoForbiddenPositioningUpgrade(model);
  return { model, currentRoots };
}

function commandPreview(args) {
  const { model } = loadAndBuild(args);
  printJson({
    preview: true,
    ...positioning.buildCliSummary(model),
    privatePathVisible: false,
    privateArtifactsWritten: false,
  });
}

function commandGenerate(args) {
  const { model, currentRoots } = loadAndBuild(args);
  const output = positioning.writeExplainableJobPositioningOutput({
    model,
    outputRoot: currentRoots.outputRoot,
    repositoryRoot,
  });
  printJson({
    generated: true,
    ...positioning.buildCliSummary(model),
    artifactCount: output.artifactNames.length,
    privatePathVisible: false,
    applicationSubmitted: false,
    messageSent: false,
    resumeMutated: false,
    linkedInMutated: false,
    publicArtifactCreated: false,
  });
}

function commandHelp() {
  process.stdout.write(
    [
      "J001.04 owner-private explainable fit and positioning CLI",
      "",
      "Commands:",
      "  preview  --analysis-run-id <id>",
      "  generate --analysis-run-id <id>",
      "",
      "Optional roots:",
      "  --analysis-root <private-analysis-root>",
      "  --opportunity-root <private-opportunity-root>",
      "  --career-root <private-career-root>",
      "  --output-root <private-positioning-output-root>",
      "",
      "No application, message, resume, LinkedIn, provider, /os, or /operator action is available.",
      "",
    ].join("\n"),
  );
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "preview") commandPreview(args);
  else if (args.command === "generate") commandGenerate(args);
  else commandHelp();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
