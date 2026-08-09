import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const packagePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/readyToApplyApplicationPackage.ts");
const workflowPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/careerWorkflowActions.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runReadyToApplyApplicationPackage.mjs");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const packageSource = readFileSync(packagePath, "utf8");
const cliSource = readFileSync(cliPath, "utf8");
const implementationSource = `${packageSource}\n${cliSource}`;

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

const packages = requireTypeScriptModule(packagePath);
const workflow = requireTypeScriptModule(workflowPath);

const generatedAt = "2026-08-09T12:00:00Z";
const syntheticJobUrl = ["https:", "", "jobs.example.invalid", "synthetic-ai-automation"].join("/");

function coverage(overrides = {}) {
  return {
    PROVEN: overrides.PROVEN ?? 3,
    PARTIAL: overrides.PARTIAL ?? 0,
    TRANSFERABLE: overrides.TRANSFERABLE ?? 1,
    MISSING: overrides.MISSING ?? 0,
    UNKNOWN: overrides.UNKNOWN ?? 0,
  };
}

function evidence(id, safePositioning = "Use existing AI automation and stakeholder workflow evidence.") {
  return {
    requirementId: id,
    classification: "PROVEN",
    careerFactIds: [`career_fact_${id}`],
    careerEvidenceIds: [`career_evidence_${id}`],
    safePositioning,
    limitations: ["Synthetic Career Evidence fixture."],
  };
}

function missingSkill(id, reason = "Existing CareerOS evidence has no mapped support for this requirement.") {
  return {
    requirementId: id,
    requirementText: "Advanced enterprise workflow orchestration",
    technologyOrSkill: "workflow orchestration",
    classification: "MISSING",
    reason,
    limitations: ["Synthetic missing-skill fixture."],
  };
}

function readModelRecord(id, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_opportunity_recommendation_read_model.v1",
    recommendationId: id,
    queueItemId: overrides.queueItemId || `queue_${id}`,
    company: overrides.company || "Example Automation",
    role: overrides.role || "AI Automation Product Manager",
    recommendation: overrides.recommendation || "APPLY_NOW",
    applicationReadiness: overrides.applicationReadiness || "READY_FOR_OPERATOR_APPROVED_APPLICATION",
    recommendedResumeVersion: {
      status: overrides.resumeStatus ?? "SELECTED_EXISTING_RESUMEVERSION",
      safeLabel: overrides.safeLabel ?? "ROLE_TARGETED_RESUME / PDF / SUPPORTED_VERIFIED / 2026-08-01 / abc12345",
      factSafetyStatus: overrides.factSafetyStatus ?? "SUPPORTED_VERIFIED",
    },
    missingSkillCount: overrides.missingSkillCount ?? 0,
    supportingEvidenceCount: overrides.supportingEvidenceCount ?? 2,
    estimatedResumeUpdateEffort: overrides.estimatedResumeUpdateEffort ?? "NONE",
    recommendedNextAction: overrides.recommendedNextAction ?? "Confirm the selected ResumeVersion before applying manually.",
    capturedAsOf: generatedAt,
    limitations: ["Synthetic recommendation read-model fixture."],
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
      available: overrides.fitAvailable ?? true,
      fitAssessment: null,
      fitRecommendation: overrides.fitRecommendation ?? "Existing Explainable Fit supports applying with positioning.",
      coverage: overrides.coverage ?? coverage(),
      majorBlockers: overrides.majorBlockers ?? [],
      limitations: ["Synthetic Explainable Fit fixture."],
    },
    recommendedResumeVersion: {
      status: record.recommendedResumeVersion.status,
      resumeVersionId: overrides.resumeVersionId ?? "resume_version_ready",
      safeLabel: record.recommendedResumeVersion.safeLabel,
      reason: "Existing ResumeVersion selected by J003.01.",
      evaluatedResumeVersions: [],
      limitations: ["Synthetic ResumeVersion fixture."],
      privatePathVisible: false,
      rawResumeTextVisible: false,
      resumeGenerated: false,
      resumeMutated: false,
    },
    supportingCareerEvidence: overrides.supportingCareerEvidence ?? [
      evidence("ai_automation"),
      evidence("stakeholder_workflow", "Use existing stakeholder workflow and documentation evidence."),
    ],
    missingSkills: overrides.missingSkills ?? [],
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

