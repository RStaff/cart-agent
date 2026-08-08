import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const modulePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/resumeReviewQueueResolution.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runResumeAssetReconciliation.mjs");
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

const resolution = requireTypeScriptModule(modulePath);

function mkdirTemp() {
  return path.join(os.tmpdir(), `j001-06c-${Math.random().toString(16).slice(2)}`);
}

function application(overrides = {}) {
  const applicationId = overrides.applicationId || "synthetic_application_001";
  return {
    applicationId,
    workspaceId: "professional",
    capabilityFamily: "Career Operations",
    companyReference: {
      label: overrides.companyName || "Synthetic Analytics",
      requisitionAlias: null,
    },
    roleReference: {
      title: overrides.roleTitle || "Synthetic Platform Analyst",
    },
    status: "SUBMITTED_MANUAL_EXTERNAL",
    submissionMethod: "MANUAL_EXTERNAL",
    submissionChannel: "Synthetic careers portal",
    submittedAt: overrides.submittedAt || "2026-08-07",
    submittedAtPrecision: "DATE",
    operatorConfirmed: true,
    resumeReference: {
      resumeReferenceId: `synthetic_resume_ref_${applicationId}`,
      applicationId,
      status: overrides.resumeFilename ? "PRIVATE_LEGACY_REFERENCE" : "UNKNOWN",
      filename: overrides.resumeFilename || null,
      assetReferenceId: null,
      version: null,
      createdAt: null,
      purpose: "Synthetic fixture only.",
      authority: overrides.resumeFilename ? "ROSS_CONFIRMED" : "UNKNOWN",
      privacy: "Professional owner-private",
      limitations: ["Synthetic fixture only."],
      resumeIsCanonicalCareerTruth: false,
    },
    coverLetterReference: {
      coverLetterReferenceId: `synthetic_cover_ref_${applicationId}`,
      applicationId,
      status: "UNKNOWN",
      filename: null,
      authority: "UNKNOWN",
      privacy: "Professional owner-private",
      limitations: ["Synthetic fixture only."],
    },
    employerResponseStatus: "NONE_RECORDED",
    currentStage: "SUBMITTED_MANUAL_EXTERNAL",
    nextAction: {
      nextActionId: `synthetic_next_${applicationId}`,
      applicationId,
      confirmationRecordId: null,
      what: "Synthetic next action.",
      whyNow: "Synthetic fixture only.",
      when: null,
      proofOfCompletion: "Synthetic proof.",
      authorityRequired: "ROSS_APPROVAL",
      limitations: ["Synthetic fixture only."],
    },
    nextReviewAt: null,
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

function resumeVersion(overrides = {}) {
  const digest = overrides.contentDigest || "a".repeat(64);
  const resumeVersionId = overrides.resumeVersionId || `synthetic_resume_${digest.slice(0, 6)}`;
  return {
    schemaVersion: "staffordos.job_search.private_resume_version.v1",
    resumeVersionId,
    workspaceId: "professional",
    assetReferenceId: `synthetic_asset_${digest.slice(0, 8)}`,
    sourceDocumentReference: {
      privateSourceId: overrides.privateSourceId || `synthetic_source_${digest.slice(0, 8)}`,
      sourceRootAuthority: "APPROVED_PRIVATE_CAREER_SOURCE_ROOT",
      sourcePath: "PRIVATE",
      sourcePathRedacted: "~/private",
    },
    originalFilename: overrides.originalFilename || "Synthetic Platform Resume.txt",
    contentDigest: digest,
    documentFormat: overrides.documentFormat || "TXT",
    observedAt: overrides.observedAt || "2026-08-06T12:00:00Z",
    createdAt: null,
    modifiedAtObserved: overrides.modifiedAtObserved || "2026-08-06T12:00:00Z",
    purpose: overrides.purpose || "ROLE_TARGETED_RESUME",
    targetRoleFamily: overrides.targetRoleFamily || "DATA_ANALYTICS",
    targetCompanyReference: null,
    targetRoleReference: null,
    sourceAuthority: "PRIVATE_CAREER_SOURCE_DOCUMENT",
    privacy: "Professional owner-private",
    reviewStatus: "NEEDS_OPERATOR_REVIEW",
    factSafetyStatus: overrides.factSafetyStatus || "UNKNOWN",
    supersedesResumeVersionId: null,
    derivedFromResumeVersionId: null,
    claimSafety: [],
    limitations: ["Synthetic fixture only."],
    resumeIsCareerTruth: false,
  };
}

function artifacts(overrides = {}) {
  const versionA = resumeVersion({
    resumeVersionId: "synthetic_resume_alpha",
    originalFilename: "Synthetic Platform Analyst Resume.txt",
    contentDigest: "a".repeat(64),
    targetRoleFamily: "DATA_ANALYTICS",
  });
  const versionB = resumeVersion({
    resumeVersionId: "synthetic_resume_beta",
    originalFilename: "Synthetic Automation Resume.txt",
    contentDigest: "b".repeat(64),
    targetRoleFamily: "AUTOMATION",
  });
  const futureVersion = resumeVersion({
    resumeVersionId: "synthetic_resume_future",
    originalFilename: "Synthetic Platform Analyst Resume v2.txt",
    contentDigest: "c".repeat(64),
    modifiedAtObserved: "2026-08-09T12:00:00Z",
  });
  const versions = overrides.resumeVersions || [versionA, versionB, futureVersion];
  return {
    sourceInventory: [],
    assetCompatibleSources: [],
    resumeVersions: versions,
    resumeVersionReconciliation: [],
    exactDuplicateGroups: [
      {
        duplicateGroupId: "synthetic_duplicate_group",
        classification: "EXACT_DUPLICATE",
        canonicalResumeVersionId: versionA.resumeVersionId,
        memberSourceDocumentIds: ["synthetic_source_alpha", "synthetic_source_alpha_alias"],
        memberResumeVersionIds: [versionA.resumeVersionId, "synthetic_resume_alpha_alias"],
        contentDigest: versionA.contentDigest,
        automaticMergeAllowed: false,
        sourceFilesDeleted: false,
        limitations: ["Synthetic duplicate fixture."],
      },
    ],
    formatDerivativeGroups: [],
    likelyVersionFamilies: [
      {
        familyId: "synthetic_likely_family",
        classification: "LIKELY_VERSION_FAMILY",
        resumeVersionIds: [versionA.resumeVersionId, futureVersion.resumeVersionId],
        reason: "Synthetic filenames suggest a version family; operator review required.",
        canonicalSupersessionCreated: false,
        automaticMergeAllowed: false,
        limitations: ["Synthetic likely-version fixture."],
      },
    ],
    sourceIntegrity: [],
    resumeLibraryHealth: {},
    operatorReviewQueue: [
      {
        reviewItemId: "synthetic_review_item_duplicate",
        safeResumeLabel: "ROLE_TARGETED_RESUME / TXT / UNKNOWN / aaaaaaaaaa",
        format: "TXT",
        digestPrefix: "aaaaaaaaaaaa",
        observedDate: "2026-08-06",
        classification: "EXACT_DUPLICATE",
        reasonForReview: "Exact duplicate source documents exist.",
        possibleRelatedSafeLabels: [],
        privatePathVisible: false,
        rawResumeContentVisible: false,
      },
    ],
    applicationLinkageReadiness:
      overrides.applicationLinkageReadiness || [
        {
          applicationId: "synthetic_application_001",
          readiness: "MULTIPLE_CANDIDATES",
          candidateResumeVersionIds: versions.map((version) => version.resumeVersionId),
          candidateSafeLabels: versions.map((version) => `${version.purpose} / ${version.documentFormat} / UNKNOWN`),
          reason: "Synthetic multiple candidates.",
          applicationResumeLinkCreated: false,
          existingUnknownDecisionChanged: false,
          privatePathVisible: false,
          limitations: ["Synthetic fixture only."],
        },
        {
          applicationId: "synthetic_application_missing",
          readiness: "SOURCE_NOT_PRESENT",
          candidateResumeVersionIds: [],
          candidateSafeLabels: [],
          reason: "Synthetic source missing.",
          applicationResumeLinkCreated: false,
          existingUnknownDecisionChanged: false,
          privatePathVisible: false,
          limitations: ["Synthetic fixture only."],
        },
      ],
    auditSummary: {},
    runDirectory: null,
  };
}

function store(overrides = {}) {
  return {
    applications:
      overrides.applications || [
        application({ applicationId: "synthetic_application_001", resumeFilename: "Synthetic Platform Analyst Resume.txt" }),
        application({
          applicationId: "synthetic_application_missing",
          companyName: "Synthetic Strategy",
          roleTitle: "Synthetic Business Analyst",
          resumeFilename: "Synthetic Missing Submitted Resume.pdf",
        }),
      ],
    applicationEvents: [],
    followUpReviews: [],
    confirmationNeeded: [
      {
        confirmationRecordId: "synthetic_confirmation_needed",
        sourceRecordId: "synthetic_source",
        workspaceId: "professional",
        companyName: "Synthetic Unconfirmed",
        roleTitle: null,
        missingRequiredFields: ["roleTitle"],
        status: "NEEDS_OPERATOR_CONFIRMATION",
        shouldCreateApplication: false,
        conciseQuestions: ["What role was submitted?"],
        limitations: ["Synthetic fixture only."],
      },
    ],
  };
}

function build(options = {}) {
  return resolution.buildResumeReviewQueueResolution({
    artifacts: options.artifacts || artifacts(),
    applicationStore: options.applicationStore || store(),
    generatedAt: "2026-08-08T12:00:00Z",
    decisions: options.decisions || [],
  });
}

test("duplicate aliases collapse for operator display while source history is preserved", () => {
  const result = build();
  const duplicate = result.duplicateCollapse.find((record) => record.duplicateGroupId === "synthetic_duplicate_group");
  assert.ok(duplicate);
  assert.equal(duplicate.collapsedForOperatorDisplay, true);
  assert.equal(duplicate.sourceHistoryPreserved, true);
  assert.equal(duplicate.sourceFilesDeleted, false);
  assert.equal(result.auditSummary.applicationResumeLinksCreated, 0);
  assert.equal(result.auditSummary.usedForSubmissionLinksCreated, 0);
});

test("candidate elimination requires a deterministic reason", () => {
  const result = build();
  assert.equal(result.candidateEliminations.length, 1);
  assert.equal(result.candidateEliminations[0].reason, "DATE_AFTER_APPLICATION");
  assert.equal(result.candidateEliminations[0].deterministic, true);
  assert.equal(result.candidateEliminations[0].subjectiveQualityUsed, false);
});

test("newest file chronology does not prove submitted usage or semantic superiority", () => {
  const result = build();
  const family = result.likelyVersionFamilyAnalysis.find((record) => record.familyId === "synthetic_likely_family");
  assert.ok(family);
  assert.equal(family.sourceChronologySupported, true);
  assert.equal(family.semanticSuperiorityInferred, false);
  assert.equal(family.supersessionCreated, false);
  assert.equal(result.auditSummary.noNewestFileWins, true);
  assert.equal(result.auditSummary.usedForSubmissionLinksCreated, 0);
});

test("filename and role-target matches do not prove submitted-resume linkage", () => {
  const result = build();
  const app = result.applicationReadiness.find((record) => record.applicationId === "synthetic_application_001");
  assert.ok(app);
  assert.equal(app.exactOriginalFilenameMatchExists, true);
  assert.equal(app.remainingCandidates.some((candidate) => candidate.roleTokenMatches.length > 0), true);
  assert.equal(app.applicationResumeLinkCreated, false);
  assert.equal(app.usedForSubmissionCreated, false);
  assert.equal(result.auditSummary.noFilenameOnlySubmissionProof, true);
  assert.equal(result.auditSummary.noRoleTargetSubmissionProof, true);
});

test("candidate preferred only narrows later review and creates no ApplicationResumeLink", () => {
  const decision = resolution.createResumeReviewDecision({
    applicationId: "synthetic_application_001",
    reviewItemId: "synthetic_review_item",
    decisionType: "CANDIDATE_PREFERRED",
    selectedResumeVersionId: "synthetic_resume_beta",
    createdAt: "2026-08-08T13:00:00Z",
  });
  const result = build({ decisions: [decision] });
  const app = result.applicationReadiness.find((record) => record.applicationId === "synthetic_application_001");
  assert.equal(app.readiness, "SINGLE_CANDIDATE_NEEDS_OPERATOR_CONFIRMATION");
  assert.deepEqual(app.remainingCandidates.map((candidate) => candidate.resumeVersionId), ["synthetic_resume_beta"]);
  assert.equal(decision.applicationResumeLinkCreated, false);
  assert.equal(decision.usedForSubmissionCreated, false);
  assert.equal(result.auditSummary.applicationResumeLinksCreated, 0);
  assert.equal(result.auditSummary.resumeLinkConfirmedEventsCreated, 0);
  assert.equal(Object.hasOwn(result, "applicationResumeLinks"), false);
});

test("UNKNOWN and DEFER remain valid without changing existing unknown decisions", () => {
  const unknown = resolution.createResumeReviewDecision({
    applicationId: "synthetic_application_001",
    reviewItemId: "synthetic_review_item",
    decisionType: "UNKNOWN",
    createdAt: "2026-08-08T13:00:00Z",
  });
  const defer = resolution.createResumeReviewDecision({
    applicationId: "synthetic_application_missing",
    reviewItemId: "synthetic_review_item_missing",
    decisionType: "DEFER",
    createdAt: "2026-08-08T13:01:00Z",
  });
  const result = build({ decisions: [unknown, defer] });
  assert.equal(result.applicationReadiness.every((record) => record.existingUnknownDecisionChanged === false), true);
  assert.equal(result.auditSummary.applicationResumeLinksCreated, 0);
  assert.equal(result.auditSummary.usedForSubmissionLinksCreated, 0);
});

test("SOURCE_MISSING_CONFIRMED creates a source-gap record but no import", () => {
  const decision = resolution.createResumeReviewDecision({
    applicationId: "synthetic_application_missing",
    reviewItemId: "synthetic_review_item_missing",
    decisionType: "SOURCE_MISSING_CONFIRMED",
    createdAt: "2026-08-08T13:00:00Z",
  });
  const result = build({ decisions: [decision] });
  const sourceGap = result.sourceGapRecords.find((record) => record.applicationId === "synthetic_application_missing");
  assert.equal(sourceGap.classification, "CONFIRMED_SOURCE_GAP");
  assert.equal(sourceGap.operatorAction, "SOURCE_DOCUMENT_NEEDED");
  assert.equal(decision.importCreated, false);
  assert.equal(result.regeneratedApplicationLinkageReadiness.find((record) => record.applicationId === "synthetic_application_missing").readiness, "CONFIRMED_SOURCE_GAP");
});

test("private outputs are outside Git, owner-private, and exclude linkage artifacts", () => {
  const base = mkdirTemp();
  const outputRoot = path.join(base, "review-resolution");
  const result = build();
  try {
    const written = resolution.writeResumeReviewQueueResolutionOutputs({
      outputRoot,
      repositoryRoot: root,
      result,
    });
    assert.equal(written.privatePathVisible, false);
    assert.equal(statSync(written.runDirectory).mode & 0o777, 0o700);
    assert.equal(written.artifactNames.includes("application_resume_links.json"), false);
    assert.equal(written.artifactNames.includes("resume_link_application_events.json"), false);
    assert.equal(statSync(path.join(written.runDirectory, "processing_audit_summary.json")).mode & 0o777, 0o600);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("append-only review decisions stay private and do not create links", () => {
  const base = mkdirTemp();
  const decisionRoot = path.join(base, "decisions");
  try {
    const decision = resolution.createResumeReviewDecision({
      applicationId: "synthetic_application_001",
      reviewItemId: "synthetic_review_item",
      decisionType: "CANDIDATE_PREFERRED",
      selectedResumeVersionId: "synthetic_resume_alpha",
      createdAt: "2026-08-08T13:00:00Z",
    });
    resolution.appendResumeReviewDecision({ decisionRoot, repositoryRoot: root, decision });
    const loaded = resolution.loadResumeReviewDecisions({ decisionRoot, repositoryRoot: root });
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].decisionType, "CANDIDATE_PREFERRED");
    assert.equal(loaded[0].applicationResumeLinkCreated, false);
    assert.equal(loaded[0].usedForSubmissionCreated, false);
    assert.equal(statSync(path.join(decisionRoot, "resume_review_decisions.ndjson")).mode & 0o777, 0o600);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("loader reads latest J001.06B artifacts without a source-root scan", () => {
  const base = mkdirTemp();
  const reconciliationRoot = path.join(base, "resume-asset-reconciliation");
  const older = path.join(reconciliationRoot, "j001_06b_20260807120000");
  const latest = path.join(reconciliationRoot, "j001_06b_20260808120000");
  mkdirSync(older, { recursive: true });
  mkdirSync(latest, { recursive: true });
  const names = [
    "resume_source_inventory.json",
    "asset_compatible_source_records.json",
    "resume_versions.json",
    "resume_version_reconciliation.json",
    "exact_duplicate_groups.json",
    "format_derivative_groups.json",
    "likely_version_families.json",
    "source_integrity.json",
    "operator_review_queue.json",
    "application_linkage_readiness.json",
  ];
  for (const directory of [older, latest]) {
    for (const name of names) writeFileSync(path.join(directory, name), "[]\n");
    writeFileSync(path.join(directory, "resume_library_health.json"), "{}\n");
    writeFileSync(path.join(directory, "processing_audit_summary.json"), "{}\n");
  }
  writeFileSync(path.join(latest, "resume_versions.json"), JSON.stringify([resumeVersion()], null, 2));
  try {
    const loaded = resolution.loadLatestResumeAssetReconciliationArtifacts({ reconciliationRoot, repositoryRoot: root });
    assert.equal(loaded.resumeVersions.length, 1);
    assert.match(loaded.runDirectory, /j001_06b_20260808120000$/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("CLI review-resolution prints counts only without private paths or content", () => {
  const base = mkdirTemp();
  const reconciliationRoot = path.join(base, "resume-asset-reconciliation");
  const runRoot = path.join(reconciliationRoot, "j001_06b_20260808120000");
  const applicationRoot = path.join(base, "applications");
  const reviewRoot = path.join(base, "review-resolution");
  mkdirSync(runRoot, { recursive: true });
  mkdirSync(applicationRoot, { recursive: true });
  const fixtureArtifacts = artifacts();
  const files = {
    "resume_source_inventory.json": fixtureArtifacts.sourceInventory,
    "asset_compatible_source_records.json": fixtureArtifacts.assetCompatibleSources,
    "resume_versions.json": fixtureArtifacts.resumeVersions,
    "resume_version_reconciliation.json": fixtureArtifacts.resumeVersionReconciliation,
    "exact_duplicate_groups.json": fixtureArtifacts.exactDuplicateGroups,
    "format_derivative_groups.json": fixtureArtifacts.formatDerivativeGroups,
    "likely_version_families.json": fixtureArtifacts.likelyVersionFamilies,
    "source_integrity.json": fixtureArtifacts.sourceIntegrity,
    "resume_library_health.json": fixtureArtifacts.resumeLibraryHealth,
    "operator_review_queue.json": fixtureArtifacts.operatorReviewQueue,
    "application_linkage_readiness.json": fixtureArtifacts.applicationLinkageReadiness,
    "processing_audit_summary.json": fixtureArtifacts.auditSummary,
  };
  for (const [name, value] of Object.entries(files)) writeFileSync(path.join(runRoot, name), `${JSON.stringify(value, null, 2)}\n`);
  writeFileSync(path.join(applicationRoot, "applications.json"), JSON.stringify(store().applications, null, 2));
  try {
    const run = spawnSync(
      process.execPath,
      [
        cliPath,
        "review-resolution",
        "--reconciliation-root",
        reconciliationRoot,
        "--application-root",
        applicationRoot,
        "--review-resolution-root",
        reviewRoot,
        "--as-of",
        "2026-08-08",
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(run.status, 0, run.stderr);
    const parsed = JSON.parse(run.stdout);
    assert.equal(parsed.workflowVersion, "J001.06C");
    assert.equal(parsed.privatePathVisible, false);
    assert.equal(parsed.applicationResumeLinksCreated, 0);
    assert.equal(parsed.usedForSubmissionLinksCreated, 0);
    assert.doesNotMatch(run.stdout, new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(run.stdout, /Synthetic Resume Content|sourcePath/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("source code exposes no prohibited external action or private UI connection", () => {
  const forbiddenRuntimePattern = /fetch\(|axios|submitApplication|sendMessage|externalAiInvoked:\s*true|usedForSubmission:\s*true|linkType:\s*["']USED_FOR_SUBMISSION/;
  const forbiddenRoutePattern = /from\s+["'][^"']*(\/os|\/operator)|app\/(os|operator)|routes\/(os|operator)/;
  assert.doesNotMatch(source, forbiddenRuntimePattern);
  assert.doesNotMatch(cliSource, forbiddenRuntimePattern);
  assert.doesNotMatch(source, forbiddenRoutePattern);
  assert.doesNotMatch(cliSource, forbiddenRoutePattern);
});
