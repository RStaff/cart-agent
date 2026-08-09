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
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/applicationReviewWorkspace.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runApplicationReviewWorkspace.mjs");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const reviewSource = readFileSync(modulePath, "utf8");
const cliSource = readFileSync(cliPath, "utf8");
const implementationSource = `${reviewSource}\n${cliSource}`;

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

const review = requireTypeScriptModule(modulePath);
const generatedAt = "2026-08-09T12:00:00Z";
const syntheticJobUrl = "https://jobs.example.test/apply/123";

function evidence(id) {
  return {
    evidenceId: `evidence_${id}`,
    category: "SUPPORTED_VERIFIED",
    safePositioning: `Evidence-backed ${id} positioning.`,
    reason: `Synthetic ${id} evidence.`,
    limitations: ["Synthetic fixture."],
  };
}

function missingSkill(id) {
  return {
    skill: id,
    coverage: "MISSING",
    reason: `Review ${id} before manual application.`,
    limitations: ["Synthetic fixture."],
  };
}

function packageRecord(id, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_ready_to_apply_application_package.v1",
    workflowVersion: "J003.04",
    packageId: `package_${id}`,
    recommendationId: `rec_${id}`,
    workflowActionState: "READY_TO_APPLY",
    opportunityId: `opportunity_${id}`,
    queueItemId: `queue_${id}`,
    sourceRecordId: `source_${id}`,
    company: overrides.company || "Example Automation",
    role: overrides.role || "AI Automation Product Manager",
    canonicalJobUrl: overrides.canonicalJobUrl === undefined ? syntheticJobUrl : overrides.canonicalJobUrl,
    canonicalJobUrlAuthority: overrides.canonicalJobUrl === null ? "UNKNOWN" : "J002_SOURCE_RECORD",
    recommendationState: {
      recommendation: "APPLY_NOW",
      applicationReadiness: "READY_FOR_OPERATOR_APPROVED_APPLICATION",
      workflowState: "READY_TO_APPLY",
      recommendedNextAction: "Review the package before manual application.",
    },
    explainableFitSummary: {
      available: true,
      fitRecommendation: "Strong deterministic fit from existing Explainable Fit.",
      coverage: { PROVEN: 2, PARTIAL: 0, TRANSFERABLE: 1, MISSING: 0, UNKNOWN: 0 },
      majorBlockers: [],
      limitations: ["Synthetic fit fixture."],
    },
    recommendedResumeVersion: {
      status: "SELECTED_EXISTING_RESUMEVERSION",
      resumeVersionId: `resume_${id}`,
      safeLabel: "ROLE_TARGETED_RESUME / PDF / SUPPORTED_VERIFIED / 2026-08-01 / abc12345",
      factSafetyStatus: overrides.factSafetyStatus || "SUPPORTED_VERIFIED",
      reviewRequired: false,
      limitations: ["Synthetic ResumeVersion fixture."],
      resumeGenerated: false,
      resumeMutated: false,
      rawResumeTextVisible: false,
      privatePathVisible: false,
    },
    supportingCareerEvidence: overrides.supportingCareerEvidence || [evidence("automation"), evidence("product")],
    relevantStrengths: overrides.relevantStrengths || [
      "Evidence-backed automation positioning.",
      "Evidence-backed product positioning.",
    ],
    missingSkills: overrides.missingSkills || [],
    resumeUpdateRequirements: overrides.resumeUpdateRequirements || [],
    applicationReadiness: overrides.applicationReadiness || "READY",
    blockingIssues: overrides.blockingIssues || [],
    recommendedNextAction: "Human-review the package, then apply manually outside StaffordOS.",
    humanReviewRequired: true,
    deterministicRulesOnly: true,
    applicationCreated: false,
    applicationSubmitted: false,
    resumeGenerated: false,
    resumeMutated: false,
    coverLetterGenerated: false,
    messageSent: false,
    browserAutomationUsed: false,
    externalProviderCall: false,
    externalAiUsed: false,
    ollamaUsed: false,
    privatePathVisible: false,
    rawJobTextVisible: false,
    rawResumeTextVisible: false,
    sourceUrlVisibleInReadModel: false,
    limitations: ["Synthetic package fixture."],
  };
}

