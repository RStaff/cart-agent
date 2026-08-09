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

const discovery = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/jobDiscoveryPrioritization.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultOutputRoot = path.join(homedir(), ".staffordos/private/professional/job-search/opportunity-discovery");

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

function mockAdapter() {
  return discovery.createMockJobDiscoveryProviderAdapter("Synthetic mocked job source", [
    {
      providerName: "Synthetic mocked job source",
      providerRecordId: "mock-ai-automation-001",
      sourceObservedAt: "2026-08-08T12:00:00Z",
      companyName: "Example Automation Systems",
      roleTitle: "AI Automation Program Lead",
      locationText: "Remote",
      workArrangement: "Remote",
      employmentType: "Full Time",
      description: "Synthetic role for AI automation, workflow design, governance controls, and cross-functional delivery.",
      responsibilities: [
        "Coordinate AI automation delivery across business and technical stakeholders.",
        "Maintain governance controls, requirements, and operating cadence.",
      ],
      requirements: [
        "Experience with workflow automation, Python, APIs, and technical program management.",
        "Comfort translating business requirements into user stories and process improvements.",
      ],
      tags: ["AI Automation", "Technical Program Management", "Business Technology"],
      limitations: ["Synthetic mocked provider fixture only."],
      testOnly: true,
    },
    {
      providerName: "Synthetic mocked job source",
      providerRecordId: "mock-martech-001",
      sourceObservedAt: "2026-08-08T12:05:00Z",
      companyName: "Example Lifecycle Systems",
      roleTitle: "Marketing Technology Operations Manager",
      locationText: "Hybrid",
      workArrangement: "Hybrid",
      employmentType: "Full Time",
      description: "Synthetic role for marketing technology, CRM marketing, campaign operations, and analytics.",
      responsibilities: [
        "Run marketing automation operations and campaign reporting.",
        "Improve CRM marketing workflows with business stakeholders.",
      ],
      requirements: [
        "Marketing technology, lifecycle marketing, and analytics experience.",
      ],
      tags: ["Marketing Technology", "RevOps"],
      limitations: ["Synthetic mocked provider fixture only."],
      testOnly: true,
    },
  ]);
}

function runMockPreview(args) {
  const result = discovery.buildJobDiscoveryPrioritizationResult({
    providerAdapters: [mockAdapter()],
    applications: [],
    generatedAt: generatedAt(args),
  });
  let writtenCount = 0;
  if (args.write) {
    writtenCount = discovery.writeJobDiscoveryPrioritizationOutputs({
      outputRoot: args["output-root"] || defaultOutputRoot,
      repositoryRoot,
      result,
    }).length;
  }
  printJson(discovery.buildJobDiscoveryCliSummary(result, writtenCount));
}

function printHelp() {
  process.stdout.write(
    [
      "J002.01 Job Discovery and Prioritization",
      "",
      "Commands:",
      "  mock-preview              Build a synthetic private Opportunity Queue preview.",
      "  mock-preview --write      Write synthetic preview outputs to owner-private storage.",
      "",
      "Options:",
      "  --as-of YYYY-MM-DD",
      "  --output-root <private-output-root>",
      "",
      "No real provider, browser automation, application submission, resume generation, message send, /os, /operator, external AI, or Ollama action is available.",
    ].join("\n") + "\n",
  );
}

const args = parseArgs(process.argv.slice(2));

try {
  if (args.command === "mock-preview") {
    runMockPreview(args);
  } else {
    printHelp();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
