import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/opportunityRecommendationEngine.ts");
const queueModulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateJobSourceImportQueue.ts");
const fitModulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobFitAssessment.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runOpportunityRecommendationEngine.mjs");
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

const recommendations = requireTypeScriptModule(modulePath);
const queueBuilder = requireTypeScriptModule(queueModulePath);
const fit = requireTypeScriptModule(fitModulePath);

const generatedAt = "2026-08-09T12:00:00Z";

function sourceInput(overrides = {}) {
  return {
    accessMode: "OPERATOR_IMPORTED_JSON",
    providerId: "EMPLOYER_CAREER_SITE",
    providerName: "Synthetic employer career site",
    providerType: "EMPLOYER_CAREER_SITE",
    sourceUrl: overrides.sourceUrl || "https://jobs.example.invalid/synthetic/ai-platform-product",
    observedAt: generatedAt,
    publicationDate: "2026-08-08T12:00:00Z",
    providerJobId: overrides.providerJobId || "synthetic-job-001",
    title: overrides.title || "AI Automation Platform Product Manager",
    company: overrides.company || "Example Systems",
    location: overrides.location || "Remote, United States",
    remoteState: "Remote",
    employmentType: "Full Time",
    compensationText: null,
    descriptionText:
      overrides.descriptionText ||
      "Lead AI automation, platform workflow, requirements gathering, APIs, user stories, stakeholder communication, and product roadmap delivery.",
    requisitionId: overrides.requisitionId || "SYN-J003-001",
    limitations: ["Synthetic fixture only."],
  };
}

function application(overrides = {}) {
  return {
    applicationId: overrides.applicationId || "synthetic_application_existing",
    opportunityId: null,
    companyReference: {
      label: overrides.company || "Example Systems",
      requisitionAlias: overrides.requisitionAlias || "SYN-J003-001",
    },
    roleReference: {
      title: overrides.title || "AI Automation Platform Product Manager",
    },
    status: "SUBMITTED_MANUAL_EXTERNAL",
    currentStage: "SUBMITTED_MANUAL_EXTERNAL",
    submittedAt: "2026-08-08",
    employerResponseStatus: "NONE_RECORDED",
    submittedByStaffordOS: false,
    applicationSubmittedByThisWorkflow: false,
    noEmployerInterestInferred: true,
    noFitInferred: true,
  };
}

function buildQueue(inputs, applications = []) {
  return queueBuilder.buildPrivateJobSourceImportQueue({
    inputs,
    applications,
    generatedAt,
  });
}

function requirement(id, text, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_requirement.v1",
    id,
    workspaceId: "professional",
    jobOpportunityId: overrides.opportunityId || "synthetic_opportunity",
    sourceId: overrides.sourceId || "synthetic_source",
    requirementText: text,
    normalizedRequirement: text.toLowerCase(),
    requirementCategory: overrides.category || "Required skill",
    requirementLevel: overrides.level || "REQUIRED",
    importanceClassification: overrides.importance || "Required",
    evidenceExpectation: "Existing CareerOS evidence should support this requirement before applying.",
    yearsMentioned: null,
    degreeMentioned: null,
    certificationMentioned: null,
    technologyOrSkill: overrides.skill || null,
    responsibilityOrQualification: text,
    sourceAuthority: "SOURCE_EXPLICIT",
    sourceLocation: {
      sourceField: "listingText",
      lineNumber: null,
      sectionHint: "requirements",
    },
    sourceExcerptReference: "synthetic private fixture",
    extractionMethod: "DETERMINISTIC_EXTRACTION",
    extractionConfidence: "High",
    operatorReviewStatus: "Operator confirmed",
    ambiguity: null,
    limitations: ["Synthetic fixture only."],
    createdAt: generatedAt,
    privateRecord: true,
    testOnly: false,
  };
}

