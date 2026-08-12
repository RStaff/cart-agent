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
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/applicationFollowUpResponseTracking.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runApplicationFollowUpResponseTracking.mjs");
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

const engagement = requireTypeScriptModule(modulePath);
const generatedAt = "2026-08-17T12:00:00Z";

function id(value) {
  return `synthetic_${value}`;
}

function application(overrides = {}) {
  const applicationId = overrides.applicationId || id("application_001");
  const nextReviewAt = Object.prototype.hasOwnProperty.call(overrides, "nextReviewAt")
    ? overrides.nextReviewAt
    : "2026-08-17";
  return {
    schemaVersion: "staffordos.job_search.private_application.v1",
    applicationId,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    opportunityId: overrides.opportunityId ?? id(`opportunity_${applicationId}`),
    analysisRunId: overrides.analysisRunId ?? null,
    companyReference: {
      label: overrides.companyName || "Synthetic Automation Systems",
      requisitionAlias: overrides.requisitionAlias || null,
    },
    roleReference: {
      title: overrides.roleTitle || "AI Automation Lead",
    },
    status: overrides.status || "SUBMITTED_MANUAL_EXTERNAL",
    submissionMethod: "MANUAL_EXTERNAL",
    submissionChannel: overrides.submissionChannel ?? "Synthetic careers portal",
    submittedAt: overrides.submittedAt ?? "2026-08-03",
    submittedAtPrecision: overrides.submittedAtPrecision || "DATE",
    operatorConfirmed: true,
    resumeReference: {
      resumeReferenceId: id(`resume_${applicationId}`),
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
      coverLetterReferenceId: id(`cover_${applicationId}`),
      applicationId,
      status: "UNKNOWN",
      filename: null,
      authority: "UNKNOWN",
      privacy: "Professional owner-private",
      limitations: ["Synthetic fixture."],
    },
    employerResponseStatus: overrides.employerResponseStatus || "NONE_RECORDED",
    currentStage: overrides.currentStage || "SUBMITTED_MANUAL_EXTERNAL",
    nextAction: {
      nextActionId: id(`next_${applicationId}`),
      applicationId,
      confirmationRecordId: null,
      what: "Synthetic tracking action.",
      whyNow: "Synthetic fixture.",
      when: nextReviewAt,
      proofOfCompletion: "Synthetic proof.",
      authorityRequired: "ROSS_APPROVAL",
      limitations: ["Synthetic fixture."],
    },
    nextReviewAt,
    sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL",
    privacy: "Professional owner-private",
    duplicateStatus: "NO_DUPLICATE",
    limitations: ["Synthetic fixture."],
    createdAt: "2026-08-03T12:00:00Z",
    updatedAt: "2026-08-03T12:00:00Z",
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
    eventId: overrides.eventId || id("event_001"),
    applicationId: overrides.applicationId || id("application_001"),
    eventType: overrides.eventType || "SUBMITTED_MANUAL_EXTERNAL",
    occurredAt: overrides.occurredAt || "2026-08-03",
    occurredAtPrecision: "DATE",
    sourceAuthority: "ROSS_CONFIRMED_MANUAL_EXTERNAL",
    operatorConfirmed: true,
    channel: null,
    evidenceReferences: [],
    limitations: ["Synthetic fixture."],
    createdAt: overrides.createdAt || "2026-08-03T12:00:00Z",
    submittedByStaffordOS: false,
    externalActionPerformedByStaffordOS: false,
  };
}

function followUp(overrides = {}) {
  return {
    followUpId: overrides.followUpId || id("followup_001"),
    applicationId: overrides.applicationId || id("application_001"),
    reviewDate: overrides.reviewDate ?? "2026-08-17",
    reason: "Synthetic review policy.",
    recommendedAction: "Review whether follow-up is appropriate.",
    employerGuidance: "Unknown; employer or recruiter instructions override generic timing.",
    communicationAllowed: false,
    operatorApprovalRequired: true,
    status: overrides.status || "SCHEDULED",
    limitations: ["Synthetic fixture."],
  };
}

function store(overrides = {}) {
  return {
    applications: overrides.applications || [application()],
    applicationEvents: overrides.applicationEvents || [event()],
    followUpReviews: overrides.followUpReviews || [followUp()],
    confirmationNeeded: [],
  };
}

