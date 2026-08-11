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
const surfacePath = path.join(root, "staffordos/ui/operator-frontend/components/staffordos/JobCommandSurface.tsx");
const routePath = path.join(root, "staffordos/ui/operator-frontend/app/os/professional/jobs/page.tsx");
const manualSubmissionPath = path.join(
  root,
  "staffordos/ui/operator-frontend/lib/staffordos/manualSubmissionRecordAndArtifactLinkage.ts",
);
const exportRoutePath = path.join(
  root,
  "staffordos/ui/operator-frontend/app/os/professional/jobs/artifacts/[artifactVersionId]/docx/route.ts",
);
const requireFromFrontend = createRequire(frontendPackage);
const ts = requireFromFrontend("typescript");

const dailySource = readFileSync(dailyPath, "utf8");
const loaderSource = readFileSync(loaderPath, "utf8");
const surfaceSource = readFileSync(surfacePath, "utf8");
const routeSource = readFileSync(routePath, "utf8");
const manualSubmissionSource = readFileSync(manualSubmissionPath, "utf8");
const exportRouteSource = readFileSync(exportRoutePath, "utf8");
const implementationSource = [
  dailySource,
  loaderSource,
  surfaceSource,
  routeSource,
  manualSubmissionSource,
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
restoreTypeScriptRequire();

const {
  EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE,
  buildCareerOsDailyJobSearchExperience,
} = daily;

function commandCenterFixture() {
  return {
    capturedAsOf: "2026-08-09T12:00:00.000Z",
    todaysBrief: [
      { id: "new-opportunities", label: "New Opportunities", value: 3, sourceAuthority: "fixture", limitations: [] },
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
        explainableFit: "Strong evidence alignment from existing fit output.",
        resumeVersion: "ROLE_TARGETED_RESUME / PDF / SAFE",
        nextAction: "Review the package before manual application.",
        applicationReadiness: "READY_FOR_OPERATOR_APPROVED_APPLICATION",
        supportingEvidenceCount: 4,
        missingSkillCount: 0,
        estimatedResumeUpdateEffort: "NONE",
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
        explainableFit: "Evidence review needed.",
        resumeVersion: "REVIEW_BEFORE_REUSE",
        nextAction: "Review evidence before deciding.",
        applicationReadiness: "NEEDS_EVIDENCE_REVIEW",
        supportingEvidenceCount: 1,
        missingSkillCount: 2,
        estimatedResumeUpdateEffort: "MODERATE",
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
  assert.equal(metrics["Resume Reviews Needed"], 1);
  assert.equal(metrics["New Opportunities"], 3);
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

test("truth-bound resume draft read models are displayed without draft content or source IDs", () => {
  const experience = buildCareerOsDailyJobSearchExperience({
    commandCenter: commandCenterFixture(),
    resumeDraftReadModel: [resumeDraftItem()],
  });
  const item = experience.resumeDrafts[0];

  assert.equal(item.company, "Example Automation");
  assert.equal(item.nextAction, "Approve for Export");
  assert.equal(item.externalActionAvailable, false);
  assert.equal(item.humanReviewRequired, true);
  assert.doesNotMatch(JSON.stringify(item), /career_fact|career_evidence|draftText|\/Users\//i);
  assert.match(surfaceSource, /Resume Drafts/);
  assert.match(surfaceSource, /Review Draft/);
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
