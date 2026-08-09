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
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/careerWorkflowActions.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runCareerWorkflowActions.mjs");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const source = readFileSync(modulePath, "utf8");
const cliSource = readFileSync(cliPath, "utf8");
const implementationSource = `${source}\n${cliSource}`;

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

const workflow = requireTypeScriptModule(modulePath);

const generatedAt = "2026-08-09T12:00:00Z";

function readModelRecord(id, recommendation, applicationReadiness, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_opportunity_recommendation_read_model.v1",
    recommendationId: id,
    queueItemId: overrides.queueItemId || `queue_${id}`,
    company: overrides.company || `Example ${id}`,
    role: overrides.role || "AI Automation Product Manager",
    recommendation,
    applicationReadiness,
    recommendedResumeVersion: {
      status: overrides.resumeStatus ?? "SELECTED_EXISTING_RESUMEVERSION",
      safeLabel: overrides.safeLabel ?? "ROLE_TARGETED_RESUME / PDF / SUPPORTED_VERIFIED / 2026-08-01 / abc12345",
      factSafetyStatus: overrides.factSafetyStatus ?? "SUPPORTED_VERIFIED",
    },
    missingSkillCount: overrides.missingSkillCount ?? 0,
    supportingEvidenceCount: overrides.supportingEvidenceCount ?? 3,
    estimatedResumeUpdateEffort: overrides.estimatedResumeUpdateEffort ?? "NONE",
    recommendedNextAction: overrides.recommendedNextAction ?? "Confirm the selected ResumeVersion before applying manually.",
    capturedAsOf: generatedAt,
    limitations: ["Synthetic read-model fixture."],
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
      fitRecommendation: "Existing Explainable Fit artifact reused.",
      coverage: null,
      majorBlockers: [],
      limitations: ["Synthetic fixture."],
    },
    recommendedResumeVersion: {
      status: record.recommendedResumeVersion.status,
      resumeVersionId: "resume_version_synthetic",
      safeLabel: record.recommendedResumeVersion.safeLabel,
      reason: "Synthetic deterministic resume selection.",
      evaluatedResumeVersions: [],
      limitations: ["Synthetic fixture."],
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
    recommendationReasons: ["Synthetic fixture."],
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
    limitations: ["Synthetic fixture."],
  };
}

