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

const recommendations = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/opportunityRecommendationEngine.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultOutputRoot = path.join(homedir(), ".staffordos/private/professional/job-search/opportunity-recommendations");

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

function build(args) {
  const result = recommendations.buildOpportunityRecommendationEngine({
    generatedAt: generatedAt(args),
    queueResult: recommendations.loadQueueResultFile(requirePath(args, "queue-result")),
    explainableFitArtifacts:
      typeof args["fit-artifacts"] === "string" ? recommendations.loadExplainableFitArtifactsFile(args["fit-artifacts"]) : [],
    resumeVersions:
      typeof args["resume-versions"] === "string" ? recommendations.loadResumeVersionsFile(args["resume-versions"]) : [],
  });
  let writtenCount = 0;
  if (args.write) {
    writtenCount = recommendations.writeOpportunityRecommendationOutputs({
      outputRoot: args["output-root"] || defaultOutputRoot,
      repositoryRoot,
      result,
    }).artifactNames.length;
  }
  printJson(recommendations.buildOpportunityRecommendationCliSummary(result, writtenCount));
}

function printHelp() {
  process.stdout.write(
    [
      "J003.01 Opportunity Recommendation Engine",
      "",
      "Commands:",
      "  recommend --queue-result <file>       Build private application recommendations from an existing J002 queue.",
      "",
      "Options:",
      "  --fit-artifacts <file>                Existing Explainable Fit artifacts, optional.",
      "  --resume-versions <file>              Existing ResumeVersion records, optional.",
      "  --write                               Write private outputs outside Git.",
      "  --as-of YYYY-MM-DD",
      "  --output-root <private-output-root>",
      "",
      "No providers, applications, resumes, cover letters, messages, /os, /operator, external AI, or Ollama action is available.",
    ].join("\n") + "\n",
  );
}

const args = parseArgs(process.argv.slice(2));

try {
  if (args.command === "recommend") {
    build(args);
  } else {
    printHelp();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