function mapping(requirementRecord, classification, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_requirement_evidence_mapping.v1",
    id: `mapping_${requirementRecord.id}_${classification.toLowerCase()}`,
    requirementId: requirementRecord.id,
    jobOpportunityId: requirementRecord.jobOpportunityId,
    careerFactIds: overrides.careerFactIds || [],
    careerEvidenceIds: overrides.careerEvidenceIds || [],
    classification,
    explanation: overrides.explanation || `${classification} synthetic mapping.`,
    supportLimitations: overrides.supportLimitations || ["Synthetic fixture only."],
    verificationStatus: classification === "PROVEN" ? "VERIFIED" : "UNKNOWN",
    conflictStatus: "NO_CONFLICT",
    operatorReviewRequirement: classification === "PROVEN" ? "No additional review required for this fixture." : "Review required.",
    safePositioning: overrides.safePositioning || "Position only with existing CareerOS evidence.",
    prohibitedOverstatement: [],
    matchedSignals: overrides.matchedSignals || [],
    createdAt: generatedAt,
    privateRecord: true,
    testOnly: false,
  };
}

function fitArtifact(queueItem, options = {}) {
  const requirements =
    options.requirements ||
    [
      requirement("req_ai_automation", "AI automation platform product delivery", {
        opportunityId: queueItem.normalizedOpportunityCandidateId || queueItem.queueItemId,
        sourceId: queueItem.sourceRecordId,
        skill: "AI automation",
      }),
    ];
  const mappings =
    options.mappings ||
    [
      mapping(requirements[0], "PROVEN", {
        careerFactIds: ["career_fact_ai_workflow"],
        careerEvidenceIds: ["career_evidence_platform_workflow"],
        matchedSignals: ["ai", "automation", "platform"],
      }),
    ];
  const applicationEvent = {
    schemaVersion: "staffordos.job_search.private_application_event.v1",
    opportunityId: queueItem.normalizedOpportunityCandidateId || queueItem.queueItemId,
    applicationState: "NOT_APPLIED",
    submissionChannel: "NOT_APPLICABLE",
    submittedBy: "Unknown",
    submittedAt: null,
    resumeFilenameUsed: null,
    coverLetterStatus: "UNKNOWN",
    operatorAuthority: "NEEDS_OPERATOR_CONFIRMATION",
    currentEmployerResponse: "UNKNOWN",
    nextFollowUpReviewDate: null,
    limitations: ["Synthetic fixture only."],
    submittedByStaffordOS: false,
  };
  const fitAssessment = fit.buildPrivateJobFitAssessment({
    opportunityId: queueItem.normalizedOpportunityCandidateId || queueItem.queueItemId,
    requirements,
    mappings,
    applicationEvent,
    createdAt: generatedAt,
  });
  return {
    queueItemId: queueItem.queueItemId,
    sourceRecordId: queueItem.sourceRecordId,
    opportunityId: queueItem.normalizedOpportunityCandidateId || queueItem.queueItemId,
    fitAssessment,
    requirements,
    mappings,
    limitations: ["Synthetic Explainable Fit artifact."],
  };
}

function resumeVersion(overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_resume_version.v1",
    resumeVersionId: overrides.resumeVersionId || "privresumeversion_synthetic_ai_platform",
    workspaceId: "professional",
    assetReferenceId: "asset_synthetic_resume",
    sourceDocumentReference: {
      privateSourceId: "source_synthetic_resume",
      sourceRootAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT",
      sourcePath: "/private/redacted/not/printed",
      sourcePathRedacted: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT/REDACTED",
    },
    originalFilename: overrides.originalFilename || "Synthetic_Resume.pdf",
    contentDigest: overrides.contentDigest || "sha256:syntheticdigest001",
    documentFormat: overrides.documentFormat || "PDF",
    observedAt: "2026-08-08T12:00:00Z",
    createdAt: null,
    modifiedAtObserved: "2026-08-08T12:00:00Z",
    purpose: overrides.purpose || "ROLE_TARGETED_RESUME",
    targetRoleFamily: overrides.targetRoleFamily || "AI Automation Platform Product",
    targetCompanyReference: overrides.targetCompanyReference || null,
    targetRoleReference: overrides.targetRoleReference || "AI Automation Platform Product Manager",
    sourceAuthority: "PRIVATE_CAREER_SOURCE_DOCUMENT",
    privacy: "Professional owner-private",
    reviewStatus: overrides.reviewStatus || "OPERATOR_CONFIRMED",
    factSafetyStatus: overrides.factSafetyStatus || "SUPPORTED_VERIFIED",
    supersedesResumeVersionId: null,
    derivedFromResumeVersionId: null,
    claimSafety: [],
    limitations: ["Synthetic fixture only."],
    resumeIsCareerTruth: false,
  };
}