function recommendationResult() {
  const readModel = [
    readModelRecord("rec_apply", "APPLY_NOW", "READY_FOR_OPERATOR_APPROVED_APPLICATION", {
      company: "Example Automation",
      role: "AI Automation Product Manager",
    }),
    readModelRecord("rec_review", "REVIEW", "NEEDS_EVIDENCE_REVIEW", {
      company: "Example Systems",
      role: "Business Technology Analyst",
      missingSkillCount: 2,
      estimatedResumeUpdateEffort: "MODERATE",
    }),
    readModelRecord("rec_wait", "WAIT", "WAITING_FOR_SOURCE_OR_DUPLICATE_REVIEW", {
      company: "Example Platform",
      role: "Platform Operations Lead",
    }),
    readModelRecord("rec_skip", "SKIP", "SKIP_RECOMMENDED", {
      company: "Example Duplicate",
      role: "Traditional Marketing Specialist",
      resumeStatus: "NO_SAFE_EXISTING_RESUMEVERSION",
      safeLabel: null,
      factSafetyStatus: null,
      missingSkillCount: 3,
      estimatedResumeUpdateEffort: "HIGH",
    }),
    readModelRecord("rec_existing_application", "SKIP", "BLOCKED_EXISTING_APPLICATION", {
      company: "Example Already Applied",
      role: "AI Product Operations Manager",
      recommendedNextAction: "Do not apply again; review the existing Application record instead.",
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
      skip: 2,
      resumeVersionsEvaluated: 1,
      opportunitiesWithRecommendedResumeVersion: 4,
      opportunitiesMissingSkills: 2,
      readinessReadyForOperatorApprovedApplication: 1,
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

function createAction(result, recommendationId, actionType, overrides = {}) {
  return workflow.createCareerWorkflowAction({
    recommendationResult: result,
    recommendationId,
    actionType,
    generatedAt: overrides.generatedAt || generatedAt,
    operatorConfirmed: true,
    existingActions: overrides.existingActions || [],
  });
}

test("workflow action constants expose the supported deterministic actions and states", () => {
  assert.deepEqual(workflow.CAREER_WORKFLOW_ACTION_TYPES, [
    "APPLY",
    "REVIEW_LATER",
    "SKIP",
    "NOT_INTERESTED",
  ]);
  assert.deepEqual(workflow.CAREER_WORKFLOW_STATES, [
    "READY_TO_APPLY",
    "REVIEW_LATER",
    "SKIPPED",
    "NOT_INTERESTED",
  ]);
});

test("APPLY moves an APPLY_NOW recommendation into Ready to Apply without creating an Application", () => {
  const result = recommendationResult();
  const action = createAction(result, "rec_apply", "APPLY");
  const state = workflow.buildCareerWorkflowState({
    recommendationResult: result,
    workflowActions: [action],
    generatedAt,
  });

  assert.equal(action.workflowState, "READY_TO_APPLY");
  assert.equal(action.applicationWorkspace.movedToApplicationWorkspace, true);
  assert.equal(action.applicationWorkspace.workspaceState, "READY_TO_APPLY");
  assert.equal(action.applicationCreated, false);
  assert.equal(action.applicationSubmitted, false);
  assert.equal(state.applicationWorkspaceReadyToApply.length, 1);
  assert.equal(state.applicationWorkspaceReadyToApply[0].recommendationId, "rec_apply");
  assert.equal(state.summary.applicationsCreated, 0);
  assert.equal(state.summary.applicationsSubmitted, 0);
  assert.equal(state.auditSummary.noApplicationCreated, true);
  assert.equal(state.auditSummary.noApplicationSubmitted, true);
});

test("REVIEW_LATER, SKIP, and NOT_INTERESTED create distinct authoritative state transitions", () => {
  const result = recommendationResult();
  const actions = [
    createAction(result, "rec_review", "REVIEW_LATER"),
    createAction(result, "rec_wait", "SKIP"),
    createAction(result, "rec_skip", "NOT_INTERESTED"),
  ];
  const state = workflow.buildCareerWorkflowState({
    recommendationResult: result,
    workflowActions: actions,
    generatedAt,
  });

  assert.equal(state.futureWorkQueue.length, 1);
  assert.equal(state.futureWorkQueue[0].workflowState, "REVIEW_LATER");
  assert.equal(state.skippedToday.length, 1);
  assert.equal(state.skippedToday[0].workflowState, "SKIPPED");
  assert.equal(state.excludedFromFutureRecommendations.length, 1);
  assert.equal(state.excludedFromFutureRecommendations[0].workflowState, "NOT_INTERESTED");
  assert.equal(state.summary.reviewLater, 1);
  assert.equal(state.summary.skipped, 1);
  assert.equal(state.summary.notInterested, 1);
});

test("recommendations without a workflow action remain in today's queue", () => {
  const result = recommendationResult();
  const state = workflow.buildCareerWorkflowState({
    recommendationResult: result,
    workflowActions: [],
    generatedAt,
  });

  assert.equal(state.todaysQueue.length, result.readModel.length);
  assert.equal(state.summary.pendingWorkflowAction, result.readModel.length);
  assert.equal(state.todaysQueue[0].queueEffect, "NO_WORKFLOW_ACTION_RECORDED");
  assert.equal(state.todaysQueue[0].currentWorkflowNextAction, "Choose APPLY, REVIEW_LATER, SKIP, or NOT_INTERESTED.");
});

test("each recommendation may receive exactly one workflow action", () => {
  const result = recommendationResult();
  const first = createAction(result, "rec_review", "REVIEW_LATER");

  assert.throws(
    () =>
      workflow.createCareerWorkflowAction({
        recommendationResult: result,
        recommendationId: "rec_review",
        actionType: "SKIP",
        generatedAt: "2026-08-09T13:00:00Z",
        operatorConfirmed: true,
        existingActions: [first],
      }),
    /exactly one workflow action/,
  );

  assert.throws(
    () =>
      workflow.buildCareerWorkflowState({
        recommendationResult: result,
        workflowActions: [
          first,
          {
            ...first,
            actionId: "duplicate_action",
            actionType: "SKIP",
            workflowState: "SKIPPED",
            queueEffect: "REMOVE_FROM_TODAYS_QUEUE",
          },
        ],
        generatedAt,
      }),
    /already has workflow action/,
  );
});

test("APPLY is blocked unless existing recommendation readiness supports application planning", () => {
  const result = recommendationResult();

  assert.throws(
    () => createAction(result, "rec_review", "APPLY"),
    /APPLY requires an APPLY_NOW recommendation/,
  );
  assert.throws(
    () => createAction(result, "rec_existing_application", "APPLY"),
    /APPLY requires an APPLY_NOW recommendation/,
  );
});

test("workflow actions require explicit Ross operator confirmation", () => {
  const result = recommendationResult();

  assert.throws(
    () =>
      workflow.createCareerWorkflowAction({
        recommendationResult: result,
        recommendationId: "rec_apply",
        actionType: "APPLY",
        generatedAt,
        operatorConfirmed: false,
      }),
    /explicit Ross operator confirmation/,
  );
});

test("state projection reuses the existing recommendation read model without recomputing fit or ranking", () => {
  const result = recommendationResult();
  const action = createAction(result, "rec_review", "REVIEW_LATER");
  const state = workflow.buildCareerWorkflowState({
    recommendationResult: result,
    workflowActions: [action],
    generatedAt,
  });
  const projected = state.stateItems.find((item) => item.recommendationId === "rec_review");

  assert.equal(projected.recommendedNextAction, "Confirm the selected ResumeVersion before applying manually.");
  assert.equal(projected.recommendation, "REVIEW");
  assert.equal(projected.applicationReadiness, "NEEDS_EVIDENCE_REVIEW");
  assert.equal(projected.recommendedResumeVersion.safeLabel, "ROLE_TARGETED_RESUME / PDF / SUPPORTED_VERIFIED / 2026-08-01 / abc12345");
  assert.equal(projected.missingSkillCount, 2);
  assert.equal(projected.estimatedResumeUpdateEffort, "MODERATE");
});

test("private writers append actions and write state artifacts outside Git", () => {
  const result = recommendationResult();
  const action = createAction(result, "rec_apply", "APPLY");
  const privateRoot = mkdtempSync(path.join(tmpdir(), "career-workflow-actions-"));
  const actionRoot = path.join(privateRoot, "actions");
  const outputRoot = path.join(privateRoot, "state");

  const actionWrite = workflow.writeCareerWorkflowAction({
    actionRoot,
    repositoryRoot: root,
    action,
  });
  const actionLog = path.join(actionRoot, "workflow_actions.ndjson");
  assert.equal(actionWrite.artifactName, "workflow_actions.ndjson");
  assert.equal(actionWrite.privatePathVisible, false);
  assert.equal(existsSync(actionLog), true);
  assert.equal(statSync(actionRoot).mode & 0o777, 0o700);
  assert.equal(statSync(actionLog).mode & 0o777, 0o600);
  assert.equal(readFileSync(actionLog, "utf8").trim().split(/\n+/).length, 1);

  const state = workflow.buildCareerWorkflowState({
    recommendationResult: result,
    workflowActions: [action],
    generatedAt,
  });
  const written = workflow.writeCareerWorkflowStateOutputs({
    outputRoot,
    repositoryRoot: root,
    result: state,
  });
  assert.equal(written.privatePathVisible, false);
  assert.equal(written.artifactNames.includes("workflow_state.json"), true);
  assert.equal(written.artifactNames.includes("application_workspace_ready_to_apply.json"), true);
  assert.equal(written.artifactNames.includes("applications.json"), false);
  assert.equal(written.artifactNames.includes("messages.json"), false);
});

test("private writers reject repository output roots", () => {
  const result = recommendationResult();
  const action = createAction(result, "rec_apply", "APPLY");
  const state = workflow.buildCareerWorkflowState({
    recommendationResult: result,
    workflowActions: [action],
    generatedAt,
  });

  assert.throws(
    () =>
      workflow.writeCareerWorkflowAction({
        actionRoot: path.join(root, "staffordos/job-search/tmp-workflow-actions"),
        repositoryRoot: root,
        action,
      }),
    /outside the repository/,
  );
  assert.throws(
    () =>
      workflow.writeCareerWorkflowStateOutputs({
        outputRoot: path.join(root, "staffordos/job-search/tmp-workflow-state"),
        repositoryRoot: root,
        result: state,
      }),
    /outside the repository/,
  );
});

test("loader accepts recommendation result and action log files", () => {
  const result = recommendationResult();
  const action = createAction(result, "rec_review", "REVIEW_LATER");
  const privateRoot = mkdtempSync(path.join(tmpdir(), "career-workflow-loader-"));
  const recommendationFile = path.join(privateRoot, "recommendation_result.json");
  const actionRoot = path.join(privateRoot, "actions");
  const recommendationJson = JSON.stringify({ recommendationResult: result }, null, 2);

  workflow.writeCareerWorkflowAction({
    actionRoot,
    repositoryRoot: root,
    action,
  });
  writeFileSync(recommendationFile, `${recommendationJson}\n`, "utf8");

  assert.equal(workflow.loadOpportunityRecommendationResultFile(recommendationFile).readModel.length, result.readModel.length);
  assert.equal(workflow.loadCareerWorkflowActionsFile(path.join(actionRoot, "workflow_actions.ndjson")).length, 1);
});

test("CLI summary is redacted and preserves closure flags", () => {
  const result = recommendationResult();
  const action = createAction(result, "rec_apply", "APPLY");
  const state = workflow.buildCareerWorkflowState({
    recommendationResult: result,
    workflowActions: [action],
    generatedAt,
  });
  const summary = workflow.buildCareerWorkflowCliSummary({
    result: state,
    actionWritten: action,
    privateArtifactsWritten: 8,
  });
  const serialized = JSON.stringify(summary);
  const privatePathPattern = new RegExp(
    [
      ["/", "Users", "/"].join(""),
      "staffordos-" + "private" + "-intake",
      "https?:\\/\\/",
      "raw job description",
      "raw resume text",
    ].join("|"),
    "i",
  );

  assert.equal(summary.readyToApply, 1);
  assert.equal(summary.actionWritten.actionType, "APPLY");
  assert.equal(summary.noApplicationCreated, true);
  assert.equal(summary.noApplicationSubmitted, true);
  assert.equal(summary.noResumeGenerated, true);
  assert.equal(summary.noMessageSent, true);
  assert.doesNotMatch(serialized, privatePathPattern);
});

test("workflow action implementation does not duplicate recommendation or discovery logic", () => {
  assert.doesNotMatch(source, /buildOpportunityRecommendationEngine/);
  assert.doesNotMatch(source, /rankingSummary|totalScore|categoryContributions|priorityTier/);
  assert.doesNotMatch(source, /APPLY_WITH_POSITIONING|STRONG_APPLY|finalRecommendation\s*===/);
});

test("workflow action implementation has no external execution path", () => {
  assert.doesNotMatch(implementationSource, /fetch\s*\(|XMLHttpRequest|method:\s*["']POST/);
  assert.doesNotMatch(implementationSource, /applyToJob|createApplication|sendRecruiter|sendMessage|mailto:/);
  assert.doesNotMatch(implementationSource, /generateResume|generateCover|mutateResume|writeResume/);
  assert.doesNotMatch(implementationSource, /runOllama|OLLAMA_HOST|from\s+["']openai|from\s+["']@anthropic|modelAdapter|chiefOfStaffModel/i);
  assert.doesNotMatch(implementationSource, /from\s+["'][^"']*\/os|from\s+["'][^"']*\/operator|app\/os|app\/operator/);
});