function packageResult(records) {
  return {
    schemaVersion: "staffordos.job_search.private_ready_to_apply_application_package_result.v1",
    workflowVersion: "J003.04",
    generatedAt,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    sourceAuthority: {
      workflowStateReused: true,
      recommendationReadModelReused: true,
      opportunityQueueReused: true,
      explainableFitReused: true,
      resumeVersionReused: true,
      careerEvidenceReused: true,
      recommendationLogicModified: false,
      discoveryModified: false,
      providerAdded: false,
    },
    packages: records,
    readModel: records.map((record) => ({
      schemaVersion: "staffordos.job_search.private_ready_to_apply_application_package_read_model.v1",
      packageId: record.packageId,
      recommendationId: record.recommendationId,
      opportunityId: record.opportunityId,
      company: record.company,
      role: record.role,
      applicationReadiness: record.applicationReadiness,
      canonicalJobUrlKnown: Boolean(record.canonicalJobUrl),
      resumeVersionLabel: record.recommendedResumeVersion.safeLabel,
      resumeVersionStatus: record.recommendedResumeVersion.status,
      factSafetyStatus: record.recommendedResumeVersion.factSafetyStatus,
      supportingEvidenceCount: record.supportingCareerEvidence.length,
      missingSkillCount: record.missingSkills.length,
      blockingIssueCount: record.blockingIssues.length,
      resumeUpdateRequirementCount: record.resumeUpdateRequirements.length,
      recommendedNextAction: record.recommendedNextAction,
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
      limitations: ["Synthetic read model fixture."],
    })),
    summary: {
      readyToApplyItemsReviewed: records.length,
      packagesCreated: records.length,
      ready: records.filter((record) => record.applicationReadiness === "READY").length,
      needsResumeReview: records.filter((record) => record.applicationReadiness === "NEEDS_RESUME_REVIEW").length,
      needsEvidenceReview: records.filter((record) => record.applicationReadiness === "NEEDS_EVIDENCE_REVIEW").length,
      blocked: records.filter((record) => record.applicationReadiness === "BLOCKED").length,
      humanReviewRequired: true,
      applicationsCreated: 0,
      applicationsSubmitted: 0,
      resumesGenerated: 0,
      resumesMutated: 0,
      messagesSent: 0,
    },
    auditSummary: {
      noRecommendationLogicModified: true,
      noDiscoveryModified: true,
      noProviderAdded: true,
      noApplicationCreated: true,
      noApplicationSubmitted: true,
      noResumeGenerated: true,
      noResumeMutated: true,
      noCoverLetterGenerated: true,
      noMessageSent: true,
      noLinkedInMutated: true,
      noBrowserAutomation: true,
      noExternalProviderCall: true,
      noExternalAi: true,
      noOllama: true,
      noOsConnection: true,
      noOperatorConnection: true,
      noCareerEvidenceMutated: true,
      noCareerFactPromoted: true,
      privatePathVisible: false,
      rawJobTextVisible: false,
      rawResumeTextVisible: false,
    },
  };
}

test("application review decisions and states are deterministic", () => {
  assert.deepEqual(review.APPLICATION_REVIEW_DECISIONS, ["REVIEWED_READY", "NEEDS_CHANGES", "HOLD", "CANCELLED"]);
  assert.deepEqual(review.APPLICATION_REVIEW_STATES, [
    "PENDING_REVIEW",
    "MANUAL_APPLICATION_READY",
    "NEEDS_CHANGES",
    "HELD",
    "CANCELLED",
  ]);
});

