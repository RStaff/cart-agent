#!/usr/bin/env node
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import readline from "node:readline/promises";

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
  outputRoot: path.join(homedir(), ".staffordos/private/professional/job-search/resume-linkage"),
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
    repositoryRoot,
  };
}

function generatedAt(args) {
  return typeof args["as-of"] === "string" ? `${args["as-of"].slice(0, 10)}T12:00:00Z` : new Date().toISOString();
}

function buildResult(args, decisions = []) {
  const currentRoots = roots(args);
  const applicationStore = linkage.loadResumeLinkageApplicationStore({
    applicationRoot: currentRoots.applicationRoot,
    repositoryRoot,
  });
  return linkage.buildResumeVersionApplicationLinkage({
    sourceRoots: currentRoots.sourceRoots,
    careerRoots: currentRoots.careerRoots,
    applicationStore,
    repositoryRoot,
    generatedAt: generatedAt(args),
    outputRoot: currentRoots.outputRoot,
    decisions,
  });
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printLines(lines) {
  process.stdout.write(`${lines.join("\n")}\n`);
}

function printCounts(result, extra = {}) {
  printJson({
    ...linkage.buildResumeLinkageCliSummary(result),
    ...extra,
  });
}

function commandInventory(args) {
  const result = buildResult(args);
  if (args.write) {
    const written = linkage.writeResumeVersionApplicationLinkageOutputs({
      outputRoot: roots(args).outputRoot,
      repositoryRoot,
      result,
    });
    printCounts(result, { written: true, artifactCount: written.artifactNames.length });
    return;
  }
  printCounts(result, { written: false });
}

function actionCandidates(result, applicationId) {
  return result.applicationCandidates.filter((candidate) => candidate.applicationId === applicationId);
}

function printApplicationPrompt(result, applicationId, index, total) {
  const link = result.applicationResumeLinks.find((item) => item.applicationId === applicationId);
  const candidates = actionCandidates(result, applicationId);
  printLines([
    "",
    `Application ${index + 1} of ${total}`,
    `Application ID: ${applicationId}`,
    `Current resume link: ${link?.linkType || "UNKNOWN"}`,
    "",
    "Candidate versions:",
    ...(candidates.length
      ? candidates.map((candidate, candidateIndex) => `${candidateIndex + 1}. ${candidate.safeLabel} (${candidate.confidence})`)
      : ["No candidate resume versions available."]),
    "",
    "Type a candidate number to confirm USED_FOR_SUBMISSION, UNKNOWN, DEFER, or STOP.",
    "No resume content or private filesystem path is printed.",
  ]);
}

function parseDecision(answer, candidates) {
  const normalized = answer.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === "STOP") return "STOP";
  if (normalized === "UNKNOWN" || normalized === "DEFER") return { outcome: normalized, resumeVersionId: null };
  const index = Number.parseInt(normalized, 10);
  if (Number.isInteger(index) && index >= 1 && index <= candidates.length) {
    return { outcome: "CONFIRM_USED", resumeVersionId: candidates[index - 1].resumeVersionId };
  }
  return null;
}

async function commandReview(args) {
  const currentRoots = roots(args);
  let result = buildResult(args);
  const applicationIds = result.applicationResumeLinks.map((link) => link.applicationId);
  const decisions = [];
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    for (let index = 0; index < applicationIds.length; index += 1) {
      const applicationId = applicationIds[index];
      const candidates = actionCandidates(result, applicationId);
      printApplicationPrompt(result, applicationId, index, applicationIds.length);
      const answer = await rl.question("> ");
      const parsed = parseDecision(answer, candidates);
      if (parsed === "STOP") break;
      if (!parsed) {
        printLines(["Invalid input; item deferred without saving."]);
        continue;
      }
      const confirmation = (await rl.question("Type SAVE to record this owner-private resume-link decision.\n> ")).trim().toUpperCase();
      if (confirmation !== "SAVE") {
        printLines(["Decision skipped."]);
        continue;
      }
      decisions.push({
        applicationId,
        resumeVersionId: parsed.resumeVersionId,
        outcome: parsed.outcome,
        operatorConfirmed: parsed.outcome === "CONFIRM_USED",
        createdAt: new Date().toISOString(),
      });
      result = buildResult(args, decisions);
      linkage.writeResumeVersionApplicationLinkageOutputs({
        outputRoot: currentRoots.outputRoot,
        repositoryRoot,
        result,
      });
      printLines(["Resume-link decision saved privately. No external action was performed."]);
    }
  } finally {
    rl.close();
  }
  printCounts(result, { decisionsSaved: decisions.length, written: decisions.length > 0 });
}

function commandHelp() {
  process.stdout.write(
    [
      "J001.06 owner-private resume version and application linkage CLI",
      "",
      "Commands:",
      "  inventory [--write]",
      "  review",
      "",
      "Optional roots:",
      "  --source-root <approved-private-career-source-root>",
      "  --career-root <private-career-authority-root>",
      "  --application-root <private-application-root>",
      "  --output-root <private-resume-linkage-output-root>",
      "  --as-of YYYY-MM-DD",
      "",
      "The inventory command prints counts only.",
      "The review command records owner-private resume-link decisions one application at a time.",
      "No resume generation, resume mutation, application submission, message, provider call, external AI, Ollama, API, database, /os, or /operator action is available.",
      "",
    ].join("\n"),
  );
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "inventory") commandInventory(args);
  else if (args.command === "review") await commandReview(args);
  else commandHelp();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
