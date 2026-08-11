import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobDescriptionIntakeBridge.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runJobDescriptionIntakeBridge.mjs");
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

const bridge = requireTypeScriptModule(modulePath);
const generatedAt = "2026-08-11T12:00:00Z";

function syntheticDescription(overrides = {}) {
  return [
    `Company: ${overrides.company || "Example Systems"}`,
    `Role: ${overrides.title || "AI Automation Business Technology Lead"}`,
    "Location: Remote, United States",
    "Employment Type: Full Time",
    "Compensation: $120,000 - $150,000",
    "Job ID: SYN-V1-01",
    "",
    "Lead AI automation, business technology, workflow automation, requirements gathering, APIs, SQL, dashboards, stakeholder communication, and product delivery.",
  ].join("\n");
}

function application(overrides = {}) {
  return {
    applicationId: overrides.applicationId || "synthetic_application_existing",
    opportunityId: null,
    companyReference: {
      label: overrides.company || "Example Systems",
      requisitionAlias: overrides.requisitionAlias || "SYN-V1-01",
    },
    roleReference: {
      title: overrides.title || "AI Automation Business Technology Lead",
    },
    status: "SUBMITTED_MANUAL_EXTERNAL",
    currentStage: "SUBMITTED_MANUAL_EXTERNAL",
  };
}

function resumeVersion(overrides = {}) {
  return {
    resumeVersionId: overrides.resumeVersionId || "resume_version_synthetic_ai_automation",
    safeLabel: overrides.safeLabel || "Synthetic AI Automation Resume",
    purpose: "ROLE_TARGETED_RESUME",
    documentFormat: "PDF",
    factSafetyStatus: overrides.factSafetyStatus || "SUPPORTED_TRANSFERABLE",
    reviewStatus: overrides.reviewStatus || "OPERATOR_REVIEWED",
    limitations: ["Synthetic fixture only."],
  };
}

test("pasted description intake normalizes labeled fields without creating an Opportunity", () => {
  const result = bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    jobDescriptionText: syntheticDescription(),
    operatorApprovedForOpportunityImport: true,
  });

  assert.equal(result.intakeMode, "PASTED_DESCRIPTION");
  assert.equal(result.state, "NEEDS_OPERATOR_REVIEW");
  assert.equal(result.normalizedSourceRecord.company, "Example Systems");
  assert.equal(result.normalizedSourceRecord.title, "AI Automation Business Technology Lead");
  assert.equal(result.normalizedOpportunity, null);
  assert.equal(result.readModel.rawDescriptionVisible, false);
  assert.equal(result.readModel.applicationCreated, false);
  assert.equal(result.readModel.resumeGenerated, false);
});

test("URL plus description traverses import, Explainable Fit, and recommendation when approved", () => {
  const result = bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    sourceUrl: "https://jobs.example.invalid/ai-automation-lead",
    jobDescriptionText: syntheticDescription(),
    operatorApprovedForOpportunityImport: true,
    resumeVersions: [resumeVersion()],
    careerFacts: [
      {
        id: "career_fact_synthetic_ai",
        title: "AI automation and business technology delivery",
        summary: "Synthetic evidence-backed support for AI automation, APIs, SQL, stakeholder communication, and product delivery.",
        tags: ["ai automation", "business technology", "apis", "sql", "product"],
      },
    ],
    careerEvidence: [
      {
        id: "career_evidence_synthetic_ai",
        title: "Synthetic AI automation evidence",
        summary: "Synthetic private fixture proving the mapping path only.",
        tags: ["ai automation", "apis", "sql"],
      },
    ],
  });

  assert.equal(result.intakeMode, "URL_PLUS_DESCRIPTION");
  assert.equal(result.state, "IMPORTED_FOR_ANALYSIS");
  assert.equal(result.queueItem.state, "READY_FOR_OPPORTUNITY_IMPORT");
  assert.ok(result.normalizedOpportunity.id.startsWith("privjobopp_"));
  assert.ok(result.analysisBundle.requirements.length > 0);
  assert.equal(result.recommendationResult.recommendations.length, 1);
  assert.equal(result.recommendationResult.auditSummary.noApplicationSubmitted, true);
  assert.equal(result.recommendationResult.auditSummary.noResumeGenerated, true);
  assert.equal(result.readModel.externalProviderCall, false);
  assert.equal(result.readModel.browserAutomationUsed, false);
});

test("URL-only intake fails closed with DESCRIPTION_REQUIRED and no retrieval", () => {
  const result = bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    sourceUrl: "https://jobs.example.invalid/needs-description",
  });

  assert.equal(result.intakeMode, "URL_ONLY");
  assert.equal(result.state, "DESCRIPTION_REQUIRED");
  assert.equal(result.httpRetrieval.attempted, false);
  assert.equal(result.queueResult, null);
  assert.equal(result.recommendationResult, null);
});

test("malformed and unsupported URLs do not enter normalization", () => {
  const malformed = bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    sourceUrl: "not a url",
    jobDescriptionText: syntheticDescription(),
  });
  const unsupported = bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    sourceUrl: "http://jobs.example.invalid/role",
    jobDescriptionText: syntheticDescription(),
  });

  assert.equal(malformed.state, "MALFORMED_URL");
  assert.equal(unsupported.state, "UNSUPPORTED_URL_SCHEME");
  assert.equal(malformed.queueResult, null);
  assert.equal(unsupported.queueResult, null);
});