test("workspace displays existing J003.04 package fields without duplicating package logic", () => {
  const ready = packageRecord("ready");
  const result = review.buildApplicationReviewWorkspace({
    generatedAt,
    packageResult: packageResult([ready]),
  });
  const item = result.workspaceItems[0];

  assert.equal(result.summary.packagesLoaded, 1);
  assert.equal(item.company, "Example Automation");
  assert.equal(item.role, "AI Automation Product Manager");
  assert.equal(item.canonicalJobUrl, syntheticJobUrl);
  assert.equal(item.opportunityId, "opportunity_ready");
  assert.equal(item.recommendation, "APPLY_NOW");
  assert.equal(item.explainableFitSummary.available, true);
  assert.equal(item.recommendedResumeVersion.resumeVersionId, "resume_ready");
  assert.equal(item.supportingCareerEvidence.length, 2);
  assert.equal(item.relevantStrengths.length, 2);
  assert.equal(item.missingSkills.length, 0);
  assert.equal(item.applicationReadiness, "READY");
  assert.equal(item.reviewState, "PENDING_REVIEW");
  assert.equal(item.humanReviewRequired, true);
  assert.equal(item.applicationCreated, false);
  assert.equal(item.applicationSubmitted, false);
});

test("REVIEWED_READY records manual application readiness without submission", () => {
  const ready = packageRecord("ready");
  const packages = packageResult([ready]);
  const decision = review.buildApplicationReviewDecision({
    packageResult: packages,
    packageId: ready.packageId,
    reviewDecision: "REVIEWED_READY",
    reviewedAt: generatedAt,
    operatorConfirmed: true,
    reviewNotes: "Reviewed privately.",
  });
  const result = review.buildApplicationReviewWorkspace({
    generatedAt,
    packageResult: packages,
    reviewDecisions: [decision],
  });
  const item = result.workspaceItems[0];

  assert.equal(decision.reviewState, "MANUAL_APPLICATION_READY");
  assert.equal(decision.manualApplicationReady, true);
  assert.equal(decision.applicationCreated, false);
  assert.equal(decision.applicationSubmitted, false);
  assert.equal(decision.messageSent, false);
  assert.equal(item.manualApplicationReady, true);
  assert.equal(result.summary.manualApplicationReady, 1);
  assert.match(decision.completionProof, /manual application outside StaffordOS/);
});

test("REVIEWED_READY cannot override a non-ready package", () => {
  const blocked = packageRecord("blocked", {
    applicationReadiness: "BLOCKED",
    blockingIssues: ["Canonical job URL is missing."],
    canonicalJobUrl: null,
  });

  assert.throws(
    () =>
      review.buildApplicationReviewDecision({
        packageResult: packageResult([blocked]),
        packageId: blocked.packageId,
        reviewDecision: "REVIEWED_READY",
        reviewedAt: generatedAt,
        operatorConfirmed: true,
      }),
    /requires a READY application package/,
  );
});

test("NEEDS_CHANGES, HOLD, and CANCELLED project explicit review states", () => {
  const changes = packageRecord("changes", { applicationReadiness: "NEEDS_RESUME_REVIEW" });
  const hold = packageRecord("hold");
  const cancelled = packageRecord("cancelled");
  const packages = packageResult([changes, hold, cancelled]);
  const decisions = [
    review.buildApplicationReviewDecision({
      packageResult: packages,
      packageId: changes.packageId,
      reviewDecision: "NEEDS_CHANGES",
      reviewedAt: "2026-08-09T12:00:00Z",
      operatorConfirmed: true,
    }),
    review.buildApplicationReviewDecision({
      packageResult: packages,
      packageId: hold.packageId,
      reviewDecision: "HOLD",
      reviewedAt: "2026-08-09T12:01:00Z",
      operatorConfirmed: true,
    }),
    review.buildApplicationReviewDecision({
      packageResult: packages,
      packageId: cancelled.packageId,
      reviewDecision: "CANCELLED",
      reviewedAt: "2026-08-09T12:02:00Z",
      operatorConfirmed: true,
    }),
  ];
  const result = review.buildApplicationReviewWorkspace({ generatedAt, packageResult: packages, reviewDecisions: decisions });

  assert.equal(result.summary.needsChanges, 1);
  assert.equal(result.summary.hold, 1);
  assert.equal(result.summary.cancelled, 1);
  assert.equal(result.summary.manualApplicationReady, 0);
  assert.equal(result.summary.applicationsSubmitted, 0);
});