function build(inputStore, asOf = generatedAt) {
  return engagement.buildApplicationEngagementQueue({
    store: inputStore,
    generatedAt: asOf,
  });
}

test("follow-up, response, and next-action states are deterministic constants", () => {
  assert.deepEqual(engagement.FOLLOW_UP_STATES, ["NOT_DUE", "DUE", "OVERDUE", "COMPLETED", "NOT_REQUIRED"]);
  assert.deepEqual(engagement.RESPONSE_STATES, [
    "NO_RESPONSE",
    "RECRUITER_CONTACT",
    "HIRING_MANAGER_CONTACT",
    "INTERVIEW_REQUEST",
    "REJECTION",
    "WITHDRAWN",
    "OTHER_RESPONSE",
  ]);
  assert.deepEqual(engagement.NEXT_ENGAGEMENT_ACTIONS, [
    "FOLLOW_UP",
    "REVIEW_RESPONSE",
    "PREPARE_FOR_INTERVIEW",
    "NO_ACTION",
    "CLOSE_OUT",
  ]);
});

test("no existing Application fails closed", () => {
  assert.throws(
    () => build(store({ applications: [], applicationEvents: [], followUpReviews: [] })),
    /requires existing authoritative Application records/,
  );
});

test("due, overdue, and not-due follow-up states are derived deterministically", () => {
  const dueApp = application({ applicationId: id("application_due"), nextReviewAt: "2026-08-17" });
  const overdueApp = application({ applicationId: id("application_overdue"), nextReviewAt: "2026-08-14" });
  const futureApp = application({ applicationId: id("application_future"), nextReviewAt: "2026-08-21" });
  const result = build(
    store({
      applications: [futureApp, dueApp, overdueApp],
      applicationEvents: [
        event({ applicationId: dueApp.applicationId }),
        event({ applicationId: overdueApp.applicationId }),
        event({ applicationId: futureApp.applicationId }),
      ],
      followUpReviews: [
        followUp({ applicationId: dueApp.applicationId, reviewDate: "2026-08-17" }),
        followUp({ applicationId: overdueApp.applicationId, reviewDate: "2026-08-14" }),
        followUp({ applicationId: futureApp.applicationId, reviewDate: "2026-08-21" }),
      ],
    }),
  );
  const byId = new Map(result.engagementItems.map((item) => [item.applicationId, item]));

  assert.equal(byId.get(dueApp.applicationId).followUpState, "DUE");
  assert.equal(byId.get(dueApp.applicationId).recommendedNextEngagementAction, "FOLLOW_UP");
  assert.equal(byId.get(overdueApp.applicationId).followUpState, "OVERDUE");
  assert.equal(byId.get(overdueApp.applicationId).recommendedNextEngagementAction, "FOLLOW_UP");
  assert.equal(byId.get(futureApp.applicationId).followUpState, "NOT_DUE");
  assert.equal(byId.get(futureApp.applicationId).recommendedNextEngagementAction, "NO_ACTION");
  assert.equal(result.summary.followUpDue, 1);
  assert.equal(result.summary.followUpOverdue, 1);
});

test("deterministic 10-business-day policy is used only when existing dates are absent", () => {
  const app = application({ applicationId: id("application_policy"), nextReviewAt: null });
  const result = build(
    store({
      applications: [app],
      applicationEvents: [event({ applicationId: app.applicationId })],
      followUpReviews: [],
    }),
  );
  const item = result.engagementItems[0];

  assert.equal(item.followUpDueDateAuthority, "DETERMINISTIC_10_BUSINESS_DAY_POLICY");
  assert.equal(item.followUpDueDate, "2026-08-17");
  assert.equal(item.followUpState, "DUE");
});

test("recruiter response event produces REVIEW_RESPONSE without creating an event", () => {
  const app = application({ applicationId: id("application_recruiter") });
  const responseEvent = event({
    applicationId: app.applicationId,
    eventType: "RECRUITER_CONTACT_RECORDED",
    occurredAt: "2026-08-12",
  });
  const result = build(
    store({
      applications: [app],
      applicationEvents: [event({ applicationId: app.applicationId }), responseEvent],
      followUpReviews: [followUp({ applicationId: app.applicationId })],
    }),
  );
  const item = result.engagementItems[0];

  assert.equal(item.responseState, "RECRUITER_CONTACT");
  assert.equal(item.responseStateAuthority, "APPLICATION_EVENT_HISTORY");
  assert.equal(item.followUpState, "COMPLETED");
  assert.equal(item.recommendedNextEngagementAction, "REVIEW_RESPONSE");
  assert.equal(item.lastApplicationEvent.eventType, "RECRUITER_CONTACT_RECORDED");
  assert.equal(result.auditSummary.noApplicationEventCreated, true);
});