test("missing company or role remains review-required instead of guessed", () => {
  const result = bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    sourceUrl: "https://jobs.example.invalid/unlabeled",
    jobDescriptionText: "Lead AI automation and business technology work across APIs and stakeholder workflows.",
    operatorApprovedForOpportunityImport: true,
  });

  assert.equal(result.normalizedSourceRecord.company, "UNKNOWN");
  assert.equal(result.normalizedSourceRecord.title, "UNKNOWN");
  assert.equal(result.queueItem.state, "NEEDS_OPERATOR_REVIEW");
  assert.equal(result.normalizedOpportunity, null);
});

test("source provenance and digests are preserved without exposing raw description in the read model", () => {
  const result = bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    sourceUrl: "https://jobs.example.invalid/provenance",
    jobDescriptionText: syntheticDescription(),
  });

  assert.ok(result.normalizedSourceRecord.sourceDigest.startsWith("sha256:"));
  assert.ok(result.normalizedSourceRecord.descriptionDigest.startsWith("sha256:"));
  assert.equal(result.queueResult.sourceSnapshots.length, 1);
  assert.equal(result.queueResult.sourceSnapshots[0].contentDigest, result.normalizedSourceRecord.sourceDigest);
  assert.equal(result.readModel.sourceDigestPrefix, result.normalizedSourceRecord.sourceDigest.slice(0, 19));
  assert.equal(result.readModel.rawDescriptionVisible, false);
  assert.equal(result.readModel.privatePathVisible, false);
});

test("existing Application prevention blocks duplicate apply recommendations", () => {
  const result = bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    sourceUrl: "https://jobs.example.invalid/already-applied",
    jobDescriptionText: syntheticDescription(),
    applications: [application()],
    operatorApprovedForOpportunityImport: true,
  });

  assert.equal(result.queueItem.state, "EXISTING_APPLICATION");
  assert.equal(result.readModel.existingApplicationStatus, "EXISTING_APPLICATION_MATCH");
  assert.equal(result.normalizedOpportunity, null);
  assert.equal(result.recommendationResult.recommendations[0].recommendation, "SKIP");
});

test("duplicate detection integration marks exact duplicate source inputs", () => {
  const duplicate = {
    accessMode: "OPERATOR_PASTED_URL",
    providerId: "EMPLOYER_CAREER_SITE",
    providerName: "jobs.example.invalid",
    providerType: "EMPLOYER_CAREER_SITE",
    sourceUrl: "https://jobs.example.invalid/duplicate",
    observedAt: generatedAt,
    providerJobId: null,
    title: "AI Automation Business Technology Lead",
    company: "Example Systems",
    location: "Remote, United States",
    remoteState: "Remote, United States",
    employmentType: "Full Time",
    compensationText: "$120,000 - $150,000",
    descriptionText: syntheticDescription(),
    requisitionId: "SYN-V1-01-ALT",
    sourceAuthority: "OPERATOR_SUPPLIED_READ_ONLY",
    limitations: ["Synthetic duplicate comparison input."],
  };
  const result = bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    sourceUrl: "https://jobs.example.invalid/duplicate",
    jobDescriptionText: syntheticDescription(),
    comparisonSourceInputs: [duplicate],
  });

  assert.equal(result.queueItem.state, "DUPLICATE");
  assert.equal(result.queueItem.duplicateResult, "CONFIRMED_DUPLICATE");
  assert.equal(result.normalizedOpportunity, null);
});

test("private writes stay outside the repository and use private permissions", () => {
  const outputRoot = mkdtempSync(path.join(tmpdir(), "careeros-v101-"));
  const result = bridge.buildJobDescriptionIntakeBridge({
    generatedAt,
    sourceUrl: "https://jobs.example.invalid/write-proof",
    jobDescriptionText: syntheticDescription(),
    operatorApprovedForOpportunityImport: true,
  });
  const writeResult = bridge.writeJobDescriptionIntakeBridgeOutputs({
    jobSearchRoot: outputRoot,
    repositoryRoot: root,
    result,
    writePipelineOutputs: true,
  });

  assert.equal(writeResult.privatePathVisible, false);
  assert.ok(writeResult.writtenFiles.length > 0);
  assert.ok(writeResult.pipelineWrittenFiles.length > 0);
  const dirMode = statSync(writeResult.runDirectory).mode & 0o777;
  const fileMode = statSync(writeResult.writtenFiles[0]).mode & 0o777;
  assert.equal(dirMode, 0o700);
  assert.equal(fileMode, 0o600);
  assert.equal(writeResult.writtenFiles.some((filePath) => filePath.startsWith(root)), false);
});

test("CLI exposes inspect and analyze commands without external-action verbs", () => {
  assert.match(cliSource, /inspect/);
  assert.match(cliSource, /analyze/);
  assert.match(cliSource, /url-only/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /\bapply\s*\(/);
  assert.doesNotMatch(source, /\bsubmit\s*\(/);
  assert.doesNotMatch(source, /\bsend(Message|Email)?\s*\(/);
  assert.doesNotMatch(source, /\bcreateApplication\s*\(/);
  assert.doesNotMatch(source, /\bgenerateResume\s*\(/);
});