function recommendationResult(records) {
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
    recommendations: records.map((record) => recommendationRecord(record, record.overrides || {})),
    readModel: records,
    summary: {
      queueItemsReviewed: records.length,
      recommendationsCreated: records.length,
      applyNow: records.filter((record) => record.recommendation === "APPLY_NOW").length,
      review: records.filter((record) => record.recommendation === "REVIEW").length,
      wait: records.filter((record) => record.recommendation === "WAIT").length,
      skip: records.filter((record) => record.recommendation === "SKIP").length,
      resumeVersionsEvaluated: 1,
      opportunitiesWithRecommendedResumeVersion: records.length,
      opportunitiesMissingSkills: records.filter((record) => record.missingSkillCount > 0).length,
      readinessReadyForOperatorApprovedApplication: records.filter(
        (record) => record.applicationReadiness === "READY_FOR_OPERATOR_APPROVED_APPLICATION",
      ).length,
      hiringProbabilityGenerated: false,
      interviewProbabilityGenerated: false,
      aiConfidenceScoreGenerated: false,
    },
    auditSummary: {
      noApplicationSubmitted: true,
      noApplicationCreated: true,
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

function workflowStateFor(result, readyRecommendationIds) {
  const actions = readyRecommendationIds.map((recommendationId) =>
    workflow.createCareerWorkflowAction({
      recommendationResult: result,
      recommendationId,
      actionType: "APPLY",
      generatedAt,
      operatorConfirmed: true,
      existingActions: [],
    }),
  );
  return workflow.buildCareerWorkflowState({
    recommendationResult: result,
    workflowActions: actions,
    generatedAt,
  });
}

function queueResult(records, overrides = {}) {
  return {
    normalizedSourceRecords: records.map((record) => ({
      jobSourceRecordId: `source_${record.recommendationId}`,
      sourceUrl: overrides.omitUrl ? null : syntheticJobUrl,
    })),
    importQueue: records.map((record) => ({
      queueItemId: record.queueItemId,
      limitations: ["Synthetic queue item fixture."],
    })),
  };
}

test("application package readiness states are deterministic", () => {
  assert.deepEqual(packages.APPLICATION_PACKAGE_READINESS_STATES, [
    "READY",
    "NEEDS_RESUME_REVIEW",
    "NEEDS_EVIDENCE_REVIEW",
    "BLOCKED",
  ]);
});

test("READY_TO_APPLY opportunity produces a READY package with existing fit, resume, and evidence", () => {
  const ready = readModelRecord("rec_ready");
  const result = recommendationResult([ready]);
  const workflowState = workflowStateFor(result, ["rec_ready"]);
  const packageResult = packages.buildReadyToApplyApplicationPackages({
    generatedAt,
    workflowState,
    recommendationResult: result,
    queueResult: queueResult([ready]),
  });
  const pkg = packageResult.packages[0];

  assert.equal(packageResult.summary.packagesCreated, 1);
  assert.equal(pkg.applicationReadiness, "READY");
  assert.equal(pkg.opportunityId, "opportunity_rec_ready");
  assert.equal(pkg.company, "Example Automation");
  assert.equal(pkg.role, "AI Automation Product Manager");
  assert.equal(pkg.canonicalJobUrl, syntheticJobUrl);
  assert.equal(pkg.canonicalJobUrlAuthority, "J002_SOURCE_RECORD");
  assert.equal(pkg.explainableFitSummary.available, true);
  assert.equal(pkg.recommendedResumeVersion.status, "SELECTED_EXISTING_RESUMEVERSION");
  assert.equal(pkg.supportingCareerEvidence.length, 2);
  assert.equal(pkg.relevantStrengths.length, 2);
  assert.equal(pkg.missingSkills.length, 0);
  assert.equal(pkg.resumeUpdateRequirements.length, 0);
  assert.equal(pkg.humanReviewRequired, true);
  assert.equal(pkg.applicationCreated, false);
  assert.equal(pkg.applicationSubmitted, false);
  assert.equal(pkg.resumeGenerated, false);
  assert.equal(pkg.resumeMutated, false);
  assert.equal(pkg.messageSent, false);
});

test("only READY_TO_APPLY workflow items receive application packages", () => {
  const ready = readModelRecord("rec_ready");
  const pending = readModelRecord("rec_pending");
  const result = recommendationResult([ready, pending]);
  const workflowState = workflowStateFor(result, ["rec_ready"]);
  const packageResult = packages.buildReadyToApplyApplicationPackages({
    generatedAt,
    workflowState,
    recommendationResult: result,
    queueResult: queueResult([ready, pending]),
  });

  assert.deepEqual(packageResult.packages.map((pkg) => pkg.recommendationId), ["rec_ready"]);
  assert.equal(packageResult.summary.readyToApplyItemsReviewed, 1);
});

test("missing canonical job URL is surfaced as BLOCKED rather than invented", () => {
  const ready = readModelRecord("rec_ready");
  const result = recommendationResult([ready]);
  const workflowState = workflowStateFor(result, ["rec_ready"]);
  const packageResult = packages.buildReadyToApplyApplicationPackages({
    generatedAt,
    workflowState,
    recommendationResult: result,
    queueResult: queueResult([ready], { omitUrl: true }),
  });
  const pkg = packageResult.packages[0];

  assert.equal(pkg.applicationReadiness, "BLOCKED");
  assert.equal(pkg.canonicalJobUrl, null);
  assert.match(pkg.blockingIssues.join("\n"), /Canonical job URL is missing/);
  assert.equal(packageResult.readModel[0].canonicalJobUrlKnown, false);
});

test("ResumeVersion review requirements produce NEEDS_RESUME_REVIEW without mutating the resume", () => {
  const needsResume = readModelRecord("rec_resume_review", {
    resumeStatus: "REVIEW_BEFORE_REUSE",
    factSafetyStatus: "NEEDS_EVIDENCE",
    estimatedResumeUpdateEffort: "MODERATE",
  });
  const result = recommendationResult([needsResume]);
  const workflowState = workflowStateFor(result, ["rec_resume_review"]);
  const packageResult = packages.buildReadyToApplyApplicationPackages({
    generatedAt,
    workflowState,
    recommendationResult: result,
    queueResult: queueResult([needsResume]),
  });
  const pkg = packageResult.packages[0];

  assert.equal(pkg.applicationReadiness, "NEEDS_RESUME_REVIEW");
  assert.match(pkg.resumeUpdateRequirements.join("\n"), /Review the selected ResumeVersion before reuse/);
  assert.equal(pkg.recommendedResumeVersion.reviewRequired, true);
  assert.equal(pkg.recommendedResumeVersion.resumeGenerated, false);
  assert.equal(pkg.recommendedResumeVersion.resumeMutated, false);
});

test("insufficient Career Evidence produces NEEDS_EVIDENCE_REVIEW without inventing evidence", () => {
  const needsEvidence = readModelRecord("rec_evidence_review", {
    missingSkillCount: 1,
    estimatedResumeUpdateEffort: "LOW",
  });
  needsEvidence.overrides = {
    coverage: coverage({ MISSING: 1 }),
    missingSkills: [missingSkill("workflow_gap")],
    supportingCareerEvidence: [evidence("ai_automation")],
  };
  const result = recommendationResult([needsEvidence]);
  const workflowState = workflowStateFor(result, ["rec_evidence_review"]);
  const packageResult = packages.buildReadyToApplyApplicationPackages({
    generatedAt,
    workflowState,
    recommendationResult: result,
    queueResult: queueResult([needsEvidence]),
  });
  const pkg = packageResult.packages[0];

  assert.equal(pkg.applicationReadiness, "NEEDS_EVIDENCE_REVIEW");
  assert.equal(pkg.supportingCareerEvidence.length, 1);
  assert.equal(pkg.missingSkills.length, 1);
  assert.match(pkg.recommendedNextAction, /Review supporting Career Evidence/);
  assert.equal(pkg.applicationCreated, false);
});

test("unsafe ResumeVersion fact safety blocks the package", () => {
  const blocked = readModelRecord("rec_blocked", {
    factSafetyStatus: "CONFLICTING",
  });
  const result = recommendationResult([blocked]);
  const workflowState = workflowStateFor(result, ["rec_blocked"]);
  const packageResult = packages.buildReadyToApplyApplicationPackages({
    generatedAt,
    workflowState,
    recommendationResult: result,
    queueResult: queueResult([blocked]),
  });
  const pkg = packageResult.packages[0];

  assert.equal(pkg.applicationReadiness, "BLOCKED");
  assert.match(pkg.blockingIssues.join("\n"), /fact-safety status blocks reuse/);
});

test("read model hides URL values, raw payloads, and private paths", () => {
  const ready = readModelRecord("rec_ready");
  const result = recommendationResult([ready]);
  const workflowState = workflowStateFor(result, ["rec_ready"]);
  const packageResult = packages.buildReadyToApplyApplicationPackages({
    generatedAt,
    workflowState,
    recommendationResult: result,
    queueResult: queueResult([ready]),
  });
  const readModel = packageResult.readModel[0];
  const serialized = JSON.stringify(readModel);

  assert.equal(readModel.canonicalJobUrlKnown, true);
  assert.equal(readModel.sourceUrlVisible, false);
  assert.equal(readModel.privatePathVisible, false);
  assert.equal(readModel.rawJobTextVisible, false);
  assert.equal(readModel.rawResumeTextVisible, false);
  assert.equal(serialized.includes(syntheticJobUrl), false);
});

test("private writer stores packages outside Git and creates no Application artifacts", () => {
  const ready = readModelRecord("rec_ready");
  const result = recommendationResult([ready]);
  const workflowState = workflowStateFor(result, ["rec_ready"]);
  const packageResult = packages.buildReadyToApplyApplicationPackages({
    generatedAt,
    workflowState,
    recommendationResult: result,
    queueResult: queueResult([ready]),
  });
  const privateRoot = mkdtempSync(path.join(tmpdir(), "ready-package-"));
  const written = packages.writeReadyToApplyApplicationPackageOutputs({
    outputRoot: privateRoot,
    repositoryRoot: root,
    result: packageResult,
  });

  assert.equal(written.privatePathVisible, false);
  assert.equal(statSync(written.runDirectory).mode & 0o777, 0o700);
  assert.equal(written.artifactNames.includes("application_packages.json"), true);
  assert.equal(written.artifactNames.includes("application_package_read_model.json"), true);
  assert.equal(written.artifactNames.includes("applications.json"), false);
  assert.equal(written.artifactNames.includes("messages.json"), false);
  assert.equal(written.artifactNames.includes("resume_writes.json"), false);
  assert.equal(existsSync(path.join(written.runDirectory, "application_packages.json")), true);
});

test("private writer rejects repository output roots", () => {
  const ready = readModelRecord("rec_ready");
  const result = recommendationResult([ready]);
  const workflowState = workflowStateFor(result, ["rec_ready"]);
  const packageResult = packages.buildReadyToApplyApplicationPackages({
    generatedAt,
    workflowState,
    recommendationResult: result,
    queueResult: queueResult([ready]),
  });

  assert.throws(
    () =>
      packages.writeReadyToApplyApplicationPackageOutputs({
        outputRoot: path.join(root, "staffordos/job-search/tmp-application-packages"),
        repositoryRoot: root,
        result: packageResult,
      }),
    /outside the repository/,
  );
});

test("loaders accept workflow state, recommendation, and queue result files", () => {
  const ready = readModelRecord("rec_ready");
  const result = recommendationResult([ready]);
  const workflowState = workflowStateFor(result, ["rec_ready"]);
  const queue = queueResult([ready]);
  const privateRoot = mkdtempSync(path.join(tmpdir(), "ready-package-loader-"));
  const workflowFile = path.join(privateRoot, "workflow_state.json");
  const recommendationFile = path.join(privateRoot, "recommendations.json");
  const queueFile = path.join(privateRoot, "queue.json");

  writeFileSync(workflowFile, `${JSON.stringify({ workflowState }, null, 2)}\n`, "utf8");
  writeFileSync(recommendationFile, `${JSON.stringify({ recommendationResult: result }, null, 2)}\n`, "utf8");
  writeFileSync(queueFile, `${JSON.stringify({ jobSourceImportQueue: queue }, null, 2)}\n`, "utf8");

  assert.equal(packages.loadCareerWorkflowStateResultFile(workflowFile).applicationWorkspaceReadyToApply.length, 1);
  assert.equal(packages.loadRecommendationResultFile(recommendationFile).readModel.length, 1);
  assert.equal(packages.loadJobSourceQueueResultFile(queueFile).normalizedSourceRecords.length, 1);
});

test("CLI summary is redacted and preserves closed execution flags", () => {
  const ready = readModelRecord("rec_ready");
  const result = recommendationResult([ready]);
  const workflowState = workflowStateFor(result, ["rec_ready"]);
  const packageResult = packages.buildReadyToApplyApplicationPackages({
    generatedAt,
    workflowState,
    recommendationResult: result,
    queueResult: queueResult([ready]),
  });
  const summary = packages.buildReadyToApplyPackageCliSummary(packageResult, 7);
  const serialized = JSON.stringify(summary);

  assert.equal(summary.packagesCreated, 1);
  assert.equal(summary.humanReviewRequired, true);
  assert.equal(summary.noApplicationCreated, true);
  assert.equal(summary.noApplicationSubmitted, true);
  assert.equal(summary.noResumeGenerated, true);
  assert.equal(summary.noResumeMutated, true);
  assert.equal(summary.noMessageSent, true);
  assert.equal(serialized.includes(syntheticJobUrl), false);
});

test("implementation does not duplicate discovery, recommendation, ranking, or fit logic", () => {
  assert.doesNotMatch(packageSource, /buildOpportunityRecommendationEngine/);
  assert.doesNotMatch(packageSource, /buildPrivateJobSourceImportQueue/);
  assert.doesNotMatch(packageSource, /rankingSummary|totalScore|categoryContributions|priorityTier/);
  assert.doesNotMatch(packageSource, /APPLY_WITH_POSITIONING|STRONG_APPLY|finalRecommendation\s*===/);
});

test("implementation has no external action, AI, provider write, route, or resume mutation path", () => {
  assert.doesNotMatch(implementationSource, /fetch\s*\(|XMLHttpRequest|method:\s*["']POST/);
  assert.doesNotMatch(implementationSource, /applyToJob|createApplication|submitApplication|sendRecruiter|sendMessage|mailto:/);
  assert.doesNotMatch(implementationSource, /generateResume|rewriteResume|mutateResume|writeResume|createResumeVersion/);
  assert.doesNotMatch(implementationSource, /runOllama|OLLAMA_HOST|from\s+["']openai|from\s+["']@anthropic|modelAdapter|chiefOfStaffModel/i);
  assert.doesNotMatch(implementationSource, /from\s+["'][^"']*\/os|from\s+["'][^"']*\/operator|app\/os|app\/operator/);
});
