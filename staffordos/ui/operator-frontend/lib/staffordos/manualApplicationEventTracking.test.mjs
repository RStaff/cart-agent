import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/manualApplicationEventTracking.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runManualApplicationEventTracking.mjs");
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

const tracking = requireTypeScriptModule(modulePath);

function manualApplication(overrides = {}) {
  return {
    sourceRecordId: "synthetic_source_001",
    opportunityId: "privjobopp_synthetic001",
    analysisRunId: "privjobanalysis_synthetic001",
    companyName: "Synthetic Health Systems",
    roleTitle: "Synthetic AI Governance Lead",
    requisitionAlias: "REQ-SYN-001",
    submissionOccurred: true,
    submissionMethod: "MANUAL_EXTERNAL",
    submissionChannel: "Synthetic careers portal",
    submittedAt: "2026-08-03",
    submittedAtPrecision: "DATE",
    resumeFilename: null,
    coverLetterStatus: "UNKNOWN",
    employerResponseStatus: "NONE_RECORDED",
    operatorConfirmed: true,
    limitations: ["Synthetic fixture only."],
    ...overrides,
  };
}

function build(inputs, existingApplications = []) {
  return tracking.buildManualApplicationTrackingResult({
    applications: inputs,
    existingApplications,
    generatedAt: "2026-08-07T12:00:00Z",
  });
}

test("manual external submission remains distinct from StaffordOS submission", () => {
  const result = build([manualApplication()]);
  const app = result.applications[0];
  assert.equal(app.status, "SUBMITTED_MANUAL_EXTERNAL");
  assert.equal(app.submissionMethod, "MANUAL_EXTERNAL");
  assert.equal(app.submittedByStaffordOS, false);
  assert.equal(app.applicationSubmittedByThisWorkflow, false);
  assert.equal(result.applicationEvents.some((event) => event.eventType === "SUBMITTED_MANUAL_EXTERNAL"), true);
  assert.equal(result.auditSummary.noApplicationSubmitted, true);
});

test("Opportunity state and Application state remain separate", () => {
  const app = build([manualApplication()]).applications[0];
  assert.equal(app.workspaceId, "professional");
  assert.equal(app.capabilityFamily, "Career Operations");
  assert.equal(app.opportunityId, "privjobopp_synthetic001");
  assert.equal(Object.hasOwn(app, "opportunityStatus"), false);
});

test("existing Application cannot be duplicated silently", () => {
  const first = build([manualApplication()]).applications[0];
  const duplicate = build([manualApplication({ sourceRecordId: "synthetic_source_002" })], [first]);
  assert.equal(duplicate.applications.length, 0);
  assert.equal(duplicate.duplicateReview[0].duplicateStatus, "CONFIRMED_DUPLICATE");
});

test("possible duplicate by company and role is held for review", () => {
  const first = build([manualApplication({ opportunityId: null, requisitionAlias: "REQ-SYN-A" })]).applications[0];
  const duplicate = build([
    manualApplication({
      sourceRecordId: "synthetic_source_003",
      opportunityId: null,
      requisitionAlias: "REQ-SYN-B",
      submittedAt: "2026-08-04",
    }),
  ], [first]);
  assert.equal(duplicate.applications.length, 0);
  assert.equal(duplicate.duplicateReview[0].duplicateStatus, "POSSIBLE_DUPLICATE");
});

test("unknown submission date and time stay unknown when explicitly allowed", () => {
  const app = build([
    manualApplication({
      submittedAt: null,
      submittedAtPrecision: "UNKNOWN",
      allowUnknownSubmittedAt: true,
      submissionChannel: null,
      allowUnknownSubmissionChannel: true,
    }),
  ]).applications[0];
  assert.equal(app.submittedAt, null);
  assert.equal(app.submittedAtPrecision, "UNKNOWN");
  assert.equal(app.nextReviewAt, null);
});

test("unknown resume and cover letter stay unknown", () => {
  const app = build([manualApplication({ resumeFilename: null, coverLetterStatus: "UNKNOWN" })]).applications[0];
  assert.equal(app.resumeReference.status, "UNKNOWN");
  assert.equal(app.resumeReference.resumeIsCanonicalCareerTruth, false);
  assert.equal(app.coverLetterReference.status, "UNKNOWN");
});

test("private legacy resume reference does not copy or verify resume content", () => {
  const app = build([manualApplication({ resumeFilename: "synthetic_resume.pdf" })]).applications[0];
  assert.equal(app.resumeReference.status, "PRIVATE_LEGACY_REFERENCE");
  assert.equal(app.resumeReference.authority, "ROSS_CONFIRMED");
  assert.equal(app.resumeReference.resumeIsCanonicalCareerTruth, false);
  assert.match(app.resumeReference.limitations.join(" "), /cannot verify canonical Career facts/);
});

test("employer response is not inferred from a submission", () => {
  const app = build([manualApplication({ employerResponseStatus: undefined })]).applications[0];
  assert.equal(app.employerResponseStatus, "NONE_RECORDED");
  assert.equal(app.noEmployerInterestInferred, true);
});

test("application does not imply fit or interview probability", () => {
  const app = build([manualApplication()]).applications[0];
  assert.equal(app.noFitInferred, true);
  assert.equal(Object.hasOwn(app, "employerSuccessProbability"), false);
  assert.equal(Object.hasOwn(app, "interviewProbability"), false);
  assert.match(app.limitations.join(" "), /does not imply/);
});