test("interview scheduled event hands off to PREPARE_FOR_INTERVIEW", () => {
  const app = application({ applicationId: id("application_interview") });
  const result = build(
    store({
      applications: [app],
      applicationEvents: [
        event({ applicationId: app.applicationId }),
        event({ applicationId: app.applicationId, eventType: "INTERVIEW_SCHEDULED", occurredAt: "2026-08-13" }),
      ],
      followUpReviews: [followUp({ applicationId: app.applicationId })],
    }),
  );
  const item = result.engagementItems[0];

  assert.equal(item.responseState, "INTERVIEW_REQUEST");
  assert.equal(item.recommendedNextEngagementAction, "PREPARE_FOR_INTERVIEW");
  assert.equal(result.summary.interviewPreparationItems, 1);
  assert.equal(item.applicationSubmitted, false);
  assert.equal(item.messageSent, false);
});

test("rejection and withdrawal states close out without inventing reasons", () => {
  const rejected = application({ applicationId: id("application_rejected") });
  const withdrawn = application({ applicationId: id("application_withdrawn"), currentStage: "WITHDRAWN" });
  const result = build(
    store({
      applications: [rejected, withdrawn],
      applicationEvents: [
        event({ applicationId: rejected.applicationId, eventType: "EMPLOYER_REJECTION_RECORDED", occurredAt: "2026-08-15" }),
        event({ applicationId: withdrawn.applicationId, eventType: "WITHDRAWAL_RECORDED", occurredAt: "2026-08-15" }),
      ],
      followUpReviews: [],
    }),
  );
  const byId = new Map(result.engagementItems.map((item) => [item.applicationId, item]));

  assert.equal(byId.get(rejected.applicationId).responseState, "REJECTION");
  assert.equal(byId.get(rejected.applicationId).recommendedNextEngagementAction, "CLOSE_OUT");
  assert.equal(byId.get(rejected.applicationId).followUpState, "NOT_REQUIRED");
  assert.equal(byId.get(withdrawn.applicationId).responseState, "WITHDRAWN");
  assert.equal(result.summary.closeOutItems, 2);
  assert.doesNotMatch(JSON.stringify(result), /because|reason supplied by employer/i);
});

test("ApplicationEvent outcomes project current stage for follow-up without mutating application records", () => {
  const app = application({ applicationId: id("application_projected_rejection") });
  const rejection = event({
    applicationId: app.applicationId,
    eventType: "EMPLOYER_REJECTION_RECORDED",
    occurredAt: "2026-08-16",
  });
  const result = build(
    store({
      applications: [app],
      applicationEvents: [event({ applicationId: app.applicationId }), rejection],
      followUpReviews: [followUp({ applicationId: app.applicationId })],
    }),
  );
  const item = result.engagementItems[0];

  assert.equal(app.currentStage, "SUBMITTED_MANUAL_EXTERNAL");
  assert.equal(item.currentStage, "REJECTED_BY_EMPLOYER");
  assert.equal(item.employerResponseStatus, "REJECTED");
  assert.equal(item.responseState, "REJECTION");
  assert.equal(item.followUpState, "NOT_REQUIRED");
  assert.equal(item.recommendedNextEngagementAction, "CLOSE_OUT");
});

test("silence remains no response and does not become rejection", () => {
  const app = application({ applicationId: id("application_silent"), submittedAt: "2026-07-01", nextReviewAt: null });
  const result = build(
    store({
      applications: [app],
      applicationEvents: [event({ applicationId: app.applicationId })],
      followUpReviews: [],
    }),
  );
  const item = result.engagementItems[0];

  assert.equal(item.responseState, "NO_RESPONSE");
  assert.notEqual(item.responseState, "REJECTION");
  assert.equal(item.currentStage, "SUBMITTED_MANUAL_EXTERNAL");
  assert.equal(item.followUpState, "OVERDUE");
  assert.equal(result.summary.closeOutItems, 0);
});

