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

const drafts = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/truthBoundResumeDraft.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultOutputRoot = path.join(
  homedir(),
  ".staffordos/private/professional/job-search/application-artifacts",
);

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

function commaList(value) {
  if (typeof value !== "string" || !value.trim()) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function numberArg(value, fallback) {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function build(args) {
  const { result, writeResult } = drafts.buildTruthBoundResumeDraftsFromFiles({
    generatedAt: generatedAt(args),
    packetResultFile: requirePath(args, "packet-result"),
    careerFactsFile: typeof args["career-facts"] === "string" ? args["career-facts"] : null,
    careerEvidenceFile: typeof args["career-evidence"] === "string" ? args["career-evidence"] : null,
    outputRoot: args["output-root"] || defaultOutputRoot,
    repositoryRoot,
    writeOutputs: Boolean(args.write),
    packetIds: commaList(args["packet-ids"] || args["packet-id"]),
    limit: numberArg(args.limit, undefined),
  });
  printJson(drafts.buildTruthBoundResumeDraftCliSummary(result, writeResult?.writtenFiles.length || 0));
}

function latest(args) {
  const { result, writeResult } = drafts.runTruthBoundResumeDraftsFromPrivateArtifacts({
    generatedAt: typeof args["as-of"] === "string" ? generatedAt(args) : undefined,
    jobSearchRoot: typeof args["job-search-root"] === "string" ? args["job-search-root"] : undefined,
    repositoryRoot,
    writeOutputs: Boolean(args.write),
    packetIds: commaList(args["packet-ids"] || args["packet-id"]),
    limit: numberArg(args.limit, 1),
  });
  printJson(drafts.buildTruthBoundResumeDraftCliSummary(result, writeResult?.writtenFiles.length || 0));
}

function printHelp() {
  process.stdout.write(
    [
      "CAREEROS V1.03 Truth-Bound Resume Draft",
      "",
      "Commands:",
      "  build --packet-result <file>",
      "  latest",
      "",
      "Options:",
      "  --career-facts <file>                Existing CareerFact authority, optional.",
      "  --career-evidence <file>             Existing CareerEvidence authority, optional.",
      "  --packet-id <id>                     Restrict to one packet/opportunity/recommendation ID.",
      "  --packet-ids <id,id>",
      "  --limit <n>                          Number of packet drafts to build; latest defaults to 1.",
      "  --job-search-root <private-root>",
      "  --output-root <private-output-root>",
      "  --write                              Write private draft artifacts outside Git.",
      "  --as-of YYYY-MM-DD",
      "",
      "No model call, Application creation, application submission, DOCX/PDF export, upload, messaging, browser activity, provider call, external AI, or Ollama action is available.",
    ].join("\n") + "\n",
  );
}

const args = parseArgs(process.argv.slice(2));

try {
  if (args.command === "build") {
    build(args);
  } else if (args.command === "latest") {
    latest(args);
  } else {
    printHelp();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
