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

const jobSourceImport = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/privateJobSourceImportQueue.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultOutputRoot = path.join(homedir(), ".staffordos/private/professional/job-search/job-source-import");

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

function isInsideRepository(candidatePath) {
  const resolvedCandidate = path.resolve(candidatePath);
  const resolvedRoot = path.resolve(repositoryRoot);
  return resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`);
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function sampleInput(asOf) {
  return {
    accessMode: "OPERATOR_IMPORTED_JSON",
    providerId: "EMPLOYER_CAREER_SITE",
    providerName: "Synthetic employer career site",
    providerType: "EMPLOYER_CAREER_SITE",
    sourceUrl: "https://jobs.example.invalid/synthetic/ai-automation-business-technology",
    observedAt: asOf,
    publicationDate: null,
    title: "AI Automation Business Technology Lead",
    company: "Example Systems",
    location: "Remote",
    remoteState: "Remote",
    employmentType: "Full Time",
    descriptionText:
      "Synthetic role for AI automation, business technology, workflow automation, integrations, requirements, and technical program delivery.",
    requisitionId: "SYN-J002-02",
    limitations: ["Synthetic CLI fixture only; no provider call occurred."],
  };
}

function inputFromArgs(args) {
  const asOf = generatedAt(args);
  if (args.sample || ["queue", "prioritize", "review"].includes(args.command)) {
    return [sampleInput(asOf)];
  }
  if (args.command === "import-json") {
    if (typeof args.input !== "string") {
      return [sampleInput(asOf)];
    }
    if (isInsideRepository(args.input)) {
      throw new Error("Private imported job JSON must be outside the repository.");
    }
    return [jobSourceImport.readImportedJsonInput(args.input)];
  }
  if (args.command === "import-url") {
    return [
      {
        accessMode: "OPERATOR_PASTED_URL",
        providerId: args.provider || "EMPLOYER_CAREER_SITE",
        providerName: args["provider-name"] || "Operator pasted URL",
        providerType: "EMPLOYER_CAREER_SITE",
        sourceUrl: args.url || null,
        observedAt: asOf,
        publicationDate: args.published || null,
        title: args.title || null,
        company: args.company || null,
        location: args.location || null,
        remoteState: args.remote || null,
        employmentType: args.employment || null,
        descriptionText: args.summary || null,
        requisitionId: args.requisition || null,
        limitations: ["URL was supplied by Ross; StaffordOS did not fetch it."],
      },
    ];
  }
  if (args.command === "import-text") {
    return [
      {
        accessMode: "OPERATOR_PASTED_TEXT",
        providerId: args.provider || "OPERATOR_PASTED_TEXT",
        providerName: args["provider-name"] || "Operator pasted text",
        providerType: "OTHER",
        sourceUrl: args.url || null,
        sourceText: args.text || args.summary || null,
        observedAt: asOf,
        publicationDate: args.published || null,
        title: args.title || null,
        company: args.company || null,
        location: args.location || null,
        remoteState: args.remote || null,
        employmentType: args.employment || null,
        compensationText: args.compensation || null,
        descriptionText: args.text || args.summary || null,
        requisitionId: args.requisition || null,
        limitations: ["Text was supplied by Ross; no provider call occurred."],
      },
    ];
  }
  return [];
}

function buildAndPrint(args) {
  const result = jobSourceImport.buildPrivateJobSourceImportQueue({
    inputs: inputFromArgs(args),
    applications: [],
    generatedAt: generatedAt(args),
  });
  let writtenCount = 0;
  if (args.write) {
    writtenCount = jobSourceImport.writePrivateJobSourceImportQueueOutputs({
      outputRoot: args["output-root"] || defaultOutputRoot,
      repositoryRoot,
      result,
    }).length;
  }
  printJson(jobSourceImport.buildJobSourceImportCliSummary(result, writtenCount));
}

function printInspect() {
  printJson({
    workflowVersion: jobSourceImport.PRIVATE_JOB_SOURCE_IMPORT_QUEUE_VERSION,
    targetSearchLanes: {
      primary: jobSourceImport.PRIMARY_SEARCH_LANE,
      secondaryBridge: jobSourceImport.SECONDARY_SEARCH_LANE,
      excludedByDefault: jobSourceImport.EXCLUDED_DEFAULT_ROLE_LANE,
    },
    supportedAccessModes: [
      "OPERATOR_PASTED_URL",
      "OPERATOR_PASTED_TEXT",
      "OPERATOR_IMPORTED_JSON",
    ],
    providerCapabilityMatrix: jobSourceImport.JOB_SOURCE_PROVIDER_CAPABILITY_MATRIX,
    noApplicationSubmission: true,
    noResumeGeneration: true,
    noMessageSend: true,
    noProviderLogin: true,
    noBrowserAutomation: true,
    noExternalAi: true,
  });
}

function printHelp() {
  process.stdout.write(
    [
      "J002.02 Private Job Source Import Queue",
      "",
      "Commands:",
      "  inspect                         Show read-only adapter capabilities.",
      "  import-url --url <url>          Normalize an operator-supplied job URL without fetching it.",
      "  import-text --text <text>       Normalize operator-pasted job text.",
      "  import-json --input <file>      Normalize owner-private imported JSON outside the repository.",
      "  queue --sample                  Build a synthetic queue preview.",
      "  review --sample                 Build a synthetic operator-review preview.",
      "  prioritize --sample             Build a synthetic prioritized queue preview.",
      "",
      "Options:",
      "  --title <role>",
      "  --company <company>",
      "  --published <date>",
      "  --location <text>",
      "  --remote <state>",
      "  --employment <type>",
      "  --requisition <id>",
      "  --write",
      "  --as-of YYYY-MM-DD",
      "  --output-root <private-output-root>",
      "",
      "No provider login, browser automation, application submission, resume generation, message send, /os, /operator, external AI, or Ollama action is available.",
    ].join("\n") + "\n",
  );
}

const args = parseArgs(process.argv.slice(2));

try {
  if (args.command === "inspect") {
    printInspect();
  } else if (["import-url", "import-text", "import-json", "queue", "review", "prioritize"].includes(args.command)) {
    buildAndPrint(args);
  } else {
    printHelp();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
