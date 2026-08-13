import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import Module from "node:module";
import test from "node:test";

const root = process.cwd();
const frontendPackage = path.join(root, "staffordos/ui/operator-frontend/package.json");
const dailyPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/careerOsDailyJobSearchExperience.ts");
const loaderPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/careerOsDailyJobSearchExperiencePrivateLoader.ts");
const workflowPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/careerWorkflowActions.ts");
const surfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/JobCommandSurface.tsx");
const routePath = path.join(root, "staffordos/ui/operator-frontend/app/os/professional/jobs/page.tsx");
const manualSubmissionPath = path.join(
  root,
  "staffordos/ui/operator-frontend/lib/staffordos/manualSubmissionRecordAndArtifactLinkage.ts",
);
const pipelinePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateApplicationPipelineReview.ts");
const exportRoutePath = path.join(
  root,
  "staffordos/ui/operator-frontend/app/os/professional/jobs/artifacts/[artifactVersionId]/docx/route.ts",
);
const requireFromFrontend = createRequire(frontendPackage);
const ts = requireFromFrontend("typescript");

const dailySource = readFileSync(dailyPath, "utf8");
const loaderSource = readFileSync(loaderPath, "utf8");
const workflowSource = readFileSync(workflowPath, "utf8");
const surfaceSource = readFileSync(surfacePath, "utf8");
const routeSource = readFileSync(routePath, "utf8");
const manualSubmissionSource = readFileSync(manualSubmissionPath, "utf8");
const pipelineSource = readFileSync(pipelinePath, "utf8");
const exportRouteSource = readFileSync(exportRoutePath, "utf8");
const implementationSource = [
  dailySource,
  loaderSource,
  workflowSource,
  surfaceSource,
  routeSource,
  manualSubmissionSource,
  pipelineSource,
  exportRouteSource,
].join("\n");

function registerTypeScriptRequire() {
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
  return () => {
    if (originalTsExtension) {
      Module._extensions[".ts"] = originalTsExtension;
    } else {
      delete Module._extensions[".ts"];
    }
  };
}

const restoreTypeScriptRequire = registerTypeScriptRequire();
const daily = requireFromFrontend(dailyPath);
const loader = requireFromFrontend(loaderPath);
const workflow = requireFromFrontend(workflowPath);
restoreTypeScriptRequire();

const {
  EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE,
  buildCareerOsDailyJobSearchExperience,
} = daily;

const generatedAt = "2026-08-09T12:00:00.000Z";

function qualificationFixture(state = "PLAUSIBLE_TARGET", overrides = {}) {
  const defaultReason =
    state === "PLAUSIBLE_TARGET"
      ? "The target lane is supported by confirmed or transferable experience; exact title history is not required."
      : state === "TRANSFERABLE_BUT_NOT_DIRECT"
        ? "The target lane has transferable support, but direct title history is not established."
        : state === "HARD_MISMATCH"
          ? "The role family is outside the confirmed target lanes and has no meaningful transferable support."
          : "The available job requirements and career evidence do not establish a sufficiently qualified target match.";
  return {
    state,
    reasons: [defaultReason],
    hardMismatchCategories: state === "HARD_MISMATCH" ? ["incompatible role family"] : [],
    limitations: ["Synthetic qualification fixture."],
    ...overrides,
  };
}

function commandCenterFixture() {
  return {
    capturedAsOf: "2026-08-09T12:00:00.000Z",
    todaysBrief: [
      { id: "new-opportunities", label: "Current Opportunities", value: 3, sourceAuthority: "fixture", limitations: [] },
      { id: "ready-to-apply", label: "Ready to Apply", value: 1, sourceAuthority: "fixture", limitations: [] },
      { id: "review", label: "Review", value: 1, sourceAuthority: "fixture", limitations: [] },
      { id: "waiting", label: "Waiting", value: 1, sourceAuthority: "fixture", limitations: [] },
      { id: "skipped", label: "Skipped", value: 0, sourceAuthority: "fixture", limitations: [] },
    ],
    topRecommendations: [
      {
        id: "rec_apply",
        position: "AI Automation Product Manager",
        company: "Example Automation",
        recommendation: "APPLY_NOW",
        qualification: qualificationFixture("PLAUSIBLE_TARGET"),
        shortlistedForDecision: true,
        explainableFit: "Strong evidence alignment from existing fit output.",
        resumeVersion: "ROLE_TARGETED_RESUME / PDF / SAFE",
        nextAction: "Review the package before manual application.",
        applicationReadiness: "READY_FOR_OPERATOR_APPROVED_APPLICATION",
        supportingEvidenceCount: 4,
        missingSkillCount: 0,
        estimatedResumeUpdateEffort: "NONE",
        location: "New York, NY",
        workArrangement: "Hybrid",
        capturedAsOf: generatedAt,
        limitations: ["Synthetic recommendation fixture."],
        applicationActionAvailable: false,
        messageActionAvailable: false,
        resumeMutationAvailable: false,
      },
      {
        id: "rec_review",
        position: "Business Technology Analyst",
        company: "Example Systems",
        recommendation: "REVIEW",
        qualification: qualificationFixture("TRANSFERABLE_BUT_NOT_DIRECT"),
        shortlistedForDecision: true,
        explainableFit: "Evidence review needed.",
        resumeVersion: "REVIEW_BEFORE_REUSE",
        nextAction: "Review evidence before deciding.",
        applicationReadiness: "NEEDS_EVIDENCE_REVIEW",
        supportingEvidenceCount: 1,
        missingSkillCount: 2,
        estimatedResumeUpdateEffort: "MODERATE",
        location: "Boston, MA",
        workArrangement: "Remote",
        capturedAsOf: generatedAt,
        limitations: ["Synthetic recommendation fixture."],
        applicationActionAvailable: false,
        messageActionAvailable: false,
        resumeMutationAvailable: false,
      },
    ],
    pipeline: {
      applicationsSubmitted: 4,
      interviews: 1,
      offers: 0,
      closedApplications: 0,
      followUpsDue: 0,
      sourceAuthority: "fixture",
      limitations: [],
    },
    systemHealth: {
      providerStatus: [
        {
          id: "provider-greenhouse",
          label: "Greenhouse",
          state: "RUN_AVAILABLE",
          detail: "Provider fixture.",
          sourceAuthority: "fixture",
          limitations: [],
        },
      ],
      lastDiscoveryRun: "2026-08-09T11:00:00.000Z",
      queueSize: 3,
      sourceAuthority: "fixture",
      limitations: [],
    },
  };
}

function recommendationReadModelRecord(id, recommendation, applicationReadiness, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_opportunity_recommendation_read_model.v1",
    recommendationId: id,
    canonicalOpportunityId: overrides.canonicalOpportunityId || `canonical_${id}`,
    queueItemId: overrides.queueItemId || `queue_${id}`,
    company: overrides.company || `Example ${id}`,
    role: overrides.role || "AI Automation Product Manager",
    recommendation,
    qualification: overrides.qualification || qualificationFixture("PLAUSIBLE_TARGET"),
    shortlistedForDecision: overrides.shortlistedForDecision ?? !["WAIT", "SKIP"].includes(recommendation),
    applicationReadiness,
    recommendedResumeVersion: {
      status: overrides.resumeStatus ?? "SELECTED_EXISTING_RESUMEVERSION",
      safeLabel: overrides.safeLabel ?? "ROLE_TARGETED_RESUME / PDF / SUPPORTED_VERIFIED / 2026-08-01 / abc12345",
      factSafetyStatus: overrides.factSafetyStatus ?? "SUPPORTED_VERIFIED",
    },
    missingSkillCount: overrides.missingSkillCount ?? 0,
    supportingEvidenceCount: overrides.supportingEvidenceCount ?? 3,
    estimatedResumeUpdateEffort: overrides.estimatedResumeUpdateEffort ?? "NONE",
    recommendedNextAction: overrides.recommendedNextAction ?? "Review the recommendation before recording Ross's decision.",
    capturedAsOf: generatedAt,
    limitations: ["Synthetic workflow read-model fixture."],
    privatePathVisible: false,
    rawResumeTextVisible: false,
    sourceUrlVisible: false,
    applicationActionAvailable: false,
    messageActionAvailable: false,
    resumeMutationAvailable: false,
  };
}

function recommendationRecord(record, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_opportunity_recommendation.v1",
    recommendationId: record.recommendationId,
    queueItemId: record.queueItemId,
    sourceRecordId: overrides.sourceRecordId || `source_${record.recommendationId}`,
    opportunityId: overrides.opportunityId || `opportunity_${record.recommendationId}`,
    company: record.company,
    role: record.role,
    recommendation: record.recommendation,
    explainableFit: {
      available: true,
      fitAssessment: null,
      fitRecommendation: overrides.fitRecommendation || "Existing Explainable Fit recommends review with verified evidence.",
      coverage: null,
      majorBlockers: [],
      limitations: ["Synthetic fit fixture."],
    },
    recommendedResumeVersion: {
      status: record.recommendedResumeVersion.status,
      resumeVersionId: "resume_version_synthetic",
      safeLabel: record.recommendedResumeVersion.safeLabel,
      reason: "Synthetic deterministic resume selection.",
      evaluatedResumeVersions: [],
      limitations: ["Synthetic resume fixture."],
      privatePathVisible: false,
      rawResumeTextVisible: false,
      resumeGenerated: false,
      resumeMutated: false,
    },
    supportingCareerEvidence: [],
    missingSkills: [],
    estimatedResumeUpdateEffort: record.estimatedResumeUpdateEffort,
    applicationReadiness: record.applicationReadiness,
    recommendedNextAction: record.recommendedNextAction,
    recommendationReasons: ["Synthetic recommendation fixture."],
    authorityRequired: "ROSS_APPROVAL_BEFORE_APPLICATION",
    completionProof: "Ross records workflow action.",
    deterministicRulesOnly: true,
    hiringProbabilityGenerated: false,
    interviewProbabilityGenerated: false,
    aiConfidenceScoreGenerated: false,
    applicationSubmitted: false,
    applicationCreated: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    externalAiUsed: false,
    limitations: ["Synthetic recommendation fixture."],
  };
}

