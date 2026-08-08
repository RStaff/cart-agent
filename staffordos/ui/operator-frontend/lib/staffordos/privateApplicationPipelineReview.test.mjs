import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateApplicationPipelineReview.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runPrivateApplicationPipelineReview.mjs");
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

const review = requireTypeScriptModule(modulePath);

function syntheticActionId(value) {
  return `synthetic_${value}`;
}

function application(overrides = {}) {
  const applicationId = overrides.applicationId || syntheticActionId("application_001");
  return {
    schemaVersion: "staffordos.job_search.private_application.v1",
    applicationId,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    opportunityId: overrides.opportunityId ?? syntheticActionId("opportunity_001"),
    analysisRunId: overrides.analysisRunId ?? syntheticActionId("analysis_001"),
    companyReference: {
      label: overrides.companyName || "Synthetic Health Systems",
      requisitionAlias: overrides.requisitionAlias || "REQ-SYN-001",
    },
    roleReference: {
      title: overrides.roleTitle || "Synthetic AI Governance Lead",
    },
    status: overrides.status || "SUBMITTED_MANUAL_EXTERNAL",
    submissionMethod: "MANUAL_EXTERNAL",
    submissionChannel: overrides.submissionChannel ?? "Synthetic careers portal",
    submittedAt: overrides.submittedAt ?? "2026-08-03",
    submittedAtPrecision: overrides.submittedAtPrecision || "DATE",
    operatorConfirmed: true,
    resumeReference: {
      resumeReferenceId: syntheticActionId(`resume_${applicationId}`),
      applicationId,
      status: overrides.resumeStatus || "UNKNOWN",
      filename: null,
      assetReferenceId: null,
      version: null,
      createdAt: null,
      purpose: "Synthetic fixture only.",
      authority: "UNKNOWN",
      privacy: "Professional owner-private",
      limitations: ["Synthetic fixture only."],
      resumeIsCanonicalCareerTruth: false,
    },
    coverLetterReference: {
      coverLetterReferenceId: syntheticActionId(`cover_${applicationId}`),
      applicationId,
      status: "UNKNOWN",
      filename: null,
      authority: "UNKNOWN",
      privacy: "Professional owner-private",
      limitations: ["Synthetic fixture only."],
    },
    employerResponseStatus: overrides.employerResponseStatus || "NONE_RECORDED",
    currentStage: overrides.currentStage || "SUBMITTED_MANUAL_EXTERNAL",
    nextAction: {
      nextActionId: syntheticActionId(`next_${applicationId}`),
      applicationId,
      confirmationRecordId: null,
      what: "Synthetic next action.",
      whyNow: "Synthetic fixture only.",
      when: overrides.nextReviewAt ?? "2026-08-17",
      proofOfCompletion: "Synthetic proof.",
      authorityRequired: "ROSS_APPROVAL",
      limitations: ["Synthetic fixture only."],
    },
    nextReviewAt: overrides.nextReviewAt ?? "2026-08-17",
    sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL",
    privacy: "Professional owner-private",
    duplicateStatus: "NO_DUPLICATE",
    limitations: ["Synthetic fixture only."],
    createdAt: "2026-08-07T12:00:00Z",
    updatedAt: "2026-08-07T12:00:00Z",
    submittedByStaffordOS: false,
    applicationSubmittedByThisWorkflow: false,
    noEmployerInterestInferred: true,
    noFitInferred: true,
    testOnly: true,
  };
}

function event(overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_application_event.v2",
    eventId: overrides.eventId || syntheticActionId("event_001"),
    applicationId: overrides.applicationId || syntheticActionId("application_001"),
    eventType: overrides.eventType || "SUBMITTED_MANUAL_EXTERNAL",
    occurredAt: overrides.occurredAt || "2026-08-03",
    occurredAtPrecision: "DATE",
    sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL",
    operatorConfirmed: true,
    channel: null,
    evidenceReferences: [],
    limitations: ["Synthetic fixture only."],
    createdAt: "2026-08-07T12:00:00Z",
    submittedByStaffordOS: false,
    externalActionPerformedByStaffordOS: false,
  };
}