function buildRecommendation(inputs = [sourceInput()], options = {}) {
  const queue = buildQueue(inputs, options.applications || []);
  const artifacts = options.fitArtifacts || queue.importQueue.map((item) => fitArtifact(item));
  return {
    queue,
    result: recommendations.buildOpportunityRecommendationEngine({
      generatedAt,
      queueResult: queue,
      explainableFitArtifacts: artifacts,
      resumeVersions: options.resumeVersions || [resumeVersion()],
    }),
  };
}

function serialize(value) {
  return JSON.stringify(value);
}

test("every ranked queue item receives a deterministic recommendation", () => {
  const { result } = buildRecommendation([
    sourceInput({ providerJobId: "one", sourceUrl: "https://jobs.example.invalid/one", title: "AI Automation Platform Product Manager" }),
    sourceInput({ providerJobId: "two", sourceUrl: "https://jobs.example.invalid/two", title: "Business Technology AI Program Manager" }),
  ]);

  assert.equal(result.workflowVersion, "J003.01");
  assert.equal(result.summary.queueItemsReviewed, 2);
  assert.equal(result.recommendations.length, 2);
  assert.equal(result.recommendations.every((record) => record.deterministicRulesOnly), true);
  assert.equal(result.summary.hiringProbabilityGenerated, false);
  assert.equal(result.summary.interviewProbabilityGenerated, false);
  assert.equal(result.summary.aiConfidenceScoreGenerated, false);
});

test("high-priority clean opportunity can become APPLY_NOW with an existing safe ResumeVersion", () => {
  const { result } = buildRecommendation();
  const record = result.recommendations[0];

  assert.equal(record.recommendation, "APPLY_NOW");
  assert.equal(record.applicationReadiness, "READY_FOR_OPERATOR_APPROVED_APPLICATION");
  assert.equal(record.recommendedResumeVersion.status, "SELECTED_EXISTING_RESUMEVERSION");
  assert.equal(record.recommendedResumeVersion.resumeGenerated, false);
  assert.equal(record.applicationSubmitted, false);
  assert.equal(record.explainableFit.fitRecommendation, "APPLY_WITH_POSITIONING");
  assert.ok(record.supportingCareerEvidence[0].careerEvidenceIds.includes("career_evidence_platform_workflow"));
});

test("missing evidence produces REVIEW and explicit gap analysis", () => {
  const queue = buildQueue([sourceInput()]);
  const item = queue.importQueue[0];
  const req = requirement("req_missing_sql", "SQL analytics automation experience", {
    opportunityId: item.normalizedOpportunityCandidateId || item.queueItemId,
    sourceId: item.sourceRecordId,
    skill: "SQL",
  });
  const artifact = fitArtifact(item, {
    requirements: [req],
    mappings: [mapping(req, "MISSING")],
  });
  const result = recommendations.buildOpportunityRecommendationEngine({
    generatedAt,
    queueResult: queue,
    explainableFitArtifacts: [artifact],
    resumeVersions: [resumeVersion()],
  });
  const record = result.recommendations[0];

  assert.equal(record.recommendation, "REVIEW");
  assert.equal(record.applicationReadiness, "NEEDS_EVIDENCE_REVIEW");
  assert.equal(record.missingSkills.length, 1);
  assert.equal(record.missingSkills[0].technologyOrSkill, "SQL");
  assert.notEqual(record.estimatedResumeUpdateEffort, "NONE");
});

test("ResumeVersion review need keeps recommendation in REVIEW", () => {
  const { result } = buildRecommendation([sourceInput()], {
    resumeVersions: [
      resumeVersion({
        reviewStatus: "NEEDS_OPERATOR_REVIEW",
        factSafetyStatus: "UNKNOWN",
      }),
    ],
  });
  const record = result.recommendations[0];

  assert.equal(record.recommendation, "REVIEW");
  assert.equal(record.applicationReadiness, "NEEDS_RESUME_REVIEW");
  assert.equal(record.recommendedResumeVersion.status, "REVIEW_BEFORE_REUSE");
});