function recommendationResultFixture() {
  const readModel = [
    recommendationReadModelRecord("rec_apply", "APPLY_NOW", "READY_FOR_OPERATOR_APPROVED_APPLICATION", {
      company: "Example Automation",
      role: "AI Automation Product Manager",
      recommendedNextAction: "Proceed only after Ross decides to prepare this application.",
    }),
    recommendationReadModelRecord("rec_review", "REVIEW", "NEEDS_EVIDENCE_REVIEW", {
      company: "Example Systems",
      role: "Business Technology Analyst",
      qualification: qualificationFixture("TRANSFERABLE_BUT_NOT_DIRECT"),
      missingSkillCount: 2,
      estimatedResumeUpdateEffort: "MODERATE",
      recommendedNextAction: "Review evidence before deciding whether to prepare this application.",
    }),
    recommendationReadModelRecord("rec_wait", "WAIT", "WAITING_FOR_SOURCE_OR_DUPLICATE_REVIEW", {
      company: "Example Platform",
      role: "AI Platform Operations Lead",
      qualification: qualificationFixture("INSUFFICIENT_EVIDENCE"),
      shortlistedForDecision: false,
    }),
    recommendationReadModelRecord("rec_skip", "SKIP", "SKIP_RECOMMENDED", {
      company: "Example Duplicate",
      role: "Traditional Marketing Specialist",
      qualification: qualificationFixture("HARD_MISMATCH"),
      shortlistedForDecision: false,
      resumeStatus: "NO_SAFE_EXISTING_RESUMEVERSION",
      safeLabel: null,
      factSafetyStatus: null,
      missingSkillCount: 3,
      estimatedResumeUpdateEffort: "HIGH",
    }),
  ];
  return {
    schemaVersion: "staffordos.job_search.private_opportunity_recommendation_result.v1",
    workflowVersion: "J003.01",
    generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceAuthority: {
      opportunityQueueReused: true,
      explainableFitReused: true,
      resumeVersionAuthorityReused: true,
      discoveryRebuilt: false,
      providerAdded: false,
    },
    recommendations: readModel.map((record) => recommendationRecord(record)),
    readModel,
    summary: {
      queueItemsReviewed: readModel.length,
      recommendationsCreated: readModel.length,
      applyNow: 1,
      review: 1,
      wait: 1,
      skip: 1,
      resumeVersionsEvaluated: 1,
      opportunitiesWithRecommendedResumeVersion: 3,
      opportunitiesMissingSkills: 2,
      readinessReadyForOperatorApprovedApplication: 1,
      hiringProbabilityGenerated: false,
      interviewProbabilityGenerated: false,
      aiConfidenceScoreGenerated: false,
    },
    auditSummary: {
      noApplicationCreated: true,
      noApplicationSubmitted: true,
      noResumeGenerated: true,
      noResumeMutated: true,
      noCoverLetterGenerated: true,
      noMessageSent: true,
      noLinkedInMutated: true,
      noBrowserAutomation: true,
      noProviderAdded: true,
      noExternalProviderCall: true,
      noExternalAi: true,
      noOllama: true,
      noOsConnection: true,
      noOperatorConnection: true,
      noCareerFactPromoted: true,
      noCareerEvidenceMutated: true,
      privatePathVisible: false,
    },
  };
}

function sourceRecordFixture(id, overrides = {}) {
  return {
    jobSourceRecordId: `source_${id}`,
    location: overrides.location || "New York, NY",
    remoteState: overrides.remoteState || "Hybrid",
    ...overrides,
  };
}

function workflowStateFixture(actions = []) {
  return workflow.buildCareerWorkflowState({
    recommendationResult: recommendationResultFixture(),
    workflowActions: actions,
    generatedAt,
  });
}

function workflowAction(recommendationId, actionType, existingActions = []) {
  return workflow.createCareerWorkflowAction({
    recommendationResult: recommendationResultFixture(),
    recommendationId,
    actionType,
    generatedAt,
    operatorConfirmed: true,
    existingActions,
  });
}

function engagementItem(overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_application_engagement_read_model.v1",
    engagementItemId: "eng_follow",
    applicationId: "app_follow",
    company: "Example Applied",
    role: "AI Platform Operations",
    applicationDate: "2026-08-01",
    currentApplicationStatus: "SUBMITTED_MANUAL_EXTERNAL",
    lastApplicationEventType: "SUBMITTED_MANUAL_EXTERNAL",
    followUpState: "DUE",
    followUpDueDateKnown: true,
    responseState: "NO_RESPONSE",
    recommendedNextEngagementAction: "FOLLOW_UP",
    blockingIssueCount: 0,
    needsAttention: true,
    communicationAllowed: false,
    operatorApprovalRequired: true,
    applicationSubmitted: false,
    messageSent: false,
    outreachGenerated: false,
    resumeMutated: false,
    browserAutomationUsed: false,
    externalProviderCall: false,
    externalAiUsed: false,
    ollamaUsed: false,
    privatePathVisible: false,
    recruiterContactVisible: false,
    limitations: ["Synthetic engagement fixture."],
    ...overrides,
  };
}

function packageItem(overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_ready_to_apply_application_package_read_model.v1",
    packageId: "pkg_resume",
    recommendationId: "rec_apply",
    opportunityId: "opp_apply",
    company: "Example Automation",
    role: "AI Automation Product Manager",
    applicationReadiness: "NEEDS_RESUME_REVIEW",
    canonicalJobUrlKnown: true,
    resumeVersionLabel: "ROLE_TARGETED_RESUME / PDF / SAFE",
    resumeVersionStatus: "REVIEW_BEFORE_REUSE",
    factSafetyStatus: "NEEDS_EVIDENCE",
    supportingEvidenceCount: 2,
    missingSkillCount: 1,
    blockingIssueCount: 0,
    resumeUpdateRequirementCount: 1,
    recommendedNextAction: "Review resume safety before manual application.",
    humanReviewRequired: true,
    applicationCreated: false,
    applicationSubmitted: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    privatePathVisible: false,
    rawJobTextVisible: false,
    rawResumeTextVisible: false,
    sourceUrlVisible: false,
    limitations: ["Synthetic package fixture."],
    ...overrides,
  };
}

function reviewItem(overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_application_review_workspace_read_model.v1",
    packageId: "pkg_ready",
    opportunityId: "opp_ready",
    recommendationId: "rec_ready",
    company: "Example Ready",
    role: "Technical Program Manager",
    canonicalJobUrlKnown: true,
    recommendation: "APPLY_NOW",
    applicationReadiness: "READY",
    reviewState: "MANUAL_APPLICATION_READY",
    latestReviewDecision: "REVIEWED_READY",
    manualApplicationReady: true,
    resumeVersionLabel: "TPM_RESUME / PDF / SAFE",
    factSafetyStatus: "SUPPORTED_TRANSFERABLE",
    supportingEvidenceCount: 3,
    missingSkillCount: 0,
    blockingIssueCount: 0,
    resumeUpdateRequirementCount: 0,
    recommendedNextAction: "Ready for Ross to apply manually outside CareerOS.",
    humanReviewRequired: true,
    applicationCreated: false,
    applicationSubmitted: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    privatePathVisible: false,
    rawJobTextVisible: false,
    rawResumeTextVisible: false,
    sourceUrlVisible: false,
    limitations: ["Synthetic review fixture."],
    ...overrides,
  };
}

function intelligenceItem(overrides = {}) {
  return {
    schemaVersion: "staffordos.careeros.application_intelligence_packet_read_model.v1",
    packetId: "packet_apply",
    jobOpportunityId: "opp_apply",
    recommendationId: "rec_apply",
    company: "Example Automation",
    role: "AI Automation Product Manager",
    recommendation: "REVIEW",
    fitRecommendation: "APPLY_WITH_POSITIONING",
    fitSummary: "Evidence-backed fit requires resume review.",
    rankedLaneLabels: ["AI / Automation", "Business Technology"],
    matchedRequirementCount: 3,
    unmatchedRequirementCount: 1,
    skillGapCount: 0,
    evidenceGapCount: 1,
    unsupportedRequirementCount: 0,
    supportingEvidenceCount: 2,
    careerFactReferenceCount: 2,
    resumeVersionLabel: "ROLE_TARGETED_RESUME / PDF / NEEDS_REVIEW",
    resumeVersionStatus: "REVIEW_BEFORE_REUSE",
    resumeSafetyState: "NEEDS_OPERATOR_REVIEW",
    resumeSafeToReuse: false,
    blockerCount: 2,
    nextAction: "REVIEW_RESUME",
    humanReview: {
      whyThisFits: [
        "The role asks for AI automation and workflow delivery. StaffordOS work supports this positioning.",
      ],
      supportingExperience: [
        {
          label: "StaffordOS - AI agent orchestration and governance",
          detail: "Built governed job-search and application workflow components with tests and review boundaries.",
          supportLevel: "Verified",
          limitations: [],
        },
        {
          label: "CSI - Salesforce/Pardot automation",
          detail: "Supported marketing automation requirements, stakeholder coordination, and audience workflow.",
          supportLevel: "Supported with limitation",
          limitations: ["Treat this as transferable experience, not exact same-role proof."],
        },
      ],
      gapsAndRisks: [
        {
          kind: "Needs verification",
          requirement: "Experience owning enterprise rollout at the same scale.",
          detail: "The requirement needs evidence review before it can be used as a positive claim.",
        },
      ],
      resumeReadiness: {
        label: "Needs review",
        detail: "The selected resume may be useful, but Ross needs to review evidence or wording before using it.",
        blockers: ["Resume evidence or wording needs Ross's review before use."],
      },
      nextAction: "Review evidence before deciding whether to prepare this application.",
    },
    humanReviewRequired: true,
    applicationCreated: false,
    applicationSubmitted: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    privatePathVisible: false,
    rawJobTextVisible: false,
    rawResumeTextVisible: false,
    sourceUrlVisible: false,
    limitations: ["Synthetic packet fixture."],
    ...overrides,
  };
}

function resumeDraftItem(overrides = {}) {
  return {
    schemaVersion: "staffordos.careeros.truth_bound_resume_draft_read_model.v1",
    artifactVersionId: "artifact_resume_draft",
    packetId: "packet_apply",
    jobOpportunityId: "opp_apply",
    company: "Example Automation",
    role: "AI Automation Product Manager",
    artifactType: "RESUME",
    version: 1,
    safetyState: "DRAFT_READY_FOR_REVIEW",
    operatorApprovalState: "PENDING_REVIEW",
    humanReviewRequired: true,
    tracedClaimCount: 4,
    blockedIssueCount: 0,
    reviewIssueCount: 0,
    omittedUnsupportedClaimCount: 0,
    sectionCount: 3,
    draftContentVisible: false,
    privatePathVisible: false,
    sourceAuthorityIdsVisible: false,
    nextAction: "REVIEW_DRAFT",
    applicationCreated: false,
    applicationSubmitted: false,
    resumeExported: false,
    resumeUploaded: false,
    messageSent: false,
    limitations: ["Synthetic draft fixture."],
    ...overrides,
  };
}