test("review decisions are append-only and latest decision supersedes visibly", () => {
  const ready = packageRecord("ready");
  const packages = packageResult([ready]);
  const hold = review.buildApplicationReviewDecision({
    packageResult: packages,
    packageId: ready.packageId,
    reviewDecision: "HOLD",
    reviewedAt: "2026-08-09T12:00:00Z",
    operatorConfirmed: true,
  });
  const reviewed = review.buildApplicationReviewDecision({
    packageResult: packages,
    packageId: ready.packageId,
    reviewDecision: "REVIEWED_READY",
    reviewedAt: "2026-08-09T12:30:00Z",
    operatorConfirmed: true,
    existingDecisions: [hold],
  });
  const result = review.buildApplicationReviewWorkspace({
    generatedAt,
    packageResult: packages,
    reviewDecisions: [hold, reviewed],
  });

  assert.equal(reviewed.supersedesDecisionId, hold.decisionId);
  assert.equal(result.reviewDecisions.length, 2);
  assert.equal(result.workspaceItems[0].latestReviewDecision.reviewDecision, "REVIEWED_READY");
  assert.equal(result.workspaceItems[0].manualApplicationReady, true);
});

test("private writers store decisions and workspace outside Git", () => {
  const ready = packageRecord("ready");
  const packages = packageResult([ready]);
  const decision = review.buildApplicationReviewDecision({
    packageResult: packages,
    packageId: ready.packageId,
    reviewDecision: "HOLD",
    reviewedAt: generatedAt,
    operatorConfirmed: true,
  });
  const workspace = review.buildApplicationReviewWorkspace({ generatedAt, packageResult: packages, reviewDecisions: [decision] });
  const privateDecisionRoot = mkdtempSync(path.join(tmpdir(), "application-review-decision-"));
  const privateOutputRoot = mkdtempSync(path.join(tmpdir(), "application-review-workspace-"));

  const decisionWrite = review.writeApplicationReviewDecision({
    decisionRoot: privateDecisionRoot,
    repositoryRoot: root,
    decision,
  });
  const workspaceWrite = review.writeApplicationReviewWorkspaceOutputs({
    outputRoot: privateOutputRoot,
    repositoryRoot: root,
    result: workspace,
  });

  assert.equal(decisionWrite.privatePathVisible, false);
  assert.equal(workspaceWrite.privatePathVisible, false);
  assert.equal(statSync(privateDecisionRoot).mode & 0o777, 0o700);
  assert.equal(existsSync(path.join(privateDecisionRoot, "application_review_decisions.ndjson")), true);
  assert.equal(workspaceWrite.artifactNames.includes("application_review_workspace.json"), true);
  assert.equal(workspaceWrite.artifactNames.includes("manual_application_ready.json"), true);
  assert.equal(workspaceWrite.artifactNames.includes("applications.json"), false);
  assert.equal(workspaceWrite.artifactNames.includes("messages.json"), false);
  assert.equal(workspaceWrite.artifactNames.includes("resume_writes.json"), false);
});

test("private writers reject repository output roots", () => {
  const ready = packageRecord("ready");
  const packages = packageResult([ready]);
  const decision = review.buildApplicationReviewDecision({
    packageResult: packages,
    packageId: ready.packageId,
    reviewDecision: "HOLD",
    reviewedAt: generatedAt,
    operatorConfirmed: true,
  });
  const workspace = review.buildApplicationReviewWorkspace({ generatedAt, packageResult: packages, reviewDecisions: [decision] });

  assert.throws(
    () =>
      review.writeApplicationReviewDecision({
        decisionRoot: path.join(root, "staffordos/job-search/tmp-application-review-decisions"),
        repositoryRoot: root,
        decision,
      }),
    /outside the repository/,
  );
  assert.throws(
    () =>
      review.writeApplicationReviewWorkspaceOutputs({
        outputRoot: path.join(root, "staffordos/job-search/tmp-application-review-workspace"),
        repositoryRoot: root,
        result: workspace,
      }),
    /outside the repository/,
  );
});

