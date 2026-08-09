import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobDiscoveryPrioritization.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runJobDiscoveryPrioritization.mjs");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const source = readFileSync(modulePath, "utf8");
const cliSource = readFileSync(cliPath, "utf8");

function requireTypeScriptModule(targetPath) {
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

  try {
    return requireFromFrontend(targetPath);
  } finally {
    if (originalTsExtension) {
      Module._extensions[".ts"] = originalTsExtension;
    } else {
      delete Module._extensions[".ts"];
    }
  }
}

const discovery = requireTypeScriptModule(modulePath);

function opportunity(overrides = {}) {
  return {
    providerName: "Synthetic mocked job source",
    providerRecordId: overrides.providerRecordId ?? "synthetic-provider-001",
    sourceUrl: overrides.sourceUrl ?? "https://jobs.example.invalid/synthetic/opportunity-001",
    sourceObservedAt: overrides.sourceObservedAt ?? "2026-08-08T12:00:00Z",
    publishedAt: null,
    companyName: overrides.companyName || "Example Automation Systems",
    roleTitle: overrides.roleTitle || "AI Automation Program Lead",
    requisitionAlias: overrides.requisitionAlias ?? null,
    locationText: "Remote",
    workArrangement: "Remote",
    employmentType: "Full Time",
    description:
      overrides.description ||
      "Synthetic role for AI automation, governance controls, business technology, workflow automation, and process improvement.",
    responsibilities: overrides.responsibilities || [
      "Coordinate workflow automation delivery across technical and business stakeholders.",
      "Translate requirements into user stories, process maps, and delivery milestones.",
    ],
    requirements: overrides.requirements || [
      "Python, APIs, technical program management, and business systems analysis.",
    ],
    tags: overrides.tags || ["AI Automation", "Business Technology", "Technical Program Management"],
    limitations: ["Synthetic fixture only."],
    testOnly: true,
  };
}

function adapter(records) {
  return discovery.createMockJobDiscoveryProviderAdapter("Synthetic mocked job source", records);
}

function application(overrides = {}) {
  return {
    applicationId: overrides.applicationId || "synthetic_application_001",
    opportunityId: overrides.opportunityId ?? null,
    companyReference: {
      label: overrides.companyName || "Example Automation Systems",
      requisitionAlias: overrides.requisitionAlias ?? null,
    },
    roleReference: {
      title: overrides.roleTitle || "AI Automation Program Lead",
    },
    status: "SUBMITTED_MANUAL_EXTERNAL",
    currentStage: "SUBMITTED_MANUAL_EXTERNAL",
    submittedAt: "2026-08-08",
    submittedAtPrecision: "DATE",
    employerResponseStatus: "NONE_RECORDED",
    submittedByStaffordOS: false,
    applicationSubmittedByThisWorkflow: false,
    noEmployerInterestInferred: true,
    noFitInferred: true,
  };
}

function build(records, applications = []) {
  return discovery.buildJobDiscoveryPrioritizationResult({
    providerAdapters: [adapter(records)],
    applications,
    generatedAt: "2026-08-08T12:00:00Z",
  });
}

function serialize(value) {
  return JSON.stringify(value);
}

test("priority weights match the J002.01 mission", () => {
  assert.deepEqual(discovery.JOB_DISCOVERY_PRIORITY_WEIGHTS, {
    aiAutomation: 45,
    businessTechnology: 25,
    productTpm: 15,
    marketingTechnology: 15,
  });
});

test("mock provider adapters import opportunities without external providers", () => {
  const result = build([opportunity()]);

  assert.equal(result.sourceAuthority.mockedProviderAdaptersOnly, true);
  assert.equal(result.sourceAuthority.externalProviderCalls, 0);
  assert.equal(result.sourceAuthority.browserAutomationUsed, false);
  assert.equal(result.sourceAuthority.entireInternetSearched, false);
  assert.equal(result.opportunities.length, 1);
});