function followUp(overrides = {}) {
  return {
    followUpId: overrides.followUpId || syntheticActionId("followup_001"),
    applicationId: overrides.applicationId || syntheticActionId("application_001"),
    reviewDate: overrides.reviewDate ?? "2026-08-17",
    reason: "Synthetic review proposal.",
    recommendedAction: "Review timing.",
    employerGuidance: "Unknown; employer or recruiter instructions override generic timing.",
    communicationAllowed: false,
    operatorApprovalRequired: true,
    status: overrides.status || "SCHEDULED",
    limitations: ["Synthetic fixture only."],
  };
}

function confirmation(overrides = {}) {
  return {
    confirmationRecordId: overrides.confirmationRecordId || syntheticActionId("confirm_001"),
    sourceRecordId: syntheticActionId("source_001"),
    workspaceId: "professional",
    companyName: overrides.companyName || "Synthetic Security Vendor",
    roleTitle: overrides.roleTitle || null,
    missingRequiredFields: overrides.missingRequiredFields || ["role", "submission date", "submission channel"],
    status: "NEEDS_OPERATOR_CONFIRMATION",
    shouldCreateApplication: false,
    conciseQuestions: ["Confirm exact role.", "Confirm submission date.", "Confirm submission channel."],
    limitations: ["Synthetic fixture only."],
  };
}

function store(overrides = {}) {
  return {
    applications: overrides.applications || [application()],
    applicationEvents: overrides.applicationEvents || [event()],
    followUpReviews: overrides.followUpReviews || [followUp()],
    confirmationNeeded: overrides.confirmationNeeded || [],
  };
}

function build(inputStore = store(), generatedAt = "2026-08-07T12:00:00Z") {
  return review.buildPrivateApplicationPipelineReviewResult({
    store: inputStore,
    generatedAt,
  });
}

test("primary action is deterministic", () => {
  const inputStore = store({
    applications: [application({ applicationId: syntheticActionId("application_002") }), application()],
    followUpReviews: [
      followUp({ applicationId: syntheticActionId("application_002"), followUpId: syntheticActionId("followup_002") }),
      followUp(),
    ],
  });
  const first = build(inputStore);
  const second = build(inputStore);
  assert.equal(first.dailyCommand.primaryNextAction.actionId, second.dailyCommand.primaryNextAction.actionId);
  assert.deepEqual(first.nextActions.map((action) => action.actionId), second.nextActions.map((action) => action.actionId));
});

test("interview and recruiter actions outrank generic monitoring", () => {
  const inputStore = store({
    applications: [
      application({ applicationId: syntheticActionId("application_recruiter"), currentStage: "RECRUITER_CONTACT" }),
      application(),
    ],
    followUpReviews: [followUp()],
  });
  const result = build(inputStore);
  assert.equal(result.dailyCommand.primaryNextAction.priorityTier, 1);
  assert.equal(result.dailyCommand.primaryNextAction.currentStage, "RECRUITER_CONTACT");
});

test("due follow-up outranks non-due follow-up", () => {
  const dueApp = application({ applicationId: syntheticActionId("application_due") });
  const laterApp = application({ applicationId: syntheticActionId("application_later") });
  const result = build(
    store({
      applications: [laterApp, dueApp],
      followUpReviews: [
        followUp({ applicationId: laterApp.applicationId, followUpId: syntheticActionId("followup_later"), reviewDate: "2026-08-17" }),
        followUp({ applicationId: dueApp.applicationId, followUpId: syntheticActionId("followup_due"), reviewDate: "2026-08-07" }),
      ],
      confirmationNeeded: [],
    }),
  );
  assert.equal(result.dailyCommand.primaryNextAction.followUpId, syntheticActionId("followup_due"));
  assert.equal(result.dailyCommand.primaryNextAction.status, "DUE");
});