test("follow-up task never sends messages and requires operator approval", () => {
  const task = build([manualApplication()]).followUpReviews[0];
  assert.equal(task.communicationAllowed, false);
  assert.equal(task.operatorApprovalRequired, true);
  assert.match(task.limitations.join(" "), /does not send messages/);
});

test("generic ten-business-day follow-up is a proposal only", () => {
  const task = build([manualApplication({ submittedAt: "2026-08-03" })]).followUpReviews[0];
  assert.equal(task.reviewDate, "2026-08-17");
  assert.match(task.employerGuidance, /override/i);
});

test("incomplete candidate remains needs operator confirmation and creates no Application", () => {
  const result = build([
    manualApplication({
      sourceRecordId: "synthetic_source_incomplete",
      companyName: "Synthetic Security Vendor",
      roleTitle: null,
      submissionOccurred: false,
      submittedAt: null,
      submissionChannel: null,
      operatorConfirmed: false,
    }),
  ]);
  assert.equal(result.applications.length, 0);
  assert.equal(result.confirmationNeeded[0].status, "NEEDS_OPERATOR_CONFIRMATION");
});

test("mission cannot create StaffordOS-submitted Applications", () => {
  const result = build([
    manualApplication({
      sourceRecordId: "synthetic_source_future_submit",
      submissionMethod: "SUBMITTED_FUTURE_STAFFORDOS",
    }),
  ]);
  assert.equal(result.applications.length, 0);
  assert.match(result.confirmationNeeded[0].limitations.join(" "), /cannot create StaffordOS-submitted/);
});

test("pipeline summary contains counts without vanity metrics", () => {
  const result = build([
    manualApplication(),
    manualApplication({
      sourceRecordId: "synthetic_source_004",
      opportunityId: "privjobopp_synthetic004",
      companyName: "Synthetic Robotics",
      roleTitle: "Synthetic Automation Manager",
      requisitionAlias: "REQ-SYN-004",
    }),
  ]);
  assert.equal(result.pipelineSummary.submittedApplications, 2);
  assert.equal(result.pipelineSummary.conversionRatesAvailable, false);
  assert.equal(Object.hasOwn(result.pipelineSummary, "winRate"), false);
  assert.equal(Object.hasOwn(result.pipelineSummary, "employerSuccessRate"), false);
});

test("positioning hypothesis remains hypothesis and does not become Learning", () => {
  const result = build([
    manualApplication({
      positioningHypotheses: ["Synthetic governance positioning may be useful; validate against outcomes."],
    }),
  ]);
  assert.equal(result.positioningHypotheses[0].recordType, "POSITIONING_HYPOTHESIS");
  assert.equal(result.positioningHypotheses[0].learningCreated, false);
});

test("future UI read model excludes private paths and private artifacts", () => {
  const readModel = build([manualApplication()]).futureReadModel[0];
  assert.equal(readModel.privatePathVisible, false);
  assert.equal(readModel.rawResumeVisible, false);
  assert.equal(readModel.rawCoverLetterVisible, false);
  assert.equal(readModel.portalCredentialsVisible, false);
  assert.equal(readModel.recruiterContactVisible, false);
  assert.equal(readModel.connectedToOs, false);
});

test("private outputs are written outside Git with owner-private permissions", () => {
  const outputRoot = mkdtempSync(path.join(os.tmpdir(), "j001-05a-apps-"));
  try {
    const result = build([manualApplication()]);
    const written = tracking.writeManualApplicationTrackingOutputs({ outputRoot, repositoryRoot: root, result });
    assert.equal(written.privatePathVisible, false);
    assert.equal(written.artifactNames.includes("applications.json"), true);
    const mode = statSync(path.join(written.runDirectory, "applications.json")).mode & 0o777;
    assert.equal(mode, 0o600);
    const dirMode = statSync(written.runDirectory).mode & 0o777;
    assert.equal(dirMode, 0o700);
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
});

test("private output helper refuses repository-internal roots", () => {
  const result = build([manualApplication()]);
  assert.throws(
    () =>
      tracking.writeManualApplicationTrackingOutputs({
        outputRoot: path.join(root, "staffordos/job-search/synthetic-private-output"),
        repositoryRoot: root,
        result,
      }),
    /outside the repository/,
  );
});

test("normal CLI summary exposes only counts and safety flags", () => {
  const summary = tracking.buildManualApplicationCliSummary(build([manualApplication()]));
  assert.equal(summary.applicationsCreated, 1);
  assert.equal(summary.privatePathVisible, false);
  assert.equal(Object.hasOwn(summary, "companyName"), false);
  assert.equal(Object.hasOwn(summary, "roleTitle"), false);
});

test("source and CLI have no submit, message, provider, AI, API, database, /os, or /operator path", () => {
  const combined = `${source}\n${cliSource}`;
  assert.doesNotMatch(combined, /\bfetch\s*\(/);
  assert.doesNotMatch(combined, /send(Message|Email)|submitApplication|createPayment|stripe|shopify/i);
  assert.doesNotMatch(combined, /from\s+["'][^"']*(ollama|openai|anthropic)/i);
  assert.doesNotMatch(combined, /from\s+["'][^"']*(prisma|database|sql)/i);
  assert.doesNotMatch(combined, /from\s+["'][^"']*\/os|from\s+["'][^"']*\/operator/);
});

test("repository fixtures use synthetic values only", () => {
  const testSource = readFileSync(new URL(import.meta.url), "utf8");
  assert.match(testSource, /Synthetic Health Systems/);
  assert.match(testSource, /privjobopp_synthetic001/);
});
