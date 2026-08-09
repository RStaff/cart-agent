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
const requireFromFrontend = createRequire(frontendPackage);
const ts = requireFromFrontend("typescript");

const dailySource = readFileSync(dailyPath, "utf8");
const loaderSource = readFileSync(loaderPath, "utf8");
const surfaceSource = readFileSync(surfacePath, "utf8");
const routeSource = readFileSync(routePath, "utf8");
const implementationSource = [dailySource, loaderSource, surfaceSource, routeSource].join("\n");

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

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

test("empty CareerOS daily experience is action-first and disconnected", () => {
  assert.equal(EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE.title, "CareerOS");
  assert.equal(EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE.greeting, "Good morning");
  assert.equal(EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE.primaryQuestion, "What should I do next in my job search?");
  assert.equal(EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE.todaysPriorities.length, 0);
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
  assert.equal(result.loadedArtifacts.opportunityRecommendations, false);
  assert.equal(result.experience.applicationPipeline.find((item) => item.id === "applied").value, 2);
  assert.equal(result.experience.todaysPriorities[0].action, "Follow Up");
  assert.equal(result.auditSummary.noProviderCalled, true);
  assert.equal(result.auditSummary.noNewPrivateDataRoute, true);
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
