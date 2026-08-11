#!/usr/bin/env node
import { createRequire } from "node:module";
import Module from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));

function registerTypeScript() {
  const ts = requireFromFrontend("typescript");
  const originalTsExtension = Module._extensions[".ts"];
  Module._extensions[".ts"] = function compileTypeScriptModule(mod, filename) {
    const text = readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(text, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    });
    mod._compile(compiled.outputText, filename);
  };
  return () => {
    if (originalTsExtension) {
      Module._extensions[".ts"] = originalTsExtension;
    } else {
      delete Module._extensions[".ts"];
    }
  };
}

const restoreTypeScript = registerTypeScript();
const bridge = requireFromFrontend("./lib/staffordos/jobDescriptionIntakeBridge.ts");
restoreTypeScript();

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      args._.push(value);
      continue;
    }
    const key = value.slice(2);
    if (key === "write" || key === "approve-import") {
      args[key] = true;
      continue;
    }
    args[key] = argv[index + 1];
    index += 1;
  }
  return args;
}

function usage() {
  return `Usage:
  node staffordos/ui/operator-frontend/lib/staffordos/runJobDescriptionIntakeBridge.mjs inspect
  node staffordos/ui/operator-frontend/lib/staffordos/runJobDescriptionIntakeBridge.mjs analyze --text "Company: Example..." [--url https://...] [--approve-import] [--write]
  node staffordos/ui/operator-frontend/lib/staffordos/runJobDescriptionIntakeBridge.mjs analyze --text-file /private/path/job.txt [--url https://...] [--approve-import] [--write]
  node staffordos/ui/operator-frontend/lib/staffordos/runJobDescriptionIntakeBridge.mjs url-only --url https://...

No command applies, submits, messages, generates resumes, or performs browser automation.`;
}

function readText(args) {
  if (args.text) return String(args.text);
  if (args["text-file"]) {
    const filePath = path.resolve(String(args["text-file"]));
    if (!existsSync(filePath)) throw new Error("The supplied text file does not exist.");
    return readFileSync(filePath, "utf8");
  }
  return null;
}

function runAnalyze(args) {
  const generatedAt = args["as-of"] || new Date().toISOString();
  const result = bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    sourceUrl: args.url || null,
    jobDescriptionText: readText(args),
    title: args.title || null,
    company: args.company || null,
    location: args.location || null,
    remoteState: args.remote || null,
    employmentType: args["employment-type"] || null,
    compensationText: args.compensation || null,
    publicationDate: args.published || null,
    requisitionId: args.requisition || null,
    providerName: args.provider || null,
    operatorApprovedForOpportunityImport: Boolean(args["approve-import"]),
    applications: args.applications
      ? bridge.loadJsonArrayFile(path.resolve(String(args.applications)))
      : bridge.loadApplicationComparisonsFromPrivateArtifacts(args["job-search-root"]),
    resumeVersions: args["resume-versions"]
      ? bridge.loadJsonArrayFile(path.resolve(String(args["resume-versions"])))
      : bridge.loadLatestResumeVersionsFromPrivateArtifacts(args["job-search-root"]),
    careerFacts: args["career-facts"] ? bridge.loadJsonArrayFile(path.resolve(String(args["career-facts"]))) : [],
    careerEvidence: args["career-evidence"] ? bridge.loadJsonArrayFile(path.resolve(String(args["career-evidence"]))) : [],
  });
  const writeResult = args.write
    ? bridge.writeJobDescriptionIntakeBridgeOutputs({
        jobSearchRoot: args["job-search-root"],
        repositoryRoot: root,
        result,
        writePipelineOutputs: true,
      })
    : null;
  console.log(JSON.stringify(bridge.buildJobDescriptionIntakeCliSummary(result, writeResult), null, 2));
}

function runInspect(args) {
  const jobSearchRoot = args["job-search-root"];
  const applications = bridge.loadApplicationComparisonsFromPrivateArtifacts(jobSearchRoot);
  const resumeVersions = bridge.loadLatestResumeVersionsFromPrivateArtifacts(jobSearchRoot);
  console.log(JSON.stringify({
    workflowVersion: bridge.JOB_DESCRIPTION_INTAKE_BRIDGE_VERSION,
    supportedModes: ["PASTED_DESCRIPTION", "URL_PLUS_DESCRIPTION", "URL_ONLY_FAIL_CLOSED"],
    applicationsAvailableForDuplicateCheck: applications.length,
    resumeVersionsAvailableForRecommendation: resumeVersions.length,
    urlOnlyRetrieval: "DESCRIPTION_REQUIRED",
    noExternalNetwork: true,
    noApplicationCreated: true,
    noApplicationSubmitted: true,
    noResumeGenerated: true,
    noMessageSent: true,
  }, null, 2));
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0] || "help";

try {
  if (command === "inspect") {
    runInspect(args);
  } else if (command === "analyze") {
    runAnalyze(args);
  } else if (command === "url-only") {
    runAnalyze({ ...args, text: null });
  } else {
    console.log(usage());
    process.exit(command === "help" ? 0 : 1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