test("confirmation-needed candidates are surfaced without creating Applications", () => {
  const result = build(store({ applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [confirmation()] }));
  assert.equal(result.loaded.applications, 0);
  assert.equal(result.dailyCommand.confirmationNeeded.length, 1);
  assert.equal(result.dailyCommand.primaryNextAction.currentStage, "NEEDS_OPERATOR_CONFIRMATION");
});

test("employer response is not invented", () => {
  const result = build();
  const submitted = result.dailyCommand.submittedApplications[0];
  assert.equal(submitted.employerResponseStatus, "NONE_RECORDED");
  assert.equal(result.dailyCommand.searchHealth.successProbabilityGenerated, false);
});

test("rejection reason is not invented", () => {
  const result = build(
    store({
      applications: [application({ submittedAt: "2026-07-01", nextReviewAt: "2026-07-15" })],
      followUpReviews: [],
    }),
  );
  const action = result.nextActions.find((item) => item.allowedActions.includes("RECORD_REJECTION"));
  const decision = review.buildPipelineReviewDecision({
    action,
    decisionType: "RECORD_REJECTION",
    operatorConfirmed: true,
    createdAt: "2026-08-07T12:00:00Z",
  });
  const withDecision = review.buildPrivateApplicationPipelineReviewResult({
    store: store({ applications: [application({ submittedAt: "2026-07-01", nextReviewAt: "2026-07-15" })], followUpReviews: [] }),
    generatedAt: "2026-08-07T12:00:00Z",
    decisions: [decision],
  });
  assert.match(decision.limitations.join(" "), /No employer-provided rejection reason/);
  assert.match(withDecision.generatedApplicationEvents[0].limitations.join(" "), /no reason was invented/i);
});

