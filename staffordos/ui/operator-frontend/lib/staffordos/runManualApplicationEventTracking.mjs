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

const tracking = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/manualApplicationEventTracking.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultRoots = {
  applicationRoot: path.join(homedir(), ".staffordos/private/professional/job-search/applications"),
};

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

function roots(args) {
  return {
    applicationRoot: args["application-root"] || defaultRoots.applicationRoot,
    repositoryRoot,
  };
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function normalizeApplications(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray(payload.applications)) return payload.applications;
  throw new Error("Payload must be an array or an object with applications.");
}

function readHiddenTerminalPayload() {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let finished = false;
    const stdin = process.stdin;
    const wasRaw = Boolean(stdin.isTTY && stdin.setRawMode);

    function restore() {
      if (wasRaw) stdin.setRawMode(false);
      stdin.pause();
    }

    function complete(value) {
      if (finished) return;
      finished = true;
      restore();
      process.stdout.write("\n");
      resolve(value);
    }

    function fail(error) {
      if (finished) return;
      finished = true;
      restore();
      reject(error);
    }

    process.stdout.write("Paste private JSON payload. Input will not echo. End with a line containing EOF.\n");
    stdin.setEncoding("utf8");
    if (wasRaw) stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", (chunk) => {
      if (chunk.includes("\u0003")) {
        fail(new Error("Input cancelled."));
        return;
      }
      buffer += chunk.replace(/\r/g, "\n");
      const match = buffer.match(/(^|\n)EOF(\n|$)/);
      if (match) {
        complete(buffer.slice(0, match.index).trim());
      }
    });
    stdin.on("error", fail);
  });
}

async function readPayload(args) {
  if (typeof args.input === "string") return readFileSync(args.input, "utf8");
  if (process.stdin.isTTY) return readHiddenTerminalPayload();
  return readFileSync(0, "utf8");
}

function loadExisting(currentRoots) {
  return tracking.loadExistingPrivateApplications({
    applicationRoot: currentRoots.applicationRoot,
    repositoryRoot,
  });
}

function commandInventory(args) {
  const currentRoots = roots(args);
  const existing = loadExisting(currentRoots);
  printJson({
    surface: "OWNER_PRIVATE_LOCAL_CLI",
    applications: existing.length,
    privatePathVisible: false,
    noApplicationSubmitted: true,
    noMessageSent: true,
    noResumeMutated: true,
    noExternalProviderCall: true,
  });
}

async function commandRecordBatch(args) {
  const currentRoots = roots(args);
  const payload = JSON.parse(await readPayload(args));
  const generatedAt =
    payload && typeof payload === "object" && typeof payload.generatedAt === "string"
      ? payload.generatedAt
      : new Date().toISOString();
  const existing = loadExisting(currentRoots);
  const result = tracking.buildManualApplicationTrackingResult({
    applications: normalizeApplications(payload),
    existingApplications: existing,
    generatedAt,
  });
  const summary = tracking.buildManualApplicationCliSummary(result);

  if (!args.write) {
    printJson({
      preview: true,
      ...summary,
      privateArtifactsWritten: false,
    });
    return;
  }

  const written = tracking.writeManualApplicationTrackingOutputs({
    outputRoot: currentRoots.applicationRoot,
    repositoryRoot,
    result,
  });
  printJson({
    written: true,
    ...summary,
    artifactCount: written.artifactNames.length,
    privatePathVisible: false,
    noApplicationSubmitted: true,
    noMessageSent: true,
    noResumeMutated: true,
    noExternalProviderCall: true,
  });
}

function commandHelp() {
  process.stdout.write(
    [
      "J001.05A owner-private manual application event tracking CLI",
      "",
      "Commands:",
      "  inventory",
      "  record-batch [--write] [--input <private-json-file>]",
      "",
      "Optional roots:",
      "  --application-root <private-application-root>",
      "",
      "The record-batch command reads private facts from stdin or an input file and prints only counts.",
      "No application, message, resume, provider, API, database, /os, or /operator action is available.",
      "",
    ].join("\n"),
  );
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "inventory") commandInventory(args);
  else if (args.command === "record-batch") await commandRecordBatch(args);
  else commandHelp();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
