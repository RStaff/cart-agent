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

const engagement = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/applicationFollowUpResponseTracking.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultApplicationRoot = path.join(homedir(), ".staffordos/private/professional/job-search/applications");
const defaultOutputRoot = path.join(homedir(), ".staffordos/private/professional/job-search/career-engagement");

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

function loadStore(args) {
  if (typeof args.store === "string") {
    return engagement.loadApplicationEngagementStoreFile(args.store);
  }
  return engagement.loadApplicationEngagementStoreFromPrivateRoot({
    applicationRoot: args["application-root"] || defaultApplicationRoot,
    repositoryRoot,
  });
}

function buildQueue(args) {
  return engagement.buildApplicationEngagementQueue({
    store: loadStore(args),
    generatedAt: generatedAt(args),
  });
}

function commandQueue(args) {
  const result = buildQueue(args);
  let writtenCount = 0;
  if (args.write) {
    writtenCount = engagement.writeApplicationEngagementQueueOutputs({
      outputRoot: args["output-root"] || defaultOutputRoot,
      repositoryRoot,
      result,
    }).artifactNames.length;
  }
  printJson(engagement.buildApplicationEngagementCliSummary(result, writtenCount));
}

function commandInspect(args) {
  const result = buildQueue(args);
  if (args.json) {
    printJson(result.careerEngagementQueue);
    return;
  }
  printJson({
    workflowVersion: result.workflowVersion,
    generatedAt: result.generatedAt,
    applicationsNeedingAttention: result.summary.applicationsNeedingAttention,
    queue: result.careerEngagementQueue.map((item) => ({
      applicationId: item.applicationId,
      company: item.company,
      role: item.role,
      applicationDate: item.applicationDate,
      currentApplicationStatus: item.currentApplicationStatus,
      lastApplicationEventType: item.lastApplicationEvent?.eventType || null,
      followUpState: item.followUpState,
      followUpDueDate: item.followUpDueDate,
      responseState: item.responseState,
      recommendedNextEngagementAction: item.recommendedNextEngagementAction,
      blockingIssueCount: item.blockingIssues.length,
      communicationAllowed: item.communicationAllowed,
      operatorApprovalRequired: item.operatorApprovalRequired,
    })),
    noMessageSent: result.auditSummary.noMessageSent,
    noApplicationSubmitted: result.auditSummary.noApplicationSubmitted,
    noExternalProviderCall: result.auditSummary.noExternalProviderCall,
    privatePathVisible: false,
  });
}

function printHelp() {
  process.stdout.write(
    [
      "J004.01 Application Follow-Up and Response Tracking",
      "",
      "Commands:",
      "  queue                         Build the deterministic Career Engagement queue.",
      "  inspect                       Show engagement queue items with safe fields.",
      "",
      "Options:",
      "  --store <private-store-json>   Load an existing private Application store fixture or export.",
      "  --application-root <root>      Existing owner-private Application root.",
      "  --write                        Write owner-private engagement artifacts outside Git.",
      "  --output-root <root>",
      "  --as-of YYYY-MM-DD",
      "  --json                         With inspect, print full owner-private queue JSON.",
      "",
      "This command operates only on existing Applications and ApplicationEvents.",
      "No email, recruiter message, outreach copy, application submission, browser automation, calendar integration, resume generation, cover letter, /os, /operator, external AI, or Ollama action is available.",
    ].join("\n") + "\n",
  );
}

const args = parseArgs(process.argv.slice(2));

try {
  if (args.command === "queue") {
    commandQueue(args);
  } else if (args.command === "inspect") {
    commandInspect(args);
  } else {
    printHelp();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