function resumeDraftReviewItem(overrides = {}) {
  return {
    schemaVersion: "staffordos.careeros.truth_bound_resume_draft_review_read_model.v1",
    artifactVersionId: "artifact_resume_draft",
    packetId: "packet_apply",
    jobOpportunityId: "opp_apply",
    company: "Example Automation",
    role: "AI Automation Product Manager",
    artifactType: "RESUME",
    version: 1,
    safetyState: "DRAFT_READY_FOR_REVIEW",
    operatorApprovalState: "PENDING_REVIEW",
    reviewStatus: "READY_FOR_REVIEW",
    approvalAllowed: true,
    requestChangesAllowed: true,
    rejectAllowed: true,
    humanReviewRequired: true,
    tracedClaimCount: 4,
    blockedIssueCount: 0,
    reviewIssueCount: 0,
    omittedUnsupportedClaimCount: 1,
    sections: {
      summary: ["Builds AI automation workflows using verified APIs and structured governance."],
      skills: ["AI automation", "API integration", "workflow documentation"],
      experience: [
        {
          employer: "Example Systems",
          title: "Business Technology Lead",
          dateRange: "2021-01 - 2024-12",
          bullets: ["Delivered verified automation workflows with documented stakeholder requirements."],
          limitations: ["Synthetic experience fixture."],
        },
      ],
      projects: [
        {
          label: "CareerOS",
          bullets: ["Built governed job-search workflow components with tests and rollback boundaries."],
          limitations: ["Synthetic project fixture."],
        },
      ],
      education: ["B.A., Wesleyan University"],
      certifications: [],
    },
    needsAttention: ["Unsupported claims omitted: 1."],
    draftContentVisible: true,
    privatePathVisible: false,
    sourceAuthorityIdsVisible: false,
    claimIdsVisible: false,
    careerFactIdsVisible: false,
    careerEvidenceIdsVisible: false,
    privateFilesystemPathVisible: false,
    nextAction: "REVIEW_DRAFT",
    applicationCreated: false,
    applicationSubmitted: false,
    resumeExported: false,
    resumeUploaded: false,
    messageSent: false,
    browserAutomationUsed: false,
    externalAiUsed: false,
    limitations: ["Synthetic review fixture."],
    ...overrides,
  };
}

function resumeExportItem(overrides = {}) {
  return {
    schemaVersion: "staffordos.careeros.reviewed_resume_draft_export_read_model.v1",
    artifactVersionId: "artifact_resume_export",
    sourceDraftArtifactVersionId: "artifact_resume_draft",
    packetId: "packet_apply",
    jobOpportunityId: "opp_apply",
    company: "Example Automation",
    role: "AI Automation Product Manager",
    version: 1,
    sourceDraftSafetyState: "APPROVED_FOR_EXPORT",
    operatorApprovalState: "APPROVED",
    operatorApprovalTimestamp: "2026-08-11T12:00:00.000Z",
    exportState: "DOCX_READY",
    docxCreated: true,
    pdfCreated: false,
    docxFilename: "Ross_Stafford_Example_Automation_AI_Automation_Product_Manager_Resume_v1.docx",
    downloadPath: "/os/professional/jobs/artifacts/artifact_resume_export/docx",
    submissionStatus: "NOT_SUBMITTED",
    validationIssueCount: 0,
    privatePathVisible: false,
    draftContentVisible: false,
    sourceAuthorityIdsVisible: false,
    nextAction: "DOWNLOAD_DOCX",
    limitations: ["Synthetic export fixture."],
    ...overrides,
  };
}

function manualSubmissionItem(overrides = {}) {
  return {
    schemaVersion: "staffordos.careeros.manual_submission_read_model.v1",
    applicationId: "application_ai_automation",
    jobOpportunityId: "opp_apply",
    applicationIntelligencePacketId: "packet_apply",
    artifactVersionId: "artifact_resume_export",
    company: "Example Automation",
    role: "AI Automation Product Manager",
    submittedDate: "2026-08-11",
    currentStage: "SUBMITTED_MANUAL_EXTERNAL",
    resumeArtifactFilename: "Ross_Stafford_Example_Automation_AI_Automation_Product_Manager_Resume_v1.docx",
    resumeArtifactVersion: 1,
    exactResumeArtifactKnown: true,
    sourceUrlKnown: true,
    followUpState: "NOT_DUE",
    followUpDueDateKnown: true,
    nextAction: "NO_ACTION",
    submissionStatus: "SUBMITTED",
    privatePathVisible: false,
    rawResumeVisible: false,
    rawJobTextVisible: false,
    sourceUrlVisible: false,
    limitations: ["Synthetic manual submission fixture."],
    ...overrides,
  };
}

function pipelineAction(overrides = {}) {
  return {
    actionId: overrides.actionId || "pipe_action_follow",
    applicationId: overrides.applicationId || "application_ai_automation",
    confirmationRecordId: null,
    followUpId: overrides.followUpId || "followup_ai_automation",
    title: "Review follow-up timing for Example Automation - AI Automation Product Manager",
    reason: "A follow-up review date is due or past due, but no message is authorized.",
    priorityTier: overrides.priorityTier ?? 2,
    status: overrides.status || "DUE",
    dueDate: overrides.dueDate || "2026-08-17",
    reviewDate: overrides.reviewDate || "2026-08-17",
    submittedDate: overrides.submittedDate || "2026-08-11",
    daysSinceSubmission: overrides.daysSinceSubmission ?? 6,
    employerResponseStatus: overrides.employerResponseStatus || "NONE_RECORDED",
    currentStage: overrides.currentStage || "SUBMITTED_MANUAL_EXTERNAL",
    known: ["Synthetic known application state."],
    unknown: ["No employer response is recorded."],
    whatRossShouldDo: "Choose whether to keep monitoring, record a response, or defer.",
    authorityRequired: "ROSS_APPROVAL",
    completionProof: "A follow-up review decision or employer response event is recorded privately.",
    allowedActions: overrides.allowedActions || [
      "CONTINUE_MONITORING",
      "RECORD_RECRUITER_RESPONSE",
      "RECORD_INTERVIEW",
      "RECORD_REJECTION",
      "RECORD_OFFER",
      "RECORD_WITHDRAWAL",
      "RECORD_CLOSED",
      "DEFER",
    ],
    communicationAllowed: false,
    operatorApprovalRequired: true,
    limitations: ["Synthetic pipeline action fixture."],
    privatePathVisible: false,
    ...overrides,
  };
}

function pipelineResultFixture(overrides = {}) {
  const submittedApplications = overrides.submittedApplications || [
    {
      applicationId: "application_ai_automation",
      company: "Example Automation",
      role: "AI Automation Product Manager",
      submittedDate: "2026-08-11",
      currentStage: overrides.currentStage || "SUBMITTED_MANUAL_EXTERNAL",
      employerResponseStatus: overrides.employerResponseStatus || "NONE_RECORDED",
      nextReviewDate: "2026-08-17",
    },
  ];
  const nextActions = overrides.nextActions || [pipelineAction()];
  return {
    schemaVersion: "staffordos.job_search.private_application_pipeline_review_audit.v1",
    workflowVersion: "J001.05B",
    generatedAt,
    loaded: {
      applications: submittedApplications.length,
      applicationEvents: overrides.applicationEventsLoaded ?? 2,
      followUpReviews: 1,
      confirmationNeeded: 0,
    },
    dailyCommand: {
      schemaVersion: "staffordos.job_search.private_daily_job_search_command.v1",
      workflowVersion: "J001.05B",
      generatedAt,
      workspaceId: "professional",
      capabilityFamily: "Career Operations",
      primaryNextAction: nextActions[0] || null,
      applicationsNeedingAttention: nextActions,
      followUpsDue: nextActions.filter((item) => item.status === "DUE"),
      interviewsOrRecruiterContact: [],
      confirmationNeeded: [],
      submittedApplications,
      recentOutcomes: overrides.recentOutcomes || [],
      evidencePositioningTasks: [],
      pipelineSummary: {
        schemaVersion: "staffordos.job_search.private_application_pipeline_summary.v1",
        generatedAt,
        workspaceId: "professional",
        capabilityFamily: "Career Operations",
        submittedApplications: submittedApplications.length,
        followUpReviewsDue: 1,
        recruiterResponses: 0,
        screenings: 0,
        interviews: submittedApplications.filter((item) => item.currentStage === "INTERVIEW").length,
        offers: submittedApplications.filter((item) => item.currentStage === "OFFER").length,
        rejections: submittedApplications.filter((item) => item.currentStage === "REJECTED_BY_EMPLOYER").length,
        closedApplications: submittedApplications.filter((item) => ["CLOSED", "WITHDRAWN"].includes(item.currentStage)).length,
        applicationsNeedingOperatorConfirmation: 0,
        conversionRatesAvailable: false,
        limitations: [],
      },
      searchHealth: {
        activeSubmittedApplications: submittedApplications.length,
        awaitingEmployerResponse: submittedApplications.filter((item) => item.employerResponseStatus === "NONE_RECORDED").length,
        followUpReviewsDue: 1,
        applicationsNeedingOperatorConfirmation: 0,
        interviewsActive: submittedApplications.filter((item) => item.currentStage === "INTERVIEW").length,
        recentOutcomes: 0,
        descriptiveSummary: "Synthetic pipeline result fixture.",
        vanityMetricGenerated: false,
        successProbabilityGenerated: false,
      },
      noEmployerSuccessProbability: true,
      privatePathVisible: false,
      limitations: ["Synthetic pipeline fixture."],
    },
    nextActions,
    decisions: [],
    generatedApplicationEvents: [],
    followUpReviewDecisions: [],
    confirmationDecisions: [],
    futureReadModel: [],
    auditSummary: {
      noApplicationSubmitted: true,
      noMessageSent: true,
      noResumeMutated: true,
      noLinkedInMutated: true,
      noExternalProviderCall: true,
      noExternalAi: true,
      noOllama: true,
      noApiCreated: true,
      noDatabaseCreated: true,
      noOsConnection: true,
      noOperatorRouteCreated: true,
      applicationHistoryAppendOnly: true,
      privatePathVisible: false,
    },
  };
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

test("empty CareerOS daily experience is action-first and disconnected", () => {
  assert.equal(EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE.title, "CareerOS");
  assert.equal(EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE.greeting, "Good morning");
  assert.equal(EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE.primaryQuestion, "What should I do next in my job search?");
  assert.equal(EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE.todaysPriorities.length, 0);
  assert.equal(EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE.resumeExports.length, 0);
  assert.equal(EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE.auditSummary.noNewPrivateDataRoute, true);
});

test("daily briefing combines existing opportunity, package, review, pipeline, and engagement outputs", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationEngagementReadModel: [engagementItem()],
    applicationPackageReadModel: [packageItem()],
    applicationReviewReadModel: [reviewItem()],
  });
  const metrics = Object.fromEntries(experience.dailyBriefing.metrics.map((item) => [item.label, item.value]));

  assert.equal(metrics["Applications needing follow-up"], 1);
  assert.equal(metrics["Ready To Apply"], 1);
  assert.equal(metrics["Resume/package reviews needed"], 1);
  assert.equal(metrics["Current Opportunities"], 3);
  assert.equal(metrics["Interview Activity"], 1);
});

