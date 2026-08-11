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

const exportsApi = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/reviewedResumeDraftExport.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultJobSearchRoot = path.join(
  homedir(),
  ".staffordos/private/professional/job-search",
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

function commaList(value) {
  if (typeof value !== "string" || !value.trim()) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function numberArg(value, fallback) {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function latest(args) {
  const { result, writeResult } = exportsApi.runReviewedResumeDraftExportFromPrivateArtifacts({
    generatedAt: typeof args["as-of"] === "string" ? generatedAt(args) : undefined,
    jobSearchRoot: typeof args["job-search-root"] === "string" ? args["job-search-root"] : defaultJobSearchRoot,
    repositoryRoot,
    writeOutputs: Boolean(args.write),
    approveForExport: Boolean(args.approve),
    artifactIds: commaList(args["artifact-ids"] || args["artifact-id"]),
    limit: numberArg(args.limit, 1),
  });
  printJson(exportsApi.buildReviewedResumeDraftExportCliSummary(result, writeResult?.writtenFiles.length || 0));
}

function printHelp() {
  process.stdout.write(
    [
      "CAREEROS V1.03B Reviewed Resume Draft Export",
      "",
      "Commands:",
      "  latest",
      "",
      "Options:",
      "  --artifact-id <id>                  Restrict to one draft artifact, packet, or opportunity ID.",
      "  --artifact-ids <id,id>",
      "  --limit <n>                         Number of latest draft artifacts to review; defaults to 1.",
      "  --job-search-root <private-root>",
      "  --approve                           Apply APPROVE_FOR_EXPORT before attempting export.",
      "  --write                             Write private export artifacts outside Git.",
      "  --as-of YYYY-MM-DD",
      "",
      "Only APPROVED_FOR_EXPORT truth-bound drafts can produce DOCX files. No Application, submission, upload, message, provider call, external AI, or Ollama action is available.",
    ].join("\n") + "\n",
  );
}

const args = parseArgs(process.argv.slice(2));

try {
  if (args.command === "latest") {
    latest(args);
  } else {
    printHelp();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
