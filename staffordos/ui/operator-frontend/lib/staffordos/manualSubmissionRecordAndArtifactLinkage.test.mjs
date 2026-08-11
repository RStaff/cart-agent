import assert from "node:assert/strict";
import { mkdtempSync, statSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const frontendPackage = path.join(root, "staffordos/ui/operator-frontend/package.json");
const modulePath = path.join(
  root,
  "staffordos/ui/operator-frontend/lib/staffordos/manualSubmissionRecordAndArtifactLinkage.ts",
);
const manualApplicationPath = path.join(
  root,
  "staffordos/ui/operator-frontend/lib/staffordos/manualApplicationEventTracking.ts",
);
const requireFromFrontend = createRequire(frontendPackage);
const ts = requireFromFrontend("typescript");

function requireTypeScriptModule(targetPath) {
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

const linkage = requireTypeScriptModule(modulePath);
const manualApplications = requireTypeScriptModule(manualApplicationPath);
const generatedAt = "2026-08-11T12:00:00Z";

function approvedArtifact(overrides = {}) {
  return {
    schemaVersion: "staffordos.careeros.application_artifact_version.v1",
    workflowVersion: "CAREEROS_APPLICATION_INTELLIGENCE_V1_03B",
    artifactVersionId: overrides.artifactVersionId || "export_artifact_ai_automation_v1",
    artifactType: "RESUME",
    version: overrides.version || 1,
    createdAt: "2026-08-10T12:00:00Z",
    workspaceId: "professional",
    applicationIntelligencePacketId: overrides.applicationIntelligencePacketId || "packet_ai_automation",
    jobOpportunityId: overrides.jobOpportunityId || "opportunity_ai_automation",
    company: overrides.company || "Example Automation",
    role: overrides.role || "AI Automation Product Owner",
    sourceDraftArtifactVersionId: "draft_artifact_ai_automation",
    sourceDraftDigest: "sha256:source-draft",
    sourceCareerAuthorityDigest: "sha256:career-authority",
    exportedContentDigest: "sha256:exported-content",
    operatorApprovalState: "APPROVED",
    operatorApprovalTimestamp: "2026-08-10T12:00:00Z",
    exportState: "DOCX_READY",
    validationIssues: [],
    fileReferences: [
      {
        fileReferenceId: "docx_ref",
        fileKind: "DOCX",
        filename: "Ross_Stafford_Example_Automation_AI_Automation_Product_Owner_Resume_v1.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        created: true,
        byteLength: 1024,
        contentDigest: "sha256:docx-content",
        privatePathVisible: false,
        limitations: ["Synthetic DOCX fixture."],
      },
    ],
    supersedesArtifactVersionId: null,
    supersededByArtifactVersionId: null,
    privacy: "Professional owner-private",
    submissionStatus: "NOT_SUBMITTED",
    applicationCreated: false,
    applicationSubmitted: false,
    resumeVersionCreated: false,
    resumeVersionMutated: false,
    resumeUploaded: false,
    coverLetterGenerated: false,
    messageSent: false,
    browserAutomationUsed: false,
    externalProviderCall: false,
    externalAiUsed: false,
    ollamaUsed: false,
    privatePathVisible: false,
    rawCareerEvidenceVisibleInReadModel: false,
    claimTraceabilityPreservedPrivately: true,
    limitations: ["Synthetic approved export artifact."],
    ...overrides,
  };
}

function packet(overrides = {}) {
  const identityOverrides = overrides.identity || {};
  const canonicalSourceUrl = Object.prototype.hasOwnProperty.call(overrides, "canonicalSourceUrl")
    ? overrides.canonicalSourceUrl
    : identityOverrides.canonicalSourceUrl ?? "https://jobs.example.test/ai-automation-product-owner";
  const { identity: _identity, canonicalSourceUrl: _canonicalSourceUrl, ...rest } = overrides;
  return {
    ...rest,
    packetId: overrides.packetId || "packet_ai_automation",
    identity: {
      jobOpportunityId: identityOverrides.jobOpportunityId || overrides.jobOpportunityId || "opportunity_ai_automation",
      sourceRecordId: identityOverrides.sourceRecordId || overrides.sourceRecordId || "source_ai_automation",
      company: identityOverrides.company || overrides.company || "Example Automation",
      role: identityOverrides.role || overrides.role || "AI Automation Product Owner",
      canonicalSourceUrl,
    },
  };
}

function submission(overrides = {}) {
  return {
    artifactVersionId: "export_artifact_ai_automation_v1",
    submittedAt: "2026-08-11",
    submittedAtPrecision: "DATE",
    submissionChannel: "Company careers site",
    operatorConfirmed: true,
    ...overrides,
  };
}

function build(overrides = {}) {
  return linkage.buildManualSubmissionRecordAndArtifactLinkage({
    generatedAt,
    submissions: [submission(overrides.submission || {})],
    exportArtifacts: [approvedArtifact(overrides.artifact || {})],
    packets: [packet(overrides.packet || {})],
    existingStore: overrides.existingStore,
    existingLinks: overrides.existingLinks || [],
  });
}

function existingApplication(overrides = {}) {
  const result = manualApplications.buildManualApplicationTrackingResult({
    generatedAt: "2026-08-01T12:00:00Z",
    applications: [
      {
        sourceRecordId: overrides.sourceRecordId || "existing_source",
        opportunityId: overrides.opportunityId || "existing_opportunity",
        analysisRunId: overrides.analysisRunId || "existing_analysis",
        companyName: overrides.companyName || "Existing Company",
        roleTitle: overrides.roleTitle || "Existing Role",
        submissionOccurred: true,
        submissionMethod: "MANUAL_EXTERNAL",
        submissionChannel: "Company careers site",
        submittedAt: overrides.submittedAt || "2026-08-01",
        submittedAtPrecision: "DATE",
        resumeFilename: overrides.resumeFilename,
        coverLetterStatus: "UNKNOWN",
        employerResponseStatus: "NONE_RECORDED",
        operatorConfirmed: true,
      },
    ],
  });
  return {
    applications: result.applications,
    applicationEvents: result.applicationEvents,
    followUpReviews: result.followUpReviews,
    confirmationNeeded: [],
  };
}

test("manual confirmation and submission date are required before Application creation", () => {
  const result = build({
    submission: {
      operatorConfirmed: false,
      submittedAt: null,
    },
  });

  assert.equal(result.summary.applicationsCreated, 0);
  assert.equal(result.summary.blockedSubmissions, 1);
  assert.equal(result.blockedSubmissions[0].validationIssues.some((issue) => issue.code === "OPERATOR_CONFIRMATION_REQUIRED"), true);
  assert.equal(result.blockedSubmissions[0].validationIssues.some((issue) => issue.code === "SUBMISSION_DATE_REQUIRED"), true);
});

test("approved resume ApplicationArtifactVersion is required and filename guessing is blocked", () => {
  const result = linkage.buildManualSubmissionRecordAndArtifactLinkage({
    generatedAt,
    submissions: [submission({ artifactVersionId: "missing_artifact" })],
    exportArtifacts: [],
    packets: [packet()],
  });

  assert.equal(result.summary.applicationsCreated, 0);
  assert.equal(result.summary.artifactLinksCreated, 0);
  assert.equal(result.auditSummary.noFilenameGuessing, true);
  assert.equal(result.blockedSubmissions[0].validationIssues.some((issue) => issue.code === "APPROVED_RESUME_ARTIFACT_REQUIRED"), true);
});

test("duplicate Application prevention reuses existing Application authority", () => {
  const store = existingApplication({
    opportunityId: "opportunity_ai_automation",
    companyName: "Example Automation",
    roleTitle: "AI Automation Product Owner",
  });
  const result = build({ existingStore: store });

  assert.equal(result.summary.applicationsCreated, 0);
  assert.equal(result.summary.artifactLinksCreated, 0);
  assert.equal(result.blockedSubmissions[0].validationIssues[0].code, "APPLICATION_DUPLICATE_BLOCKED");
  assert.deepEqual(result.blockedSubmissions[0].duplicateApplicationIds, [store.applications[0].applicationId]);
});

test("operator-confirmed submission creates an Application with exact artifact linkage", () => {
  const result = build();
  const application = result.createdApplications[0];
  const link = result.artifactSubmissionLinks[0];

  assert.equal(result.summary.applicationsCreated, 1);
  assert.equal(application.resumeReference.status, "APPLICATION_ARTIFACT_VERSION");
  assert.equal(application.resumeReference.assetReferenceId, "export_artifact_ai_automation_v1");
  assert.equal(application.resumeReference.filename, "Ross_Stafford_Example_Automation_AI_Automation_Product_Owner_Resume_v1.docx");
  assert.equal(link.applicationId, application.applicationId);
  assert.equal(link.artifactVersionId, "export_artifact_ai_automation_v1");
  assert.equal(link.fileReference.contentDigest, "sha256:docx-content");
  assert.equal(link.exactArtifactLinked, true);
  assert.equal(link.noFilenameGuessing, true);
});

test("submitted artifact state is append-only and does not mutate source artifact content", () => {
  const artifact = approvedArtifact();
  const result = build({ artifact });
  const state = result.submittedArtifactStates[0];

  assert.equal(artifact.submissionStatus, "NOT_SUBMITTED");
  assert.equal(artifact.exportedContentDigest, "sha256:exported-content");
  assert.equal(state.sourceArtifactSubmissionStatus, "NOT_SUBMITTED");
  assert.equal(state.submissionStatus, "SUBMITTED");
  assert.equal(state.exportedContentDigest, artifact.exportedContentDigest);
  assert.equal(state.artifactContentMutated, false);
  assert.equal(state.artifactVersionCreated, false);
  assert.equal(state.resumeVersionCreated, false);
});

test("ApplicationEvent records manual submission and references exact artifact linkage", () => {
  const result = build();
  const submissionEvent = result.createdApplicationEvents.find((event) => event.eventType === "SUBMITTED_MANUAL_EXTERNAL");
  const link = result.artifactSubmissionLinks[0];

  assert.ok(submissionEvent);
  assert.equal(submissionEvent.submittedByStaffordOS, false);
  assert.equal(submissionEvent.externalActionPerformedByStaffordOS, false);
  assert.equal(submissionEvent.evidenceReferences.includes(link.linkId), true);
  assert.equal(submissionEvent.evidenceReferences.includes("export_artifact_ai_automation_v1"), true);
});

test("new Application is handed to existing follow-up engagement authority", () => {
  const result = build();

  assert.equal(result.summary.followUpReviewsCreated, 1);
  assert.ok(result.engagementResult);
  assert.equal(result.engagementResult.sourceAuthority.existingApplicationAuthorityReused, true);
  assert.equal(result.engagementResult.summary.applicationsReviewed, 1);
  assert.equal(result.readModel[0].followUpDueDateKnown, true);
  assert.equal(["FOLLOW_UP", "NO_ACTION"].includes(result.readModel[0].nextAction), true);
});

test("historical UNKNOWN resume linkages remain UNKNOWN unless operator-confirmed", () => {
  const store = existingApplication({
    opportunityId: "historical_opportunity",
    companyName: "Historical Company",
    roleTitle: "Historical Role",
    resumeFilename: null,
  });
  const result = build({ existingStore: store });

  assert.equal(store.applications[0].resumeReference.status, "UNKNOWN");
  assert.equal(result.historicalUnknownResumeLinkages.length, 1);
  assert.equal(result.historicalUnknownResumeLinkages[0].remainsUnknown, true);
  assert.equal(result.historicalUnknownResumeLinkages[0].applicationId, store.applications[0].applicationId);
});

test("source URL authority is required for submitted Application record", () => {
  const result = build({
    packet: {
      canonicalSourceUrl: null,
    },
  });

  assert.equal(result.summary.applicationsCreated, 0);
  assert.equal(result.blockedSubmissions[0].validationIssues.some((issue) => issue.code === "SOURCE_URL_REQUIRED"), true);
});

test("external actions, resume generation, messaging, and browser activity remain disabled", () => {
  const result = build();

  assert.equal(result.auditSummary.noApplicationSubmittedByStaffordOS, true);
  assert.equal(result.auditSummary.noBrowserAutomation, true);
  assert.equal(result.auditSummary.noEmployerUpload, true);
  assert.equal(result.auditSummary.noExternalProviderCall, true);
  assert.equal(result.auditSummary.noResumeGenerated, true);
  assert.equal(result.auditSummary.noResumeMutated, true);
  assert.equal(result.auditSummary.noMessageSent, true);
  assert.equal(result.auditSummary.noExternalAi, true);
  assert.equal(result.auditSummary.noOllama, true);
});

test("private writer preserves owner-private permissions and redacted read model", () => {
  const jobSearchRoot = mkdtempSync(path.join(tmpdir(), "careeros-v104-"));
  const result = build();
  const writeResult = linkage.writeManualSubmissionRecordAndArtifactLinkageOutputs({
    jobSearchRoot,
    repositoryRoot: root,
    result,
  });

  assert.equal(writeResult.privatePathVisible, false);
  assert.equal((statSync(writeResult.submissionRunDirectory).mode & 0o777).toString(8), "700");
  assert.equal((statSync(writeResult.writtenFiles[0]).mode & 0o777).toString(8), "600");
  assert.equal(JSON.stringify(result.readModel).includes(jobSearchRoot), false);
  assert.equal(result.readModel[0].rawResumeVisible, false);
  assert.equal(result.readModel[0].rawJobTextVisible, false);
  assert.equal(result.readModel[0].sourceUrlVisible, false);
});