test("loaders accept package result and review decision files", () => {
  const ready = packageRecord("ready");
  const packages = packageResult([ready]);
  const decision = review.buildApplicationReviewDecision({
    packageResult: packages,
    packageId: ready.packageId,
    reviewDecision: "HOLD",
    reviewedAt: generatedAt,
    operatorConfirmed: true,
  });
  const privateRoot = mkdtempSync(path.join(tmpdir(), "application-review-loader-"));
  const packagesFile = path.join(privateRoot, "packages.json");
  const decisionsFile = path.join(privateRoot, "decisions.ndjson");

  writeFileSync(packagesFile, `${JSON.stringify({ applicationPackageResult: packages }, null, 2)}\n`, "utf8");
  writeFileSync(decisionsFile, `${JSON.stringify(decision)}\n`, "utf8");

  assert.equal(review.loadApplicationPackageResultFile(packagesFile).packages.length, 1);
  assert.equal(review.loadApplicationReviewDecisionsFile(decisionsFile).length, 1);
});

test("read model hides URL values, raw payloads, and private paths", () => {
  const ready = packageRecord("ready");
  const result = review.buildApplicationReviewWorkspace({ generatedAt, packageResult: packageResult([ready]) });
  const readModel = result.readModel[0];
  const serialized = JSON.stringify(readModel);

  assert.equal(readModel.canonicalJobUrlKnown, true);
  assert.equal(readModel.sourceUrlVisible, false);
  assert.equal(readModel.privatePathVisible, false);
  assert.equal(readModel.rawJobTextVisible, false);
  assert.equal(readModel.rawResumeTextVisible, false);
  assert.equal(serialized.includes(syntheticJobUrl), false);
});

test("CLI summary is redacted and preserves closed execution flags", () => {
  const ready = packageRecord("ready");
  const packages = packageResult([ready]);
  const decision = review.buildApplicationReviewDecision({
    packageResult: packages,
    packageId: ready.packageId,
    reviewDecision: "REVIEWED_READY",
    reviewedAt: generatedAt,
    operatorConfirmed: true,
  });
  const result = review.buildApplicationReviewWorkspace({ generatedAt, packageResult: packages, reviewDecisions: [decision] });
  const summary = review.buildApplicationReviewWorkspaceCliSummary({
    result,
    decisionWritten: decision,
    privateArtifactsWritten: 9,
  });
  const serialized = JSON.stringify(summary);

  assert.equal(summary.manualApplicationReady, 1);
  assert.equal(summary.decisionWritten.reviewDecision, "REVIEWED_READY");
  assert.equal(summary.noApplicationCreated, true);
  assert.equal(summary.noApplicationSubmitted, true);
  assert.equal(summary.noResumeGenerated, true);
  assert.equal(summary.noResumeMutated, true);
  assert.equal(summary.noMessageSent, true);
  assert.equal(serialized.includes(syntheticJobUrl), false);
});

test("implementation reuses packages and does not duplicate discovery or recommendation logic", () => {
  assert.doesNotMatch(reviewSource, /buildReadyToApplyApplicationPackages/);
  assert.doesNotMatch(reviewSource, /buildCareerWorkflowState|buildOpportunityRecommendation/);
  assert.doesNotMatch(reviewSource, /buildPrivateJobSourceImportQueue|runGreenhouseDiscovery/);
  assert.doesNotMatch(reviewSource, /rankingSummary|totalScore|categoryContributions|priorityTier/);
  assert.doesNotMatch(reviewSource, /APPLY_WITH_POSITIONING|STRONG_APPLY|finalRecommendation\s*===/);
});

test("implementation has no external action, AI, route, provider write, or resume mutation path", () => {
  assert.doesNotMatch(implementationSource, /fetch\s*\(|XMLHttpRequest|method:\s*["']POST/);
  assert.doesNotMatch(implementationSource, /applyToJob|submitApplication|sendRecruiter|sendMessage|mailto:/);
  assert.doesNotMatch(implementationSource, /generateResume|rewriteResume|mutateResume|writeResume|createResumeVersion/);
  assert.doesNotMatch(implementationSource, /runOllama|OLLAMA_HOST|from\s+["']openai|from\s+["']@anthropic|modelAdapter|chiefOfStaffModel/i);
  assert.doesNotMatch(implementationSource, /from\s+["'][^"']*\/os|from\s+["'][^"']*\/operator|app\/os|app\/operator/);
});