test("message, application submission, resume mutation, provider, AI, API, and database code paths do not exist", () => {
  const combined = `${source}\n${cliSource}`;
  assert.doesNotMatch(combined, /\bfetch\s*\(/);
  assert.doesNotMatch(combined, /send(Message|Email)|submitApplication|applyToJob|method:\s*["']POST["']/i);
  assert.doesNotMatch(combined, /mutateResume|rewriteResume|createResume/i);
  assert.doesNotMatch(combined, /from\s+["'][^"']*(ollama|openai|anthropic|gemini)/i);
  assert.doesNotMatch(combined, /from\s+["'][^"']*(prisma|database|dbClient|sql)/i);
});

test("manual external state is preserved", () => {
  const result = build();
  assert.equal(result.dailyCommand.submittedApplications[0].currentStage, "SUBMITTED_MANUAL_EXTERNAL");
  assert.equal(result.auditSummary.noApplicationSubmitted, true);
});

test("Opportunity and Application state remain separate", () => {
  const app = application();
  const result = build(store({ applications: [app] }));
  assert.equal(app.opportunityId, syntheticActionId("opportunity_001"));
  assert.equal(Object.hasOwn(result.dailyCommand.submittedApplications[0], "opportunityStatus"), false);
});

test("Application history is append-only when a decision creates an event", () => {
  const inputStore = store({ applicationEvents: [event({ eventId: syntheticActionId("event_original") })] });
  const action = build(inputStore).nextActions.find((item) => item.allowedActions.includes("RECORD_RECRUITER_RESPONSE"));
  const fallbackAction =
    action ||
    build(
      store({
        applications: [application({ currentStage: "RECRUITER_CONTACT" })],
      }),
    ).nextActions[0];
  const decision = review.buildPipelineReviewDecision({
    action: fallbackAction,
    decisionType: "RECORD_RECRUITER_RESPONSE",
    operatorConfirmed: true,
    createdAt: "2026-08-07T12:00:00Z",
  });
  const updated = review.applyPipelineReviewDecision({ store: inputStore, decision });
  assert.equal(inputStore.applicationEvents.length, 1);
  assert.equal(updated.applicationEvents.length, 2);
});

test("operator decisions require confirmation", () => {
  const action = build().nextActions[0];
  assert.throws(
    () =>
      review.buildPipelineReviewDecision({
        action,
        decisionType: action.allowedActions[0],
        operatorConfirmed: false,
        createdAt: "2026-08-07T12:00:00Z",
      }),
    /explicit confirmation/,
  );
});

test("follow-up actions require approval and cannot communicate", () => {
  const action = build(
    store({
      followUpReviews: [followUp({ reviewDate: "2026-08-07" })],
    }),
  ).dailyCommand.followUpsDue[0];
  assert.equal(action.communicationAllowed, false);
  assert.equal(action.operatorApprovalRequired, true);
  assert.equal(action.authorityRequired, "ROSS_APPROVAL");
});

test("private paths are hidden in normal summary", () => {
  const summary = review.buildPrivateApplicationPipelineCliSummary(build());
  assert.equal(summary.privatePathVisible, false);
  assert.equal(Object.hasOwn(summary, "applicationRoot"), false);
  assert.equal(Object.hasOwn(summary, "reviewRoot"), false);
});

test("private outputs are outside Git with owner-private permissions", () => {
  const outputRoot = mkdtempSync(path.join(os.tmpdir(), "j001-05b-review-"));
  try {
    const written = review.writePrivateApplicationPipelineReviewOutputs({
      outputRoot,
      repositoryRoot: root,
      result: build(),
    });
    assert.equal(written.privatePathVisible, false);
    assert.equal(written.artifactNames.includes("daily_job_search_command.json"), true);
    assert.equal(statSync(written.runDirectory).mode & 0o777, 0o700);
    assert.equal(statSync(path.join(written.runDirectory, "daily_job_search_command.json")).mode & 0o777, 0o600);
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("private output helper refuses repository-internal roots", () => {
  assert.throws(
    () =>
      review.writePrivateApplicationPipelineReviewOutputs({
        outputRoot: path.join(root, "staffordos/job-search/synthetic-private-output"),
        repositoryRoot: root,
        result: build(),
      }),
    /outside the repository/,
  );
});

test("loader reads only private application pipeline artifacts by schema and shape", () => {
  const outputRoot = mkdtempSync(path.join(os.tmpdir(), "j001-05b-load-"));
  try {
    writeFileSync(path.join(outputRoot, "applications.json"), `${JSON.stringify([application()])}\n`, "utf8");
    writeFileSync(path.join(outputRoot, "application_events.json"), `${JSON.stringify([event()])}\n`, "utf8");
    writeFileSync(path.join(outputRoot, "follow_up_reviews.json"), `${JSON.stringify([followUp()])}\n`, "utf8");
    writeFileSync(path.join(outputRoot, "confirmation_needed.json"), `${JSON.stringify([confirmation()])}\n`, "utf8");
    const loaded = review.loadPrivateApplicationPipelineStore({ applicationRoot: outputRoot, repositoryRoot: root });
    assert.equal(loaded.applications.length, 1);
    assert.equal(loaded.applicationEvents.length, 1);
    assert.equal(loaded.followUpReviews.length, 1);
    assert.equal(loaded.confirmationNeeded.length, 1);
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("no route imports are introduced", () => {
  const combined = `${source}\n${cliSource}`;
  assert.doesNotMatch(combined, /from\s+["'][^"']*\/os|from\s+["'][^"']*\/operator/);
  assert.doesNotMatch(combined, /app\/os|app\/operator|components\/staffordos/);
});

test("G003 read-model boundary remains disconnected", () => {
  const result = build();
  assert.equal(result.futureReadModel[0].connectedToOs, false);
  assert.equal(result.auditSummary.noOsConnection, true);
  assert.equal(result.auditSummary.noApiCreated, true);
});

test("G004 write isolation is not imported or modified", () => {
  const combined = `${source}\n${cliSource}`;
  assert.doesNotMatch(combined, /operatorWrite|writeIsolation|loopbackWrite|write-surface/i);
  assert.equal(build().auditSummary.noOperatorRouteCreated, true);
});

test("future UI read model excludes private artifacts", () => {
  const readModel = build().futureReadModel[0];
  assert.equal(readModel.privatePathVisible, false);
  assert.equal(readModel.rawResumeVisible, false);
  assert.equal(readModel.rawCoverLetterVisible, false);
  assert.equal(readModel.portalCredentialsVisible, false);
  assert.equal(readModel.recruiterContactVisible, false);
  assert.equal(readModel.connectedToOs, false);
});

test("daily command exposes why, known, unknown, approval, and completion proof", () => {
  const action = build().dailyCommand.primaryNextAction;
  assert.ok(action.reason.length > 0);
  assert.ok(action.known.length > 0);
  assert.ok(action.unknown.length > 0);
  assert.equal(action.operatorApprovalRequired, true);
  assert.ok(action.completionProof.length > 0);
});

test("pipeline summary uses descriptive counts without vanity metrics", () => {
  const command = build().dailyCommand;
  assert.equal(command.pipelineSummary.conversionRatesAvailable, false);
  assert.equal(command.searchHealth.vanityMetricGenerated, false);
  assert.equal(command.searchHealth.successProbabilityGenerated, false);
  assert.equal(Object.hasOwn(command.searchHealth, "grade"), false);
  assert.equal(Object.hasOwn(command.searchHealth, "score"), false);
});

test("confirmation action asks only minimum fields for incomplete candidate", () => {
  const action = build(store({ applications: [], applicationEvents: [], followUpReviews: [], confirmationNeeded: [confirmation()] }))
    .dailyCommand.primaryNextAction;
  assert.match(action.whatRossShouldDo, /exact role/);
  assert.match(action.whatRossShouldDo, /whether submission occurred/);
  assert.match(action.whatRossShouldDo, /date/);
  assert.match(action.whatRossShouldDo, /channel/);
  assert.match(action.whatRossShouldDo, /resume used if known/);
});

test("outcome recording creates only supported append-only event types", () => {
  const stageResult = build(store({ applications: [application({ currentStage: "RECRUITER_CONTACT" })] }));
  const action = stageResult.nextActions[0];
  const decision = review.buildPipelineReviewDecision({
    action,
    decisionType: "RECORD_RECRUITER_RESPONSE",
    operatorConfirmed: true,
    createdAt: "2026-08-07T12:00:00Z",
  });
  const result = review.buildPrivateApplicationPipelineReviewResult({
    store: store({ applications: [application({ currentStage: "RECRUITER_CONTACT" })] }),
    generatedAt: "2026-08-07T12:00:00Z",
    decisions: [decision],
  });
  assert.equal(result.generatedApplicationEvents[0].eventType, "RECRUITER_CONTACT_RECORDED");
  assert.equal(result.generatedApplicationEvents[0].externalActionPerformedByStaffordOS, false);
});

test("recent outcomes come only from existing events", () => {
  const result = build(
    store({
      applicationEvents: [
        event({ eventId: syntheticActionId("event_submit"), eventType: "SUBMITTED_MANUAL_EXTERNAL" }),
        event({ eventId: syntheticActionId("event_screen"), eventType: "SCREENING_RECORDED" }),
      ],
    }),
  );
  assert.equal(result.dailyCommand.recentOutcomes.length, 1);
  assert.equal(result.dailyCommand.recentOutcomes[0].eventType, "SCREENING_RECORDED");
});

test("repository fixtures use synthetic values only", () => {
  const testSource = readFileSync(new URL(import.meta.url), "utf8");
  assert.match(testSource, /Synthetic Health Systems/);
  assert.match(testSource, /synthetic_/);
  assert.doesNotMatch(testSource, /privjobopp_[0-9a-f]{12,}/i);
  assert.doesNotMatch(testSource, /https?:\/\/|@[a-z0-9.-]+\.[a-z]{2,}/i);
});