test("priorities are deterministic and put follow-up or interview work before generic opportunity review", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationEngagementReadModel: [
      engagementItem({
        engagementItemId: "eng_interview",
        company: "Example Interview",
        recommendedNextEngagementAction: "PREPARE_FOR_INTERVIEW",
        responseState: "INTERVIEW_REQUEST",
      }),
      engagementItem(),
    ],
    applicationPackageReadModel: [packageItem()],
  });

  assert.equal(experience.todaysPriorities[0].action, "Prepare Interview");
  assert.equal(experience.todaysPriorities[1].action, "Follow Up");
  assert.equal(experience.todaysPriorities.some((item) => item.action === "View Resume"), true);
});

test("top opportunities expose only user-facing recommendations", () => {
  const experience = buildCareerOsDailyJobSearchExperience({ commandCenter: commandCenterFixture() });

  assert.equal(experience.topOpportunities[0].recommendation, "APPLY NOW");
  assert.equal(experience.topOpportunities[1].recommendation, "REVIEW");
  assert.doesNotMatch(JSON.stringify(experience.topOpportunities), /APPLY_NOW|READY_TO_APPLY|workflowState/);
});

test("fit band presentation maps existing qualification authority without scores", () => {
  assert.equal(daily.careerOsDailyFitBandForQualification(qualificationFixture("PLAUSIBLE_TARGET")).label, "Plausible target");
  assert.equal(daily.careerOsDailyFitBandForQualification(qualificationFixture("TRANSFERABLE_BUT_NOT_DIRECT")).label, "Transferable fit");
  assert.equal(daily.careerOsDailyFitBandForQualification(qualificationFixture("INSUFFICIENT_EVIDENCE")).label, "Insufficient evidence");
  assert.equal(daily.careerOsDailyFitBandForQualification(qualificationFixture("HARD_MISMATCH")).label, "Hard mismatch");
  assert.doesNotMatch(JSON.stringify(daily.careerOsDailyFitBandForQualification(qualificationFixture("PLAUSIBLE_TARGET"))), /%|score|probability/i);
});

test("hard mismatches and WAIT items cannot masquerade as shortlisted opportunities", () => {
  const base = recommendationResultFixture();
  const hardMismatch = recommendationReadModelRecord("rec_hard", "REVIEW", "NEEDS_EVIDENCE_REVIEW", {
    company: "Example Treasury",
    role: "Cash Manager, Treasury",
    qualification: qualificationFixture("HARD_MISMATCH"),
    shortlistedForDecision: true,
    supportingEvidenceCount: 5,
  });
  const result = {
    ...base,
    readModel: [hardMismatch, ...base.readModel],
    recommendations: [recommendationRecord(hardMismatch), ...base.recommendations],
  };
  const experience = buildCareerOsDailyJobSearchExperience({
    recommendationResult: result,
    sourceRecords: [
      sourceRecordFixture("rec_hard", { location: "San Francisco, CA", remoteState: "On-site" }),
      sourceRecordFixture("rec_apply"),
      sourceRecordFixture("rec_review", { location: "Boston, MA", remoteState: "Remote" }),
    ],
  });

  assert.equal(experience.topOpportunities.some((item) => item.id === "rec_hard"), false);
  assert.equal(experience.topOpportunities.some((item) => item.id === "rec_wait"), false);
  assert.equal(experience.topOpportunities.every((item) => item.fitBand.authority !== "HARD_MISMATCH"), true);
  assert.equal(experience.topOpportunities.every((item) => item.recommendation !== "WAIT"), true);
});

test("WAIT decision status remains visible truthfully when the item is still awaiting Ross", () => {
  const waitItem = workflowStateFixture().stateItems.find((item) => item.recommendationId === "rec_wait");
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    careerWorkflowStateItems: [{ ...waitItem, inTodaysQueue: true }],
  });
  const wait = experience.opportunityDecisions.find((item) => item.recommendationId === "rec_wait");

  assert.ok(wait);
  assert.equal(wait.recommendation, "WAIT");
  assert.equal(wait.operatorDecision, "No Ross decision yet");
  assert.equal(wait.fitBand.authority, "INSUFFICIENT_EVIDENCE");
});

test("daily decision surfaces show authoritative location when source location exists", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    recommendationResult: recommendationResultFixture(),
    careerWorkflowStateResult: workflowStateFixture(),
    sourceRecords: [
      sourceRecordFixture("rec_apply", { location: "New York, NY", remoteState: "Hybrid" }),
      sourceRecordFixture("rec_review", { location: "Boston, MA", remoteState: "Remote" }),
    ],
  });
  const decision = experience.opportunityDecisions.find((item) => item.recommendationId === "rec_apply");
  const top = experience.topOpportunities.find((item) => item.id === "rec_apply");

  assert.equal(decision.location.label, "New York, NY / Hybrid");
  assert.equal(top.location.label, "New York, NY / Hybrid");
  assert.match(decision.location.detail, /not filtered/i);
});

test("malformed gap headings are suppressed while legitimate gaps remain visible", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationIntelligenceReadModel: [
      intelligenceItem({
        humanReview: {
          ...intelligenceItem().humanReview,
          gapsAndRisks: [
            {
              kind: "Clear gap",
              requirement: "You Will",
              detail: "Section heading from a source listing.",
            },
            {
              kind: "Needs verification",
              requirement: "Direct ownership of enterprise rollout at the same scale.",
              detail: "This legitimate requirement still needs evidence review.",
            },
          ],
        },
      }),
    ],
  });
  const gaps = experience.applicationIntelligence[0].humanReview.gapsAndRisks.map((gap) => gap.requirement);

  assert.deepEqual(gaps, ["Direct ownership of enterprise rollout at the same scale."]);
});

test("Today's Priority decision navigation targets the exact opportunity without mutating workflow authority", () => {
  const workflowState = workflowStateFixture();
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    careerWorkflowStateResult: workflowState,
  });
  const priority = experience.todaysPriorities.find((item) => item.id === "opportunity-decision:rec_apply");
  const decision = experience.opportunityDecisions.find((item) => item.recommendationId === "rec_apply");

  assert.ok(priority);
  assert.ok(decision);
  assert.equal(priority.action, "Decide");
  assert.equal(priority.targetHref, `#${decision.targetId}`);
  assert.equal(priority.targetLabel, "Go to decision");
  assert.equal(workflowState.summary.workflowActionsRecorded, 0);
  assert.equal(decision.availableActions.find((action) => action.actionType === "APPLY").enabled, true);
  assert.equal(decision.availableActions.find((action) => action.actionType === "REVIEW_LATER").enabled, true);
});

test("opportunity decisions distinguish CareerOS recommendation from Ross operator decision", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    careerWorkflowStateResult: workflowStateFixture(),
  });
  const item = experience.opportunityDecisions[0];
  const metrics = Object.fromEntries(experience.dailyBriefing.metrics.map((metricItem) => [metricItem.label, metricItem.value]));

  assert.equal(metrics["Needs Decision"], 2);
  assert.equal(item.company, "Example Automation");
  assert.equal(item.role, "AI Automation Product Manager");
  assert.equal(item.recommendation, "APPLY NOW");
  assert.equal(item.operatorDecision, "No Ross decision yet");
  assert.equal(item.decisionAuthority, "Awaiting Ross decision");
  assert.equal(item.status, "NEEDS_DECISION");
  assert.equal(item.availableActions.length, 4);
  assert.equal(item.availableActions.find((action) => action.actionType === "APPLY").enabled, true);
  assert.equal(item.availableActions.find((action) => action.actionType === "REVIEW_LATER").enabled, true);
  assert.equal(item.applicationCreated, false);
  assert.equal(item.applicationSubmitted, false);
  assert.equal(item.resumeGenerated, false);
  assert.equal(item.messageSent, false);
  assert.equal(item.externalActionAvailable, false);
  assert.equal(experience.todaysPriorities[0].action, "Decide");
  assert.match(experience.todaysPriorities[0].status, /APPLY NOW/);
  assert.doesNotMatch(JSON.stringify(item), /sourceUrl|raw job|raw resume|\/Users\//i);
});

test("opportunity decisions prioritize active actionable recommendations without surfacing WAIT or SKIP as decisions", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    careerWorkflowStateResult: workflowStateFixture(),
  });

  assert.deepEqual(
    experience.opportunityDecisions.map((item) => item.recommendation),
    ["APPLY NOW", "REVIEW"],
  );
});

test("all shortlisted decision items remain reachable while priority ordering stays deterministic", () => {
  const base = recommendationResultFixture();
  const extraReadModel = Array.from({ length: 12 }, (_, index) =>
    recommendationReadModelRecord(`rec_extra_${index + 1}`, "REVIEW", "NEEDS_EVIDENCE_REVIEW", {
      company: `Example Shortlist ${index + 1}`,
      role: "Business Technology Analyst",
    }),
  );
  const expanded = {
    ...base,
    readModel: [...base.readModel, ...extraReadModel],
    recommendations: [...base.recommendations, ...extraReadModel.map((record) => recommendationRecord(record))],
  };
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    careerWorkflowStateResult: workflow.buildCareerWorkflowState({
      recommendationResult: expanded,
      workflowActions: [],
      generatedAt,
    }),
  });

  assert.equal(experience.dailyBriefing.metrics.find((item) => item.label === "Needs Decision").value, 14);
  assert.equal(experience.opportunityDecisions.length, 14);
  assert.deepEqual(
    experience.opportunityDecisions.slice(0, 4).map((item) => item.recommendation),
    ["APPLY NOW", "REVIEW", "REVIEW", "REVIEW"],
  );
  assert.equal(experience.opportunityDecisions.some((item) => item.recommendation === "WAIT"), false);
  assert.equal(experience.opportunityDecisions.some((item) => item.recommendation === "SKIP"), false);
  assert.equal(experience.opportunityDecisions.at(-1).recommendationId, "rec_extra_12");
  assert.equal(experience.opportunityDecisions.some((item) => item.recommendationId === "rec_extra_12"), true);
});

