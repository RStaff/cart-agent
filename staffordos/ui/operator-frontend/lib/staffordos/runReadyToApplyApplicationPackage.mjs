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

const packages = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/readyToApplyApplicationPackage.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultOutputRoot = path.join(homedir(), ".staffordos/private/professional/job-search/application-packages");

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

function packageReadyItems(args) {
  const result = packages.buildReadyToApplyApplicationPackages({
    generatedAt: generatedAt(args),
    workflowState: packages.loadCareerWorkflowStateResultFile(requirePath(args, "workflow-state")),
    recommendationResult: packages.loadRecommendationResultFile(requirePath(args, "recommendations")),
    queueResult:
      typeof args["queue-result"] === "string" ? packages.loadJobSourceQueueResultFile(args["queue-result"]) : null,
  });
  let writtenCount = 0;
  if (args.write) {
    writtenCount = packages.writeReadyToApplyApplicationPackageOutputs({
      outputRoot: args["output-root"] || defaultOutputRoot,
      repositoryRoot,
      result,
    }).artifactNames.length;
  }
  printJson(packages.buildReadyToApplyPackageCliSummary(result, writtenCount));
}

function printHelp() {
  process.stdout.write(
    [
      "J003.04 Ready to Apply Application Package",
      "",
      "Commands:",
      "  package --workflow-state <file> --recommendations <file>  Build deterministic preparation packages for READY_TO_APPLY items.",
      "",
      "Options:",
      "  --queue-result <file>                                     Existing J002.02 queue result for canonical job URL lookup.",
      "  --write                                                   Write owner-private package artifacts outside Git.",
      "  --as-of YYYY-MM-DD",
      "  --output-root <private-output-root>",
      "",
      "Every package requires human review.",
      "No Application, application submission, provider call, browser automation, resume generation, resume mutation, cover letter, message, /os, /operator, external AI, or Ollama action is available.",
    ].join("\n") + "\n",
  );
}

const args = parseArgs(process.argv.slice(2));

try {
  if (args.command === "package") {
    packageReadyItems(args);
  } else {
    printHelp();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