test("Opportunity remains separate from Application", () => {
  const result = build([opportunity()]);
  const record = result.opportunities[0];

  assert.equal(record.workspaceId, "professional");
  assert.equal(record.capabilityFamily, "Career Operations");
  assert.equal(record.noApplicationCreated, true);
  assert.equal(record.noApplicationSubmitted, true);
  assert.equal(record.applicationComparison.status, "NO_APPLICATION_MATCH");
  assert.equal(Object.hasOwn(record, "submittedAt"), false);
});

test("ranking is deterministic and explanation-based", () => {
  const input = [opportunity()];
  const first = build(input);
  const second = build(input);

  assert.deepEqual(first.priorityQueue, second.priorityQueue);
  assert.equal(first.opportunities[0].ranking.deterministicRulesOnly, true);
  assert.equal(first.opportunities[0].ranking.externalAiUsed, false);
  assert.ok(first.opportunities[0].ranking.explanation.whyRecommended.length > 0);
});

test("AI and automation weighting can outrank marketing-only roles", () => {
  const ai = opportunity({
    providerRecordId: "synthetic-ai-001",
    sourceUrl: "https://jobs.example.invalid/synthetic/ai",
    roleTitle: "AI Automation Program Lead",
  });
  const marketing = opportunity({
    providerRecordId: "synthetic-martech-001",
    sourceUrl: "https://jobs.example.invalid/synthetic/martech",
    companyName: "Example Lifecycle Systems",
    roleTitle: "Marketing Technology Operations Manager",
    description: "Synthetic role for marketing technology, lifecycle marketing, campaign operations, and CRM marketing.",
    responsibilities: ["Operate marketing automation and campaign reporting."],
    requirements: ["Marketing technology, lifecycle marketing, and analytics."],
    tags: ["Marketing Technology"],
  });
  const result = build([marketing, ai]);

  assert.equal(result.priorityQueue[0].role, "AI Automation Program Lead");
  assert.ok(result.opportunities.find((item) => item.roleReference.title === "AI Automation Program Lead").ranking.totalScore > result.opportunities.find((item) => item.roleReference.title === "Marketing Technology Operations Manager").ranking.totalScore);
});

test("business technology, Product/TPM, and Marketing Technology components are represented", () => {
  const result = build([
    opportunity({
      roleTitle: "Business Technology Product Manager",
      description: "Synthetic role for business technology, enterprise applications, product roadmap, backlog, and marketing technology integrations.",
      responsibilities: ["Manage roadmap, user stories, CRM marketing integrations, and business applications."],
      requirements: ["Business systems analysis, product management, and marketing technology."],
    }),
  ]);
  const components = result.opportunities[0].ranking.components;

  assert.ok(components.find((component) => component.componentId === "businessTechnology").weightedScore > 0);
  assert.ok(components.find((component) => component.componentId === "productTpm").weightedScore > 0);
  assert.ok(components.find((component) => component.componentId === "marketingTechnology").weightedScore > 0);
});

test("exact provider duplicates are detected without silent merge", () => {
  const result = build([
    opportunity({ providerRecordId: "same-provider-id", sourceUrl: "https://jobs.example.invalid/synthetic/a" }),
    opportunity({
      providerRecordId: "same-provider-id",
      sourceUrl: "https://jobs.example.invalid/synthetic/b",
      roleTitle: "Program Lead, AI Automation",
    }),
  ]);

  assert.equal(result.duplicateReview.length, 1);
  assert.equal(result.duplicateReview[0].classification, "SAME_PROVIDER_RECORD");
  assert.equal(result.duplicateReview[0].silentlyMerged, false);
  assert.equal(result.opportunities.every((item) => item.duplicateGroupId), true);
});

test("exact source digest duplicates are detected", () => {
  const first = opportunity({ providerRecordId: "digest-a", sourceUrl: "https://jobs.example.invalid/synthetic/digest-a" });
  const second = { ...first, providerRecordId: "digest-b", sourceUrl: "https://jobs.example.invalid/synthetic/digest-b" };
  const result = build([first, second]);

  assert.equal(result.duplicateReview.some((record) => record.classification === "EXACT_SOURCE_DUPLICATE"), true);
});