test("top opportunities remain connected when active decisions are present", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    careerWorkflowStateResult: workflowStateFixture(),
  });

  assert.equal(experience.topOpportunities.length, 2);
  assert.notEqual(experience.emptyState, "No opportunities connected");
});

test("opportunity decision actions enforce APPLY readiness without changing recommendation thresholds", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    careerWorkflowStateResult: workflowStateFixture(),
  });
  const review = experience.opportunityDecisions.find((item) => item.recommendationId === "rec_review");

  assert.equal(review.availableActions.find((action) => action.actionType === "APPLY").enabled, false);
  assert.equal(review.availableActions.find((action) => action.actionType === "REVIEW_LATER").enabled, true);
  assert.equal(review.availableActions.find((action) => action.actionType === "SKIP").enabled, true);
  assert.equal(review.availableActions.find((action) => action.actionType === "NOT_INTERESTED").enabled, true);
  assert.match(review.availableActions.find((action) => action.actionType === "APPLY").reason, /readiness permits/);
});

test("APPLY advances only to existing application preparation state and does not create an Application", () => {
  const apply = workflowAction("rec_apply", "APPLY");
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    careerWorkflowStateResult: workflowStateFixture([apply]),
  });

  assert.equal(experience.opportunityDecisions.some((item) => item.recommendationId === "rec_apply"), false);
  assert.equal(experience.applicationWork.some((item) => item.id === "workflow-ready:rec_apply"), true);
  const work = experience.applicationWork.find((item) => item.id === "workflow-ready:rec_apply");
  assert.equal(work.task, "Prepare Resume Draft");
  assert.equal(work.externalActionAvailable, false);
  assert.match(work.detail, /Prepare the existing Application Intelligence/);
  assert.equal(experience.auditSummary.noApplicationCreated, true);
  assert.equal(experience.auditSummary.noApplicationSubmitted, true);
});

test("refresh projection removes skipped and not-interested items from today's active decision queue", () => {
  const skipped = workflowAction("rec_wait", "SKIP");
  const notInterested = workflowAction("rec_skip", "NOT_INTERESTED", [skipped]);
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    careerWorkflowStateResult: workflowStateFixture([skipped, notInterested]),
  });
  const ids = experience.opportunityDecisions.map((item) => item.recommendationId);

  assert.equal(ids.includes("rec_wait"), false);
  assert.equal(ids.includes("rec_skip"), false);
  assert.equal(ids.includes("rec_apply"), true);
  assert.equal(ids.includes("rec_review"), true);
  assert.equal(experience.topOpportunities.some((item) => item.id === "rec_wait"), false);
  assert.equal(experience.topOpportunities.some((item) => item.id === "rec_skip"), false);
});

test("surface and route expose governed opportunity decision controls without external actions", () => {
  assert.match(surfaceSource, /Opportunity Decisions/);
  assert.match(surfaceSource, /CareerOS recommends; Ross decides/);
  assert.match(surfaceSource, /Apply/);
  assert.match(surfaceSource, /Review later/);
  assert.match(surfaceSource, /Skip/);
  assert.match(surfaceSource, /Not interested/);
  assert.match(surfaceSource, /workflowAction/);
  assert.match(routeSource, /decideOpportunityAction/);
  assert.match(routeSource, /runCareerWorkflowActionFromPrivateArtifacts/);
  assert.doesNotMatch(routeSource, /createApplication|submitApplication|sendMessage|fetch\(/);
});

test("application work includes package review, manual-ready, and follow-up tasks without external controls", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationEngagementReadModel: [engagementItem()],
    applicationReviewReadModel: [reviewItem({ reviewState: "PENDING_REVIEW", manualApplicationReady: false })],
  });

  assert.equal(experience.applicationWork.some((item) => item.task === "Follow Up"), true);
  assert.equal(experience.applicationWork.some((item) => item.task === "Review Package"), true);
  assert.equal(experience.applicationWork.every((item) => item.externalActionAvailable === false), true);
});

test("application intelligence packet read models are displayed without raw private data", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationIntelligenceReadModel: [intelligenceItem()],
  });
  const item = experience.applicationIntelligence[0];

  assert.equal(item.company, "Example Automation");
  assert.equal(item.nextAction, "View Resume");
  assert.equal(item.externalActionAvailable, false);
  assert.doesNotMatch(JSON.stringify(item), /\/Users\/|sourceUrl|raw job|raw resume/i);
  assert.match(surfaceSource, /Application Intelligence/);
  assert.match(surfaceSource, /View Intelligence/);
});

test("application intelligence renders human review reasons, evidence, gaps, resume readiness, and next action", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationIntelligenceReadModel: [intelligenceItem()],
  });
  const item = experience.applicationIntelligence[0];

  assert.match(item.humanReview.whyThisFits[0], /AI automation and workflow delivery/);
  assert.equal(item.humanReview.supportingExperience[0].label, "StaffordOS - AI agent orchestration and governance");
  assert.equal(item.humanReview.supportingExperience[1].supportLevel, "Supported with limitation");
  assert.equal(item.humanReview.gapsAndRisks[0].kind, "Needs verification");
  assert.match(item.humanReview.gapsAndRisks[0].detail, /evidence review/i);
  assert.equal(item.humanReview.resumeReadiness.label, "Needs review");
  assert.match(item.humanReview.resumeReadiness.blockers[0], /review/i);
  assert.match(item.humanReview.nextAction, /Review evidence/);
  assert.match(surfaceSource, /Why this fits/);
  assert.match(surfaceSource, /Supporting experience/);
  assert.match(surfaceSource, /Gaps \/ uncertainty/);
  assert.match(surfaceSource, /Resume readiness/);
  assert.match(surfaceSource, /Next action/);
});

test("opportunity decisions reuse application intelligence without changing recommendation or Ross decision", () => {
  const state = workflowStateFixture();
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    careerWorkflowStateResult: state,
    applicationIntelligenceReadModel: [intelligenceItem({
      recommendation: "APPLY_NOW",
      fitRecommendation: "APPLY_WITH_POSITIONING",
    })],
  });
  const decision = experience.opportunityDecisions.find((item) => item.recommendationId === "rec_apply");

  assert.ok(decision);
  assert.equal(decision.recommendation, "APPLY NOW");
  assert.equal(decision.operatorDecision, "No Ross decision yet");
  assert.equal(decision.status, "NEEDS_DECISION");
  assert.equal(decision.applicationCreated, false);
  assert.equal(decision.applicationSubmitted, false);
  assert.equal(decision.resumeGenerated, false);
  assert.equal(decision.humanReview.supportingExperience[0].label, "StaffordOS - AI agent orchestration and governance");
  assert.equal(decision.availableActions.find((action) => action.actionType === "APPLY").enabled, true);
  assert.equal(decision.availableActions.find((action) => action.actionType === "SKIP").enabled, true);
});

test("human review display excludes internal authority terms and does not present unsupported claims as evidence", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationIntelligenceReadModel: [intelligenceItem({
      humanReview: {
        whyThisFits: ["The role asks for workflow automation. Verified StaffordOS work supports this positioning."],
        supportingExperience: [
          {
            label: "Navy Federal - stakeholder and requirements work",
            detail: "Supported business requirements, stakeholder coordination, and marketing operations delivery.",
            supportLevel: "Verified",
            limitations: [],
          },
        ],
        gapsAndRisks: [
          {
            kind: "Clear gap",
            requirement: "Direct ownership of a public enterprise admin platform at Airtable scale.",
            detail: "No verified support is currently mapped. This is not proof Ross lacks it.",
          },
          {
            kind: "Uncertain",
            requirement: "Exact title chronology for a related leadership claim.",
            detail: "Some related experience may exist, but the current evidence is not clear enough to use confidently.",
          },
        ],
        resumeReadiness: {
          label: "Blocked",
          detail: "CareerOS should not use this resume for the opportunity until Ross resolves the listed issue.",
          blockers: ["Unsupported metric remains blocked."],
        },
        nextAction: "Review the evidence and resume wording before using this opportunity.",
      },
    })],
  });
  const review = experience.applicationIntelligence[0].humanReview;
  const serialized = JSON.stringify(review);

  assert.equal(review.supportingExperience.some((item) => /unsupported/i.test(`${item.label} ${item.detail}`)), false);
  assert.equal(review.gapsAndRisks.some((item) => item.kind === "Clear gap"), true);
  assert.equal(review.gapsAndRisks.some((item) => item.kind === "Uncertain"), true);
  assert.equal(review.resumeReadiness.label, "Blocked");
  assert.doesNotMatch(serialized, /CareerFact|CareerEvidence|ApplicationArtifactVersion|packet ID|ResumeVersion|authority digest|career_fact|career_evidence|\/Users\//);
});

test("truth-bound resume draft review models display human-readable content without source IDs", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    resumeDraftReviewReadModel: [resumeDraftReviewItem()],
  });
  const item = experience.resumeDrafts[0];

  assert.equal(item.company, "Example Automation");
  assert.equal(item.nextAction, "Review Draft");
  assert.equal(item.approvalAllowed, true);
  assert.equal(item.requestChangesAllowed, true);
  assert.equal(item.rejectAllowed, true);
  assert.match(item.sections.summary[0], /AI automation workflows/);
  assert.equal(item.sections.experience[0].employer, "Example Systems");
  assert.equal(item.needsAttention.some((attention) => /unsupported claims omitted/i.test(attention)), true);
  assert.equal(item.externalActionAvailable, false);
  assert.equal(item.humanReviewRequired, true);
  assert.doesNotMatch(JSON.stringify(item), /career_fact|career_evidence|draftText|claim_|\/Users\//i);
  assert.match(surfaceSource, /Resume Drafts/);
  assert.match(surfaceSource, /Review Draft/);
  assert.match(surfaceSource, /View Resume Draft/);
  assert.match(surfaceSource, /Professional Summary/);
  assert.match(surfaceSource, /Core Skills \/ Technologies/);
  assert.match(surfaceSource, /Professional Experience/);
  assert.match(surfaceSource, /Needs Attention/);
  assert.match(surfaceSource, /Approve for Export/);
  assert.match(surfaceSource, /Request Changes/);
  assert.match(surfaceSource, /Reject/);
  assert.match(surfaceSource, /APPROVE_FOR_EXPORT/);
  assert.match(surfaceSource, /REQUEST_CHANGES/);
  assert.match(surfaceSource, /REJECT/);
  assert.match(surfaceSource, /Resume draft ready/);
  assert.match(routeSource, /reviewDecisionFromForm/);
  assert.match(routeSource, /RESUME_DRAFT_EXPORT_REVIEW_DECISIONS/);
  assert.match(routeSource, /resumeDraftFocusId/);
  assert.match(routeSource, /resumeDraftError/);
  assert.match(routeSource, /applicationIntelligencePacketId === packetId/);
  assert.match(routeSource, /resume-draft-/);
});