test("read model is redacted and contains no recruiter details or private paths", () => {
  const result = build(store());
  const readModel = result.readModel[0];
  const serialized = JSON.stringify(readModel);

  assert.equal(readModel.privatePathVisible, false);
  assert.equal(readModel.recruiterContactVisible, false);
  assert.equal(readModel.messageSent, false);
  assert.equal(readModel.externalProviderCall, false);
  const privateRootMarker = ["/", "Users", "/"].join("");
  assert.equal(serialized.includes(privateRootMarker), false);
});

test("private writer stores engagement artifacts outside Git and creates no Application artifacts", () => {
  const result = build(store());
  const privateRoot = mkdtempSync(path.join(tmpdir(), "career-engagement-"));
  const written = engagement.writeApplicationEngagementQueueOutputs({
    outputRoot: privateRoot,
    repositoryRoot: root,
    result,
  });

  assert.equal(written.privatePathVisible, false);
  assert.equal(statSync(written.runDirectory).mode & 0o777, 0o700);
  assert.equal(written.artifactNames.includes("career_engagement_queue.json"), true);
  assert.equal(written.artifactNames.includes("follow_up_states.json"), true);
  assert.equal(written.artifactNames.includes("response_states.json"), true);
  assert.equal(written.artifactNames.includes("applications.json"), false);
  assert.equal(written.artifactNames.includes("application_events.json"), false);
  assert.equal(written.artifactNames.includes("messages.json"), false);
  assert.equal(existsSync(path.join(written.runDirectory, "career_engagement_queue.json")), true);
});

test("private writer rejects repository output roots", () => {
  const result = build(store());
  assert.throws(
    () =>
      engagement.writeApplicationEngagementQueueOutputs({
        outputRoot: path.join(root, "staffordos/job-search/tmp-career-engagement"),
        repositoryRoot: root,
        result,
      }),
    /outside the repository/,
  );
});

test("store loader and CLI summary preserve closed execution flags", () => {
  const privateRoot = mkdtempSync(path.join(tmpdir(), "career-engagement-loader-"));
  const storeFile = path.join(privateRoot, "store.json");
  writeFileSync(storeFile, `${JSON.stringify({ store: store() }, null, 2)}\n`, "utf8");
  const loaded = engagement.loadApplicationEngagementStoreFile(storeFile);
  const result = build(loaded);
  const summary = engagement.buildApplicationEngagementCliSummary(result, 6);

  assert.equal(loaded.applications.length, 1);
  assert.equal(summary.privateArtifactsWritten, 6);
  assert.equal(summary.noApplicationCreated, true);
  assert.equal(summary.noApplicationSubmitted, true);
  assert.equal(summary.noApplicationEventCreated, true);
  assert.equal(summary.noMessageSent, true);
  assert.equal(summary.noOutreachGenerated, true);
  assert.equal(summary.noExternalProviderCall, true);
});

test("implementation reuses application authority without creating a parallel application model", () => {
  assert.match(source, /from "\.\/manualApplicationEventTracking"/);
  assert.match(source, /loadPrivateApplicationPipelineStore/);
  assert.doesNotMatch(source, /PRIVATE_APPLICATION_SCHEMA_VERSION\s*=/);
  assert.doesNotMatch(source, /buildManualApplicationTrackingResult|buildApplication\(/);
  assert.doesNotMatch(source, /buildPrivateApplicationPipelineReviewResult/);
});

test("implementation has no communication, submission, provider, AI, route, or resume mutation path", () => {
  assert.doesNotMatch(implementationSource, /fetch\s*\(|XMLHttpRequest|method:\s*["']POST/);
  assert.doesNotMatch(implementationSource, /applyToJob|submitApplication|sendRecruiter|sendMessage|mailto:/);
  assert.doesNotMatch(implementationSource, /generateOutreach|generateMessage|draftMessage|generateResume|rewriteResume|mutateResume|writeResume/);
  assert.doesNotMatch(implementationSource, /runOllama|OLLAMA_HOST|from\s+["']openai|from\s+["']@anthropic|modelAdapter|chiefOfStaffModel/i);
  assert.doesNotMatch(implementationSource, /from\s+["'][^"']*\/os|from\s+["'][^"']*\/operator|app\/os|app\/operator/);
});
