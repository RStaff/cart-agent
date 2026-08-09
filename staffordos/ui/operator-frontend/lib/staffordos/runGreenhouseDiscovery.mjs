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

const greenhouse = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/greenhouseDiscoveryProvider.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultOutputRoot = path.join(homedir(), ".staffordos/private/professional/job-search/greenhouse-discovery");

function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const args = { command };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = rest[index + 1];
    const assign = (value) => {
      if (Object.prototype.hasOwnProperty.call(args, key)) {
        args[key] = Array.isArray(args[key]) ? [...args[key], value] : [args[key], value];
      } else {
        args[key] = value;
      }
    };
    if (!next || next.startsWith("--")) {
      assign(true);
    } else {
      assign(next);
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

function manifestFromArgs(args) {
  if (typeof args.manifest === "string") {
    return greenhouse.loadGreenhouseProviderManifest(args.manifest);
  }
  return greenhouse.EXAMPLE_GREENHOUSE_PROVIDER_MANIFEST;
}

function positiveInt(value, fallback) {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function stringList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string" && item.trim());
  return typeof value === "string" && value.trim() ? [value] : [];
}

async function discover(args) {
  const careerRoots = stringList(args["career-root"]);
  const careerStore = careerRoots.length
    ? greenhouse.loadGreenhouseCareerEvidenceAuthority({
        careerRoots,
        repositoryRoot,
      })
    : { facts: [], evidence: [] };
  const result = await greenhouse.buildGreenhouseDiscoveryQueue({
    manifest: manifestFromArgs(args),
    generatedAt: generatedAt(args),
    applications: [],
    careerFacts: careerStore.facts,
    careerEvidence: careerStore.evidence,
    maxJobsPerSource: positiveInt(args["max-jobs-per-source"], 60),
  });
  let writtenCount = 0;
  if (args.write) {
    writtenCount = greenhouse.writeGreenhouseDiscoveryOutputs({
      outputRoot: args["output-root"] || defaultOutputRoot,
      repositoryRoot,
      result,
    }).length;
  }
  printJson(greenhouse.buildGreenhouseDiscoveryCliSummary(result, writtenCount));
}

function printHelp() {
  process.stdout.write(
    [
      "J002.02B Greenhouse Discovery MVP",
      "",
      "Commands:",
      "  manifest-example                      Print an example Greenhouse provider manifest.",
      "  discover --manifest <file>            Retrieve public Greenhouse jobs and build a private Opportunity Queue.",
      "  discover --example                    Use the built-in public example manifest.",
      "",
      "Options:",
      "  --max-jobs-per-source <n>             Limit retrieval processed per board after public API response.",
      "  --career-root <private-root>          Load existing private Career Evidence authority; may be repeated.",
      "  --write                               Write private outputs outside Git.",
      "  --as-of YYYY-MM-DD",
      "  --output-root <private-output-root>",
      "",
      "Only public Greenhouse Job Board API GET requests are available.",
      "No authentication, cookies, scraping, browser automation, applications, resumes, messages, /os, /operator, external AI, or Ollama action is available.",
    ].join("\n") + "\n",
  );
}

const args = parseArgs(process.argv.slice(2));

try {
  if (args.command === "manifest-example") {
    printJson(greenhouse.EXAMPLE_GREENHOUSE_PROVIDER_MANIFEST);
  } else if (args.command === "discover") {
    await discover(args);
  } else {
    printHelp();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