test("every generated resume draft remains reachable after refresh projection", () => {
  const second = resumeDraftReviewItem({
    artifactVersionId: "artifact_resume_draft_second",
    packetId: "packet_review",
    company: "Anthropic",
    role: "Business Systems Analyst",
  });
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    resumeDraftReviewReadModel: [resumeDraftReviewItem(), second],
  });

  assert.equal(experience.resumeDrafts.length, 2);
  assert.deepEqual(experience.resumeDrafts.map((item) => item.id), [
    "artifact_resume_draft",
    "artifact_resume_draft_second",
  ]);
});

test("unsafe draft review models block approval while preserving request and reject controls", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    resumeDraftReviewReadModel: [
      resumeDraftReviewItem({
        safetyState: "DRAFT_NEEDS_EVIDENCE_REVIEW",
        reviewStatus: "NEEDS_EVIDENCE_REVIEW",
        approvalAllowed: false,
        blockedIssueCount: 1,
        reviewIssueCount: 1,
        nextAction: "REVIEW_EVIDENCE",
      }),
    ],
  });
  const item = experience.resumeDrafts[0];

  assert.equal(item.approvalAllowed, false);
  assert.equal(item.requestChangesAllowed, true);
  assert.equal(item.rejectAllowed, true);
  assert.equal(item.nextAction, "Review Evidence");
});

test("reviewed resume export read models expose DOCX download without private content", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    resumeExportReadModel: [resumeExportItem()],
  });
  const item = experience.resumeExports[0];

  assert.equal(item.company, "Example Automation");
  assert.equal(item.nextAction, "Download DOCX");
  assert.equal(item.docxCreated, true);
  assert.equal(item.submissionStatus, "NOT_SUBMITTED");
  assert.equal(item.externalActionAvailable, false);
  assert.equal(item.privatePathVisible, false);
  assert.equal(experience.todaysPriorities.some((priority) => priority.action === "Download DOCX"), true);
  assert.doesNotMatch(JSON.stringify(item), /career_fact|career_evidence|draftText|\/Users\//i);
  assert.match(surfaceSource, /Resume Files/);
  assert.match(surfaceSource, /Download DOCX/);
  assert.match(routeSource, /runReviewedResumeDraftExportFromPrivateArtifacts/);
  assert.match(exportRouteSource, /readLatestDocxExport/);
});

test("manual submission read model marks exact exported resume artifact as submitted", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    resumeExportReadModel: [resumeExportItem()],
    manualSubmissionReadModel: [manualSubmissionItem()],
  });
  const item = experience.resumeExports[0];

  assert.equal(item.submissionStatus, "SUBMITTED");
  assert.equal(item.submittedDate, "2026-08-11");
  assert.equal(item.applicationId, "application_ai_automation");
  assert.equal(item.exactResumeArtifactKnown, true);
  assert.equal(item.nextAction, "No Action");
  assert.equal(experience.todaysPriorities.some((priority) => priority.action === "Download DOCX"), false);
  assert.equal(experience.applicationWork.some((work) => work.id === "submission:application_ai_automation"), true);
  assert.match(surfaceSource, /Mark as Submitted/);
  assert.match(routeSource, /runManualSubmissionRecordAndArtifactLinkageFromPrivateArtifacts/);
});

test("application outcome section renders submitted application state with artifact linkage and follow-up controls", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationPipelineResult: pipelineResultFixture(),
    applicationEngagementReadModel: [engagementItem({
      applicationId: "application_ai_automation",
      engagementItemId: "eng_ai_automation",
      company: "Example Automation",
      role: "AI Automation Product Manager",
      followUpState: "DUE",
      responseState: "NO_RESPONSE",
      recommendedNextEngagementAction: "FOLLOW_UP",
      lastApplicationEventType: "SUBMITTED_MANUAL_EXTERNAL",
    })],
    manualSubmissionReadModel: [manualSubmissionItem({ followUpState: "DUE", nextAction: "FOLLOW_UP" })],
  });
  const item = experience.applicationOutcomes[0];

  assert.equal(item.company, "Example Automation");
  assert.equal(item.role, "AI Automation Product Manager");
  assert.equal(item.submittedDate, "2026-08-11");
  assert.equal(item.exactResumeArtifactKnown, true);
  assert.match(item.resumeArtifact, /Ross_Stafford_Example_Automation/);
  assert.equal(item.followUpState, "DUE");
  assert.equal(item.nextAction, "Follow Up");
  assert.equal(item.availableActions.some((action) => action.decisionType === "RECORD_RECRUITER_RESPONSE"), true);
  assert.equal(item.availableActions.some((action) => action.decisionType === "RECORD_REJECTION"), true);
  assert.equal(item.availableActions.every((action) => action.requiresExplicitConfirmation), true);
  assert.equal(item.noRejectionInferred, true);
  assert.equal(item.externalActionAvailable, false);
  assert.equal(item.messageSent, false);
  assert.equal(item.applicationSubmittedByStaffordOS, false);
  assert.doesNotMatch(JSON.stringify(item), /\/Users\/|sourceDigest|sourceUrl|raw resume|raw job/i);
  assert.match(surfaceSource, /Follow-Up & Outcomes/);
  assert.match(surfaceSource, /Silence is not a rejection/);
  assert.deepEqual(
    item.availableActions.map((action) => action.label),
    [
      "Record response",
      "Record interview",
      "Record rejection",
      "Record offer",
      "Close / withdraw",
      "Close application",
    ],
  );
  assert.match(surfaceSource, /I confirm this happened outside CareerOS/);
  assert.match(routeSource, /recordApplicationOutcomeAction/);
  assert.match(routeSource, /runApplicationOutcomeDecisionFromPrivateArtifacts/);
});

test("UNKNOWN artifact linkage remains unknown in application outcome display", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationPipelineResult: pipelineResultFixture(),
    applicationEngagementReadModel: [engagementItem({ applicationId: "application_ai_automation" })],
    manualSubmissionReadModel: [],
  });
  const item = experience.applicationOutcomes[0];

  assert.equal(item.resumeArtifact, "UNKNOWN");
  assert.equal(item.exactResumeArtifactKnown, false);
  assert.equal(item.unknowns.some((unknown) => /artifact linkage/i.test(unknown)), true);
});

test("application outcome display distinguishes silence from rejection", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationPipelineResult: pipelineResultFixture(),
    applicationEngagementReadModel: [engagementItem({
      applicationId: "application_ai_automation",
      responseState: "NO_RESPONSE",
      followUpState: "OVERDUE",
      recommendedNextEngagementAction: "FOLLOW_UP",
    })],
    manualSubmissionReadModel: [manualSubmissionItem({ nextAction: "FOLLOW_UP", followUpState: "OVERDUE" })],
  });
  const item = experience.applicationOutcomes[0];

  assert.equal(item.employerResponseStatus, "NONE_RECORDED");
  assert.equal(item.latestOutcome, "SUBMITTED_MANUAL_EXTERNAL");
  assert.equal(item.noRejectionInferred, true);
  assert.notEqual(item.currentStage, "REJECTED_BY_EMPLOYER");
  assert.notEqual(item.employerResponseStatus, "REJECTED");
  assert.equal(experience.applicationPipeline.find((stage) => stage.id === "closed").value, 0);
});

test("pipeline application outcomes update daily priorities for interviews and closed outcomes", () => {
  const interviewPipeline = pipelineResultFixture({
    currentStage: "INTERVIEW",
    employerResponseStatus: "INTERVIEW_REQUESTED",
    nextActions: [pipelineAction({
      priorityTier: 1,
      currentStage: "INTERVIEW",
      employerResponseStatus: "INTERVIEW_REQUESTED",
      allowedActions: ["PREPARE_INTERVIEW_EVIDENCE", "RECORD_INTERVIEW", "RECORD_REJECTION", "DEFER"],
    })],
  });
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationPipelineResult: interviewPipeline,
    applicationEngagementReadModel: [engagementItem({
      applicationId: "application_ai_automation",
      currentApplicationStatus: "SUBMITTED_MANUAL_EXTERNAL",
      responseState: "INTERVIEW_REQUEST",
      followUpState: "COMPLETED",
      recommendedNextEngagementAction: "PREPARE_FOR_INTERVIEW",
    })],
    manualSubmissionReadModel: [manualSubmissionItem()],
  });

  assert.equal(experience.applicationOutcomes[0].nextAction, "Prepare Interview");
  assert.equal(experience.applicationOutcomes[0].availableActions.some((action) => action.decisionType === "RECORD_INTERVIEW"), true);
  assert.equal(experience.todaysPriorities[0].action, "Prepare Interview");
  assert.equal(experience.applicationPipeline.find((stage) => stage.id === "interview").value, 1);
});

test("private loader reads latest governed artifacts and degrades when optional outputs are absent", () => {
  const privateRoot = mkdtempSync(path.join(tmpdir(), "careeros-v1-private-"));
  const jobSearchRoot = path.join(privateRoot, "job-search");
  writeJson(path.join(jobSearchRoot, "application-pipeline-review", "run_20260809", "daily_job_search_command.json"), {
    schemaVersion: "staffordos.job_search.private_daily_job_search_command.v1",
    workflowVersion: "J001.05B",
    generatedAt: "2026-08-09T12:00:00.000Z",
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    primaryNextAction: null,
    applicationsNeedingAttention: [],
    followUpsDue: [],
    interviewsOrRecruiterContact: [],
    confirmationNeeded: [],
    submittedApplications: [],
    recentOutcomes: [],
    evidencePositioningTasks: [],
    pipelineSummary: {
      schemaVersion: "staffordos.job_search.private_application_pipeline_summary.v1",
      generatedAt: "2026-08-09T12:00:00.000Z",
      workspaceId: "professional",
      capabilityFamily: "Career Operations",
      submittedApplications: 2,
      followUpReviewsDue: 0,
      recruiterResponses: 0,
      screenings: 0,
      interviews: 0,
      offers: 0,
      rejections: 0,
      closedApplications: 0,
      applicationsNeedingOperatorConfirmation: 0,
      conversionRatesAvailable: false,
      limitations: [],
    },
    searchHealth: {
      activeSubmittedApplications: 2,
      awaitingEmployerResponse: 2,
      followUpReviewsDue: 0,
      applicationsNeedingOperatorConfirmation: 0,
      interviewsActive: 0,
      recentOutcomes: 0,
      descriptiveSummary: "Synthetic private pipeline fixture.",
      vanityMetricGenerated: false,
      successProbabilityGenerated: false,
    },
    noEmployerSuccessProbability: true,
    privatePathVisible: false,
    limitations: [],
  });
  writeJson(path.join(jobSearchRoot, "career-engagement", "run_20260809", "application_engagement_read_model.json"), [
    engagementItem(),
  ]);

  const result = loader.loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts({ jobSearchRoot });

  assert.equal(result.loadedArtifacts.applicationPipeline, true);
  assert.equal(result.loadedArtifacts.applicationEngagement, true);
  assert.equal(result.loadedArtifacts.manualSubmissionArtifactLinks, false);
  assert.equal(result.loadedArtifacts.opportunityRecommendations, false);
  assert.equal(result.experience.applicationPipeline.find((item) => item.id === "applied").value, 2);
  assert.equal(result.experience.todaysPriorities[0].action, "Follow Up");
  assert.equal(result.auditSummary.noProviderCalled, true);
  assert.equal(result.auditSummary.noNewPrivateDataRoute, true);
});