test("duplicate and existing-application prevention outrank apply recommendations", () => {
  const duplicate = buildRecommendation([
    sourceInput({ providerJobId: "dupe", sourceUrl: "https://jobs.example.invalid/dupe-a" }),
    sourceInput({ providerJobId: "dupe", sourceUrl: "https://jobs.example.invalid/dupe-b", title: "AI Automation Program Manager" }),
  ]).result;
  const existing = buildRecommendation([sourceInput()], { applications: [application()] }).result;

  assert.equal(duplicate.recommendations.every((record) => record.recommendation === "SKIP"), true);
  assert.equal(existing.recommendations[0].recommendation, "SKIP");
  assert.equal(existing.recommendations[0].applicationReadiness, "BLOCKED_EXISTING_APPLICATION");
});

test("no ResumeVersion produces REVIEW without generating or mutating a resume", () => {
  const { result } = buildRecommendation([sourceInput()], { resumeVersions: [] });
  const record = result.recommendations[0];

  assert.equal(record.recommendation, "REVIEW");
  assert.equal(record.recommendedResumeVersion.status, "NO_RESUMEVERSION_AVAILABLE");
  assert.equal(record.resumeGenerated, false);
  assert.equal(record.resumeMutated, false);
});

test("private output writer rejects repository paths and writes owner-private files outside Git", () => {
  const { result } = buildRecommendation();
  assert.throws(
    () =>
      recommendations.writeOpportunityRecommendationOutputs({
        outputRoot: path.join(root, "staffordos/tmp-j003"),
        repositoryRoot: root,
        result,
      }),
    /outside the repository/,
  );
  const outputRoot = mkdtempSync(path.join(tmpdir(), "j003-recommendations-"));
  const written = recommendations.writeOpportunityRecommendationOutputs({
    outputRoot,
    repositoryRoot: root,
    result,
  });

  assert.equal(written.artifactNames.length, 8);
  assert.equal(written.artifactNames.includes("run_lineage.json"), true);
  assert.equal(written.artifactNames.includes("opportunity_recommendation_result.json"), true);
  assert.equal(written.privatePathVisible, false);
  assert.equal(statSync(written.runDirectory).mode & 0o777, 0o700);
  for (const filePath of written.writtenFiles) {
    assert.equal(statSync(filePath).mode & 0o777, 0o600);
  }
});

test("read model hides private paths, raw text, URLs, and action controls", () => {
  const { result } = buildRecommendation();
  const read = result.readModel[0];

  assert.equal(read.privatePathVisible, false);
  assert.equal(read.rawResumeTextVisible, false);
  assert.equal(read.sourceUrlVisible, false);
  assert.equal(read.applicationActionAvailable, false);
  assert.equal(read.messageActionAvailable, false);
  assert.equal(read.resumeMutationAvailable, false);
  assert.doesNotMatch(serialize(read), /\/private\/redacted|Synthetic_Resume\.pdf/);
});

test("source and CLI expose no forbidden execution capabilities or extra providers", () => {
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|puppeteer|playwright|chromium|selenium/);
  assert.doesNotMatch(source, /apply\s*\(|submit\s*\(|send\s*\(|generateResume|generateCover|OAuth|ollama\.|runOllama|OLLAMA_HOST/);
  assert.doesNotMatch(source, /greenhouse|boards-api|workday\/|lever\.|ashby/i);
  assert.doesNotMatch(cliSource, /fetch\(|puppeteer|playwright|apply\s*\(|submit\s*\(|send\s*\(|generateResume|generateCover/);
});

test("CLI summary is redacted and reports all execution flags closed", () => {
  const { result } = buildRecommendation();
  const summary = recommendations.buildOpportunityRecommendationCliSummary(result, 7);

  assert.equal(summary.privatePathVisible, false);
  assert.equal(summary.privateArtifactsWritten, 7);
  assert.equal(summary.noApplicationSubmitted, true);
  assert.equal(summary.noApplicationCreated, true);
  assert.equal(summary.noResumeGenerated, true);
  assert.equal(summary.noResumeMutated, true);
  assert.equal(summary.noMessageSent, true);
  assert.equal(summary.noExternalProviderCall, true);
  assert.equal(summary.noExternalAi, true);
  assert.equal(summary.noOllama, true);
});