test("existing Application match blocks duplicate application recommendation", () => {
  const result = build([opportunity()], [application()]);

  assert.equal(result.opportunities[0].applicationComparison.status, "EXISTING_APPLICATION_MATCH");
  assert.equal(result.opportunities[0].recommendedAction, "DO_NOT_APPLY_DUPLICATE");
  assert.equal(result.opportunities[0].priorityTier, "BLOCKED_DUPLICATE_APPLICATION");
  assert.equal(result.priorityQueue.length, 0);
  assert.equal(result.summary.duplicateApplicationsPrevented, 1);
});

test("possible Application duplicate requires review rather than application", () => {
  const result = build(
    [opportunity({ roleTitle: "Senior AI Automation Lead" })],
    [application({ roleTitle: "AI Automation Lead" })],
  );

  assert.equal(result.opportunities[0].applicationComparison.status, "POSSIBLE_APPLICATION_DUPLICATE");
  assert.equal(result.opportunities[0].recommendedAction, "REVIEW_DUPLICATE_BEFORE_APPLICATION");
});

test("ranking does not infer employer interest or success probability", () => {
  const result = build([opportunity()]);
  const ranking = result.opportunities[0].ranking;

  assert.equal(ranking.successProbabilityGenerated, false);
  assert.equal(ranking.interviewProbabilityGenerated, false);
  assert.equal(ranking.employerInterestInferred, false);
  assert.equal(result.summary.successProbabilityGenerated, false);
});

test("read model hides private paths, source text, URLs, and action controls", () => {
  const result = build([opportunity()]);
  const readModel = result.readModel[0];
  const text = serialize(result.readModel);

  assert.equal(readModel.privatePathVisible, false);
  assert.equal(readModel.sourceTextVisible, false);
  assert.equal(readModel.sourceUrlVisible, false);
  assert.equal(readModel.applicationActionAvailable, false);
  assert.equal(readModel.messageActionAvailable, false);
  assert.equal(readModel.connectedToOs, false);
  assert.equal(readModel.connectedToOperator, false);
  assert.doesNotMatch(text, /\/Users\//);
  assert.doesNotMatch(text, /\.staffordos/);
  assert.doesNotMatch(text, /https:\/\/jobs\.example\.invalid/);
});

test("private output writer rejects repository paths", () => {
  const result = build([opportunity()]);

  assert.throws(
    () =>
      discovery.writeJobDiscoveryPrioritizationOutputs({
        outputRoot: path.join(root, "staffordos/job-search"),
        repositoryRoot: root,
        result,
      }),
    /outside the repository/,
  );
});

test("source and CLI contain no submission, resume generation, messaging, external provider, AI, or private UI connection path", () => {
  const implementation = `${source}\n${cliSource}`;

  assert.doesNotMatch(implementation, /fetch\(|XMLHttpRequest|http\.request|https\.request|puppeteer|playwright/i);
  assert.doesNotMatch(implementation, /openai\.|anthropic\.|gemini\.|modelAdapter|runOllama|localhost:11434/i);
  assert.doesNotMatch(implementation, /submitApplication|sendApplication|generateResume|mutateResume|generateCoverLetter|sendRecruiter|sendMessage|mailto:/i);
  assert.doesNotMatch(implementation, /from\s+["'].*\/os|from\s+["'].*\/operator|app\/os|app\/operator/);
});

test("CLI summary is redacted and reports no external action", () => {
  const result = build([opportunity()]);
  const summary = discovery.buildJobDiscoveryCliSummary(result, 0);
  const text = serialize(summary);

  assert.equal(summary.noApplicationSubmitted, true);
  assert.equal(summary.noResumeGenerated, true);
  assert.equal(summary.noRecruiterMessageSent, true);
  assert.equal(summary.noExternalAi, true);
  assert.equal(summary.noOllama, true);
  assert.equal(summary.noOsConnection, true);
  assert.equal(summary.noOperatorConnection, true);
  assert.doesNotMatch(text, /\/Users\//);
  assert.doesNotMatch(text, /\.staffordos/);
});