test("private loader projects persisted Career workflow actions into today's command view", () => {
  const privateRoot = mkdtempSync(path.join(tmpdir(), "careeros-v107-workflow-"));
  const jobSearchRoot = path.join(privateRoot, "job-search");
  const result = recommendationResultFixture();
  const action = workflowAction("rec_review", "REVIEW_LATER");
  writeJson(
    path.join(jobSearchRoot, "opportunity-recommendations", "run_20260809", "future_read_model.json"),
    result.readModel,
  );
  writeJson(
    path.join(jobSearchRoot, "opportunity-recommendations", "run_20260809", "opportunity_recommendations.json"),
    result.recommendations,
  );
  mkdirSync(path.join(jobSearchRoot, "career-workflow-actions"), { recursive: true });
  writeFileSync(
    path.join(jobSearchRoot, "career-workflow-actions", "workflow_actions.ndjson"),
    `${JSON.stringify(action)}\n`,
    { encoding: "utf8", mode: 0o600 },
  );

  const loaded = loader.loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts({ jobSearchRoot });

  assert.equal(loaded.loadedArtifacts.opportunityRecommendations, true);
  assert.equal(loaded.loadedArtifacts.careerWorkflowState, true);
  assert.equal(loaded.experience.opportunityDecisions.some((item) => item.recommendationId === "rec_review"), false);
  assert.equal(loaded.experience.opportunityDecisions.some((item) => item.recommendationId === "rec_apply"), true);
  assert.equal(loaded.experience.dailyBriefing.metrics.find((item) => item.label === "Needs Decision").value, 1);
  assert.equal(loaded.auditSummary.noProviderCalled, true);
  assert.equal(loaded.auditSummary.noApplicationCreated, true);
  assert.equal(loaded.auditSummary.noApplicationSubmitted, true);
});

test("private loader overlays manual submission artifact links when available", () => {
  const privateRoot = mkdtempSync(path.join(tmpdir(), "careeros-v1-submitted-"));
  const jobSearchRoot = path.join(privateRoot, "job-search");
  writeJson(
    path.join(jobSearchRoot, "application-artifact-exports", "run_20260811", "resume_export_read_model.json"),
    [resumeExportItem()],
  );
  writeJson(
    path.join(jobSearchRoot, "applications", "careeros-v1-04-submissions", "run_20260811", "manual_submission_read_model.json"),
    [manualSubmissionItem()],
  );

  const result = loader.loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts({ jobSearchRoot });

  assert.equal(result.loadedArtifacts.reviewedResumeDraftExports, true);
  assert.equal(result.loadedArtifacts.manualSubmissionArtifactLinks, true);
  assert.equal(result.experience.resumeExports[0].submissionStatus, "SUBMITTED");
  assert.equal(result.experience.resumeExports[0].exactResumeArtifactKnown, true);
  assert.equal(result.auditSummary.noApplicationSubmitted, true);
});

test("private loader projects persisted outcome events into application outcomes after reload", () => {
  const privateRoot = mkdtempSync(path.join(tmpdir(), "careeros-v108-loader-"));
  const jobSearchRoot = path.join(privateRoot, "job-search");
  writeJson(path.join(jobSearchRoot, "application-pipeline-review", "run_20260812", "daily_job_search_command.json"), {
    schemaVersion: "staffordos.job_search.private_daily_job_search_command.v1",
    workflowVersion: "J001.05B",
    generatedAt: "2026-08-12T12:00:00.000Z",
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    primaryNextAction: pipelineAction({ actionId: "pipe_action_interview", currentStage: "INTERVIEW" }),
    applicationsNeedingAttention: [pipelineAction({ actionId: "pipe_action_interview", currentStage: "INTERVIEW" })],
    followUpsDue: [],
    interviewsOrRecruiterContact: [pipelineAction({ actionId: "pipe_action_interview", currentStage: "INTERVIEW" })],
    confirmationNeeded: [],
    submittedApplications: [
      {
        applicationId: "application_ai_automation",
        company: "Example Automation",
        role: "AI Automation Product Manager",
        submittedDate: "2026-08-11",
        currentStage: "INTERVIEW",
        employerResponseStatus: "INTERVIEW_REQUESTED",
        nextReviewDate: "2026-08-17",
      },
    ],
    recentOutcomes: [
      {
        eventId: "event_interview",
        applicationId: "application_ai_automation",
        eventType: "INTERVIEW_SCHEDULED",
        occurredAt: "2026-08-12",
      },
    ],
    evidencePositioningTasks: [],
    pipelineSummary: {
      schemaVersion: "staffordos.job_search.private_application_pipeline_summary.v1",
      generatedAt: "2026-08-12T12:00:00.000Z",
      workspaceId: "professional",
      capabilityFamily: "Career Operations",
      submittedApplications: 1,
      followUpReviewsDue: 0,
      recruiterResponses: 0,
      screenings: 0,
      interviews: 1,
      offers: 0,
      rejections: 0,
      closedApplications: 0,
      applicationsNeedingOperatorConfirmation: 0,
      conversionRatesAvailable: false,
      limitations: [],
    },
    searchHealth: {
      activeSubmittedApplications: 1,
      awaitingEmployerResponse: 0,
      followUpReviewsDue: 0,
      applicationsNeedingOperatorConfirmation: 0,
      interviewsActive: 1,
      recentOutcomes: 1,
      descriptiveSummary: "Synthetic interview outcome fixture.",
      vanityMetricGenerated: false,
      successProbabilityGenerated: false,
    },
    noEmployerSuccessProbability: true,
    privatePathVisible: false,
    limitations: [],
  });
  writeJson(path.join(jobSearchRoot, "application-pipeline-review", "run_20260812", "next_actions.json"), [
    pipelineAction({ actionId: "pipe_action_interview", currentStage: "INTERVIEW", allowedActions: ["RECORD_INTERVIEW", "DEFER"] }),
  ]);
  writeJson(path.join(jobSearchRoot, "career-engagement", "run_20260812", "application_engagement_read_model.json"), [
    engagementItem({
      applicationId: "application_ai_automation",
      responseState: "INTERVIEW_REQUEST",
      recommendedNextEngagementAction: "PREPARE_FOR_INTERVIEW",
      lastApplicationEventType: "INTERVIEW_SCHEDULED",
    }),
  ]);
  writeJson(
    path.join(jobSearchRoot, "applications", "careeros-v1-04-submissions", "run_20260812", "manual_submission_read_model.json"),
    [manualSubmissionItem()],
  );

  const result = loader.loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts({ jobSearchRoot });

  assert.equal(result.loadedArtifacts.applicationPipeline, true);
  assert.equal(result.loadedArtifacts.applicationEngagement, true);
  assert.equal(result.experience.applicationOutcomes[0].currentStage, "INTERVIEW");
  assert.equal(result.experience.applicationOutcomes[0].latestOutcome, "INTERVIEW_SCHEDULED");
  assert.equal(result.experience.applicationOutcomes[0].nextAction, "Prepare Interview");
  assert.equal(result.experience.applicationOutcomes[0].availableActions[0].decisionType, "RECORD_INTERVIEW");
  assert.equal(result.experience.applicationPipeline.find((item) => item.id === "interview").value, 1);
});

test("private loader refreshes outcome actions from canonical application records without CLI snapshots", () => {
  const privateRoot = mkdtempSync(path.join(tmpdir(), "careeros-v108-live-pipeline-"));
  const jobSearchRoot = path.join(privateRoot, "job-search");
  const applicationId = "application_live_submitted";
  writeJson(path.join(jobSearchRoot, "applications", "applications.json"), [
    {
      schemaVersion: "staffordos.job_search.private_application.v1",
      applicationId,
      workspaceId: "professional",
      capabilityFamily: "Career Operations",
      opportunityId: "opp_live",
      analysisRunId: "analysis_live",
      companyReference: { label: "Example Applied", requisitionAlias: "REQ-LIVE" },
      roleReference: { title: "AI Product Lead" },
      status: "SUBMITTED_MANUAL_EXTERNAL",
      submissionMethod: "MANUAL_EXTERNAL",
      submissionChannel: "Synthetic careers portal",
      submittedAt: "2026-08-03",
      submittedAtPrecision: "DATE",
      operatorConfirmed: true,
      resumeReference: {
        resumeReferenceId: "resume_unknown",
        applicationId,
        status: "UNKNOWN",
        filename: null,
        assetReferenceId: null,
        version: null,
        createdAt: null,
        purpose: "Synthetic fixture.",
        authority: "UNKNOWN",
        privacy: "Professional owner-private",
        limitations: ["Synthetic fixture."],
        resumeIsCanonicalCareerTruth: false,
      },
      coverLetterReference: {
        coverLetterReferenceId: "cover_unknown",
        applicationId,
        status: "UNKNOWN",
        filename: null,
        authority: "UNKNOWN",
        privacy: "Professional owner-private",
        limitations: ["Synthetic fixture."],
      },
      employerResponseStatus: "NONE_RECORDED",
      currentStage: "SUBMITTED_MANUAL_EXTERNAL",
      nextAction: {
        nextActionId: "next_live",
        applicationId,
        confirmationRecordId: null,
        what: "Monitor application.",
        whyNow: "Synthetic fixture.",
        when: "2026-08-17",
        proofOfCompletion: "Synthetic proof.",
        authorityRequired: "ROSS_APPROVAL",
        limitations: ["Synthetic fixture."],
      },
      nextReviewAt: "2026-08-17",
      sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL",
      privacy: "Professional owner-private",
      duplicateStatus: "NO_DUPLICATE",
      limitations: ["Synthetic fixture."],
      createdAt: "2026-08-03T12:00:00.000Z",
      updatedAt: "2026-08-03T12:00:00.000Z",
      submittedByStaffordOS: false,
      applicationSubmittedByThisWorkflow: false,
      noEmployerInterestInferred: true,
      noFitInferred: true,
      testOnly: true,
    },
  ]);

  const result = loader.loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts({ jobSearchRoot });
  const outcome = result.experience.applicationOutcomes[0];

  assert.equal(result.loadedArtifacts.applicationPipeline, true);
  assert.equal(outcome.applicationId, applicationId);
  assert.equal(outcome.currentStage, "SUBMITTED_MANUAL_EXTERNAL");
  assert.equal(outcome.followUpState, "UNKNOWN");
  assert.equal(outcome.noRejectionInferred, true);
  assert.deepEqual(
    outcome.availableActions.map((action) => action.decisionType),
    [
      "RECORD_RECRUITER_RESPONSE",
      "RECORD_SCREENING",
      "RECORD_INTERVIEW",
      "RECORD_REJECTION",
      "RECORD_OFFER",
      "RECORD_WITHDRAWAL",
      "RECORD_CLOSED",
    ],
  );
  assert.equal(result.auditSummary.noProviderCalled, true);
  assert.equal(result.auditSummary.noApplicationSubmitted, true);
});

