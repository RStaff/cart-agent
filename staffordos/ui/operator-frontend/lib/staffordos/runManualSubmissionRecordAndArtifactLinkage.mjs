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

const manualSubmission = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/manualSubmissionRecordAndArtifactLinkage.ts"),
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
    const entry = rest[index];
    if (!entry.startsWith("--")) continue;
    const key = entry.slice(2);
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

function latest(args) {
  const artifactVersionId = typeof args["artifact-id"] === "string" ? args["artifact-id"].trim() : "";
  const submittedAt = typeof args["submitted-at"] === "string" ? args["submitted-at"].trim() : "";
  const { result, writeResult } = manualSubmission.runManualSubmissionRecordAndArtifactLinkageFromPrivateArtifacts({
    generatedAt: typeof args["as-of"] === "string" ? generatedAt(args) : undefined,
    jobSearchRoot: typeof args["job-search-root"] === "string" ? args["job-search-root"] : defaultJobSearchRoot,
    repositoryRoot,
    artifactVersionId,
    submittedAt: submittedAt || null,
    submittedAtPrecision: submittedAt ? "DATE" : undefined,
    submissionChannel: typeof args["submission-channel"] === "string" ? args["submission-channel"] : null,
    operatorConfirmed: Boolean(args.confirm),
    writeOutputs: Boolean(args.write),
  });
  printJson(manualSubmission.buildManualSubmissionRecordAndArtifactLinkageCliSummary(
    result,
    writeResult?.writtenFiles.length || 0,
  ));
}

function printHelp() {
  process.stdout.write(
    [
      "CAREEROS V1.04 Manual Submission Record and Artifact Linkage",
      "",
      "Commands:",
      "  latest",
      "",
      "Options:",
      "  --artifact-id <id>                  Required reviewed resume export artifact ID.",
      "  --submitted-at YYYY-MM-DD           Required date Ross manually submitted outside CareerOS.",
      "  --submission-channel <label>        Optional channel such as company careers site.",
      "  --confirm                           Required operator confirmation.",
      "  --write                             Write private Application/linkage artifacts outside Git.",
      "  --job-search-root <private-root>",
      "  --as-of YYYY-MM-DD",
      "",
      "This runner records an already-completed manual external submission. It does not submit, upload, message, browse, generate, mutate resumes, call providers, invoke external AI, or use Ollama.",
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
