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

const packets = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/applicationIntelligencePacket.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultOutputRoot = path.join(
  homedir(),
  ".staffordos/private/professional/job-search/application-intelligence-packets",
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

function build(args) {
  const { result, writeResult } = packets.buildApplicationIntelligencePacketsFromFiles({
    generatedAt: generatedAt(args),
    queueResultFile: requirePath(args, "queue-result"),
    recommendationResultFile: requirePath(args, "recommendation-result"),
    fitArtifactsFile: typeof args["fit-artifacts"] === "string" ? args["fit-artifacts"] : null,
    resumeVersionsFile: typeof args["resume-versions"] === "string" ? args["resume-versions"] : null,
    outputRoot: args["output-root"] || defaultOutputRoot,
    repositoryRoot,
    writeOutputs: Boolean(args.write),
  });
  printJson(packets.buildApplicationIntelligencePacketCliSummary(result, writeResult?.writtenFiles.length || 0));
}

function buildFromIntake(args) {
  const { result, writeResult } = packets.runApplicationIntelligencePacketFromIntakeResult({
    intakeResultFile: requirePath(args, "intake-result"),
    generatedAt: typeof args["as-of"] === "string" ? generatedAt(args) : undefined,
    jobSearchRoot: typeof args["job-search-root"] === "string" ? args["job-search-root"] : undefined,
    repositoryRoot,
    writeOutputs: Boolean(args.write),
  });
  printJson(packets.buildApplicationIntelligencePacketCliSummary(result, writeResult?.writtenFiles.length || 0));
}

function buildFromLatest(args) {
  const { result, writeResult } = packets.runApplicationIntelligencePacketsFromPrivateArtifacts({
    generatedAt: typeof args["as-of"] === "string" ? generatedAt(args) : undefined,
    jobSearchRoot: typeof args["job-search-root"] === "string" ? args["job-search-root"] : undefined,
    repositoryRoot,
    writeOutputs: Boolean(args.write),
  });
  printJson(packets.buildApplicationIntelligencePacketCliSummary(result, writeResult?.writtenFiles.length || 0));
}

function printHelp() {
  process.stdout.write(
    [
      "CAREEROS V1.02 Application Intelligence Packet",
      "",
      "Commands:",
      "  build --queue-result <file> --recommendation-result <file>",
      "  from-intake --intake-result <file>",
      "  latest",
      "",
      "Options:",
      "  --fit-artifacts <file>                Existing Explainable Fit artifacts, optional.",
      "  --resume-versions <file>              Existing ResumeVersion records, optional.",
      "  --job-search-root <private-root>",
      "  --output-root <private-output-root>",
      "  --write                               Write private packet outputs outside Git.",
      "  --as-of YYYY-MM-DD",
      "",
      "No applications, resumes, cover letters, messages, browser activity, provider calls, external AI, or Ollama action is available.",
    ].join("\n") + "\n",
  );
}

const args = parseArgs(process.argv.slice(2));

try {
  if (args.command === "build") {
    build(args);
  } else if (args.command === "from-intake") {
    buildFromIntake(args);
  } else if (args.command === "latest") {
    buildFromLatest(args);
  } else {
    printHelp();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