test("private loader projects owner-private resume draft artifacts into reviewable UI content", () => {
  const privateRoot = mkdtempSync(path.join(tmpdir(), "careeros-v1-draft-review-"));
  const jobSearchRoot = path.join(privateRoot, "job-search");
  writeJson(
    path.join(jobSearchRoot, "application-artifacts", "run_20260811", "application_artifact_versions.json"),
    [
      {
        schemaVersion: "staffordos.careeros.application_artifact_version.v1",
        workflowVersion: "CAREEROS_APPLICATION_INTELLIGENCE_V1_03",
        artifactVersionId: "artifact_resume_draft",
        artifactType: "RESUME",
        version: 1,
        createdAt: "2026-08-11T12:00:00.000Z",
        workspaceId: "professional",
        applicationIntelligencePacketId: "packet_apply",
        jobOpportunityId: "opp_apply",
        company: "Example Automation",
        role: "AI Automation Product Manager",
        sourceCareerAuthorityDigest: "sha256:career",
        sourcePacketDigest: "sha256:packet",
        draftContentDigest: "sha256:draft",
        generationMethod: {
          method: "DETERMINISTIC_TRUTH_BOUND_ASSEMBLER",
          modelUsed: false,
          modelProvider: null,
          modelName: null,
          instructionVersion: null,
          externalAiUsed: false,
          ollamaUsed: false,
          limitations: [],
        },
        draft: resumeDraftReviewItem().sections,
        claimTraceability: [
          {
            claimId: "claim_summary",
            section: "summary",
            draftText: "Builds AI automation workflows using verified APIs and structured governance.",
            disposition: "SUPPORTED",
            packetRequirementIds: ["requirement_ai"],
            careerFactIds: ["career_fact_ai"],
            careerEvidenceIds: ["career_evidence_ai"],
            sourcePacketId: "packet_apply",
            generatedFrom: "CAREERFACT_STATEMENT",
            limitations: [],
          },
        ],
        validationIssues: [],
        omittedUnsupportedClaimCount: 0,
        safetyState: "DRAFT_READY_FOR_REVIEW",
        operatorApprovalState: "PENDING_REVIEW",
        humanReviewRequired: true,
        supersedesArtifactVersionId: null,
        supersededByArtifactVersionId: null,
        fileReferences: [],
        privacy: "Professional owner-private",
        applicationCreated: false,
        applicationSubmitted: false,
        resumeExported: false,
        resumeUploaded: false,
        coverLetterGenerated: false,
        messageSent: false,
        browserAutomationUsed: false,
        externalProviderCall: false,
        externalAiUsed: false,
        ollamaUsed: false,
        privatePathVisible: false,
        rawCareerEvidenceVisibleInReadModel: false,
        limitations: [],
      },
    ],
  );
  writeJson(
    path.join(jobSearchRoot, "application-artifacts", "run_20260811", "resume_draft_read_model.json"),
    [resumeDraftItem()],
  );

  const result = loader.loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts({ jobSearchRoot });

  assert.equal(result.loadedArtifacts.truthBoundResumeDrafts, true);
  assert.equal(result.experience.resumeDrafts[0].sections.summary[0], resumeDraftReviewItem().sections.summary[0]);
  assert.equal(result.experience.resumeDrafts[0].approvalAllowed, true);
  assert.doesNotMatch(JSON.stringify(result.experience.resumeDrafts[0]), /career_fact_ai|career_evidence_ai|\/Users\//i);
  assert.equal(result.auditSummary.noNewPrivateDataRoute, true);
});

test("private loader connects redacted Greenhouse discovery status without provider calls", () => {
  const privateRoot = mkdtempSync(path.join(tmpdir(), "careeros-v1-greenhouse-"));
  const jobSearchRoot = path.join(privateRoot, "job-search");
  const discoveryRoot = path.join(jobSearchRoot, "greenhouse-discovery", "J002_02B_20260809");
  writeJson(path.join(discoveryRoot, "greenhouse_provider_manifest_snapshot.json"), {
    schemaVersion: "staffordos.job_search.greenhouse_provider_manifest.v1",
    sourceCount: 2,
    enabledGreenhouseSources: 2,
    limitations: ["Synthetic private discovery fixture."],
  });
  writeJson(path.join(discoveryRoot, "greenhouse_retrievals.json"), [
    {
      retrievalId: "retrieval_one",
      company: "Example",
      provider: "greenhouse",
      boardToken: "example",
      endpoint: "https://boards-api.greenhouse.io/v1/boards/example/jobs?content=true",
      retrievedAt: "2026-08-09T12:00:00.000Z",
      status: "RETRIEVED",
      httpStatus: 200,
      jobCount: 3,
      jobs: [],
      limitations: [],
      noAuthentication: true,
      noCookies: true,
      noBrowserAutomation: true,
      noScraping: true,
    },
    {
      retrievalId: "retrieval_two",
      company: "Example Two",
      provider: "greenhouse",
      boardToken: "exampletwo",
      endpoint: "https://boards-api.greenhouse.io/v1/boards/exampletwo/jobs?content=true",
      retrievedAt: "2026-08-09T12:00:00.000Z",
      status: "RETRIEVED",
      httpStatus: 200,
      jobCount: 2,
      jobs: [],
      limitations: [],
      noAuthentication: true,
      noCookies: true,
      noBrowserAutomation: true,
      noScraping: true,
    },
  ]);
  writeJson(path.join(discoveryRoot, "eligibility_reviews.json"), [
    { status: "ELIGIBLE" },
    { status: "REJECTED" },
    { status: "ELIGIBLE" },
  ]);
  writeJson(path.join(discoveryRoot, "job_source_import_queue_result.json"), {
    generatedAt: "2026-08-09T12:00:00.000Z",
    normalizedSourceRecords: [],
    sourceSnapshots: [],
    importQueue: [{ queueItemId: "queue_one" }, { queueItemId: "queue_two" }],
    prioritization: { workflowVersion: "J002.01" },
    providerCapabilityMatrix: [],
    summary: {
      normalizedRecords: 2,
      queueItems: 2,
      readyForOpportunityImport: 1,
      needsOperatorReview: 1,
      duplicateItems: 0,
      existingApplicationItems: 0,
      invalidItems: 0,
      importedOpportunities: 0,
      externalProviderCalls: 0,
      authenticatedSourcesRejected: 0,
    },
  });
  writeJson(path.join(discoveryRoot, "opportunity_queue.json"), [
    { queueItemId: "queue_one" },
    { queueItemId: "queue_two" },
  ]);
  writeJson(path.join(discoveryRoot, "explainable_fit_artifacts.json"), []);
  writeJson(path.join(discoveryRoot, "greenhouse_discovery_audit.json"), {
    publicGreenhouseApiOnly: true,
    noAuthentication: true,
    noCookies: true,
    noBrowserAutomation: true,
    noScraping: true,
    noApplicationSubmitted: true,
    noApplicationCreated: true,
    noResumeGenerated: true,
    noCoverLetterGenerated: true,
    noMessageSent: true,
    noExternalAi: true,
    noOllama: true,
    noLinkedIn: true,
    noWorkday: true,
    noLever: true,
    noAshby: true,
    noDeployment: true,
    noPush: true,
  });

  const result = loader.loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts({ jobSearchRoot });

  assert.equal(result.loadedArtifacts.greenhouseDiscovery, true);
  assert.equal(result.experience.systemHealth.providerStatus, "Greenhouse: GREENHOUSE_DISCOVERY_RUN_AVAILABLE");
  assert.equal(result.experience.systemHealth.lastDiscoveryRun, "2026-08-09T12:00:00.000Z");
  assert.equal(result.experience.systemHealth.openOpportunityBacklog, 2);
  assert.equal(result.auditSummary.noProviderCalled, true);
});

test("surface and route expose the V1 daily experience without internal architecture language", () => {
  assert.match(routeSource, /loadCareerOsDailyJobSearchExperienceFromPrivateArtifacts/);
  assert.match(routeSource, /force-dynamic/);
  assert.match(surfaceSource, /Today&#39;s Brief|Today's Brief/);
  assert.doesNotMatch(surfaceSource, /J00[1-9]|Recommendation engine|Queue implementation|Read model|Source snapshot|Authority contract/);
});

test("implementation has no external action, generation, provider call, AI, or API route", () => {
  assert.doesNotMatch(implementationSource, /fetch\(|XMLHttpRequest|method:\s*["']POST|\/api\//);
  assert.doesNotMatch(implementationSource, /submitApplication|applyToJob|sendRecruiter|sendMessage|mailto:/);
  assert.doesNotMatch(implementationSource, /generateResume|generateCover|mutateResume|writeResume|playwright|puppeteer|selenium|browserControl/);
  assert.doesNotMatch(implementationSource, /from\s+["']openai|from\s+["']@anthropic|OLLAMA_HOST|runOllama/i);
});

test("presentation output hides private paths, raw job text, and raw resume text", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    applicationEngagementReadModel: [engagementItem()],
  });
  const privatePathPattern = new RegExp(
    [String.raw`\/` + "Users" + String.raw`\/`, "staffordos-" + "private" + "-intake", "raw job", "raw resume"].join("|"),
    "i",
  );

  assert.doesNotMatch(JSON.stringify(experience), privatePathPattern);
  assert.equal(experience.auditSummary.privatePathVisible, false);
  assert.equal(experience.auditSummary.rawJobTextVisible, false);
  assert.equal(experience.auditSummary.rawResumeTextVisible, false);
});
