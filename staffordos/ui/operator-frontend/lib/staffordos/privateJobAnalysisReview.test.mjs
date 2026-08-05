import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const reviewPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateJobAnalysisReview.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runPrivateJobAnalysisReview.mjs");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const reviewSource = readFileSync(reviewPath, "utf8");
const cliSource = readFileSync(cliPath, "utf8");

function requireTypeScriptModule(modulePath) {
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
    return requireFromFrontend(modulePath);
  } finally {
    if (originalTsExtension) {
      Module._extensions[".ts"] = originalTsExtension;
    } else {
      delete Module._extensions[".ts"];
    }
  }
}

const review = requireTypeScriptModule(reviewPath);

function requirement(id, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_requirement.v1",
    id,
    workspaceId: "professional",
    jobOpportunityId: "privjobopp_synthetic001",
    sourceId: "privjobsrc_synthetic001",
    requirementText: "Synthetic requirement text.",
    normalizedRequirement: "synthetic requirement text.",
    requirementCategory: "Required skill",
    requirementLevel: "REQUIRED",
    importanceClassification: "Required",
    evidenceExpectation: "Requires mapped CareerFact and CareerEvidence before use in resume positioning.",
    yearsMentioned: null,
    degreeMentioned: null,
    certificationMentioned: null,
    technologyOrSkill: "ai",
    responsibilityOrQualification: null,
    sourceAuthority: "SOURCE_EXPLICIT",
    sourceLocation: { sourceField: "listingText", lineNumber: 1, sectionHint: "requirements" },
    sourceExcerptReference: `listingText:line:${id}`,
    extractionMethod: "DETERMINISTIC_EXTRACTION",
    extractionConfidence: "High",
    operatorReviewStatus: "Needs review",
    ambiguity: null,
    limitations: ["Synthetic fixture only."],
    createdAt: "2026-08-05T12:00:00Z",
    privateRecord: true,
    testOnly: false,
    ...overrides,
  };
}

function mapping(requirementId, classification = "UNKNOWN", overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_requirement_evidence_mapping.v1",
    id: `privjobmap_${requirementId}`,
    requirementId,
    jobOpportunityId: "privjobopp_synthetic001",
    careerFactIds: ["careerfact_synthetic001"],
    careerEvidenceIds: ["careerev_synthetic001"],
    classification,
    explanation: "Synthetic mapping.",
    supportLimitations: ["Do not present this as fully proven without Ross review."],
    verificationStatus: "UNREVIEWED",
    conflictStatus: "NO_CONFLICT",
    operatorReviewRequirement: "Needs Ross review.",
    safePositioning: "Hold for Ross review before use.",
    prohibitedOverstatement: [
      "Do not invent employers, titles, dates, certifications, metrics, or outcomes.",
      "Do not turn studied or local-only work into professional production use.",
    ],
    matchedSignals: ["synthetic"],
    createdAt: "2026-08-05T12:00:00Z",
    privateRecord: true,
    testOnly: false,
    ...overrides,
  };
}

function question(id, requirementId, priority = 1) {
  return {
    id,
    requirementId,
    priority,
    question: "Can Ross confirm safe synthetic wording for this requirement?",
    whyItMatters: "Synthetic fixture affects recommendation and positioning.",
    allowedResponses: ["Confirm supported wording", "Mark as transferable only", "Keep unknown for now"],
    privateRecord: true,
  };
}

function bundle() {
  const requirements = [
    requirement("req_unknown"),
    requirement("req_transferable"),
    requirement("req_partial"),
    requirement("req_years", {
      requirementText: "Must have 7 years of synthetic platform experience.",
      normalizedRequirement: "must have 7 years of synthetic platform experience.",
      yearsMentioned: 7,
    }),
    requirement("req_proven"),
    requirement("req_unaffected"),
  ];
  const mappings = [
    mapping("req_unknown", "UNKNOWN"),
    mapping("req_transferable", "UNKNOWN"),
    mapping("req_partial", "UNKNOWN"),
    mapping("req_years", "PROVEN", {
      prohibitedOverstatement: ["Do not claim the requested years of experience without years authority."],
    }),
    mapping("req_proven", "PROVEN", {
      verificationStatus: "VERIFIED",
      supportLimitations: ["Evidence-backed synthetic proof is available."],
      safePositioning: "May be used with evidence-cited wording.",
    }),
    mapping("req_unaffected", "MISSING", { careerFactIds: [], careerEvidenceIds: [] }),
  ];
  return {
    workflowVersion: "J001.03A",
    opportunity: {
      id: "privjobopp_synthetic001",
      companyName: "Example Works Cooperative",
      roleTitle: "Synthetic Product Role",
      observedAt: "2026-08-05T12:00:00Z",
    },
    requirements,
    mappings,
    fitAssessment: {
      schemaVersion: "staffordos.job_search.private_fit_assessment.v1",
      opportunityId: "privjobopp_synthetic001",
      applicationState: "SUBMITTED_MANUAL_EXTERNAL",
      finalRecommendation: "ALREADY_APPLIED_MONITOR",
      recommendationExplanation: "Synthetic manual application already happened outside StaffordOS.",
      coverage: { PROVEN: 2, PARTIAL: 0, TRANSFERABLE: 0, MISSING: 1, UNKNOWN: 3 },
      dimensions: [],
      majorBlockers: [],
      applicationEffort: "MODERATE",
      strategicValue: "MEDIUM",
      numericEmployerSuccessProbability: null,
      limitations: ["Synthetic fixture only."],
      createdAt: "2026-08-05T12:00:00Z",
      privateRecord: true,
      testOnly: false,
    },
    positioningBrief: {
      schemaVersion: "staffordos.job_search.private_positioning_brief.v1",
      opportunityId: "privjobopp_synthetic001",
      strongestSupportedThemes: ["Synthetic proven theme"],
      evidenceToEmphasize: [],
      transferableExperience: [],
      unsupportedClaimsToAvoid: ["Synthetic unsupported claim"],
      primaryGap: "Synthetic gap",
      recommendedResumeEmphasis: [],
      recommendedProjectExamples: [],
      recommendedInterviewStories: [],
      employerSpecificLanguage: [],
      questionsRequiringRossReview: [],
      factEvidencePositioningBoundary: "FACT_TO_EVIDENCE_TO_POSITIONING",
      finalResumeGenerated: false,
      createdAt: "2026-08-05T12:00:00Z",
      privateRecord: true,
    },
    reviewQueue: [
      question("review_unknown", "req_unknown", 1),
      question("review_transferable", "req_transferable", 2),
      question("review_partial", "req_partial", 3),
      question("review_years", "req_years", 4),
      question("review_proven", "req_proven", 5),
    ],
    applicationEvent: {
      schemaVersion: "staffordos.job_search.private_application_event.v1",
      opportunityId: "privjobopp_synthetic001",
      applicationState: "SUBMITTED_MANUAL_EXTERNAL",
      submissionChannel: "MANUAL_EXTERNAL",
      submittedBy: "Ross",
      submittedAt: null,
      resumeFilenameUsed: null,
      coverLetterStatus: "UNKNOWN",
      operatorAuthority: "ROSS_CONFIRMED",
      currentEmployerResponse: "NONE_RECORDED",
      nextFollowUpReviewDate: null,
      limitations: ["Synthetic fixture only."],
      submittedByStaffordOS: false,
    },
    nextAction: {
      schemaVersion: "staffordos.job_search.private_next_action.v1",
      opportunityId: "privjobopp_synthetic001",
      action: "Monitor employer response and prepare synthetic evidence.",
      whyNow: "Synthetic manual submission already exists.",
      deadlineOrReviewDate: null,
      evidence: [],
      limitation: "Synthetic fixture only.",
      rossApprovalRequired: true,
      completionProof: "Synthetic completion proof.",
      externalActionAuthorized: false,
    },
    auditSummary: {
      schemaVersion: "staffordos.job_search.private_analysis_audit.v1",
      workflowVersion: "J001.03A",
      opportunityId: "privjobopp_synthetic001",
      generatedAt: "2026-08-05T12:00:00Z",
      noExternalNetwork: true,
      noExternalAi: true,
      noOllama: true,
      noApi: true,
      noDatabase: true,
      noApplicationSubmitted: true,
      noMessageSent: true,
      noResumeMutated: true,
      sourceTextStoredOnlyInPrivateArtifacts: true,
      outputDirectoryRedacted: "$HOME/.staffordos/private/professional/job-search/analysis/<opportunity>/<run>",
      summary: {
        requirementCount: 6,
        mappingCount: 6,
        reviewQuestionCount: 5,
        finalRecommendation: "ALREADY_APPLIED_MONITOR",
      },
    },
  };
}

function loaded(previousBundle = bundle()) {
  return {
    metadata: {
      analysisRunId: "privjobanalysis_synthetic001",
      opportunityId: "privjobopp_synthetic001",
      company: "Example Works Cooperative",
      role: "Synthetic Product Role",
      analysisTimestamp: "2026-08-05T12:00:00Z",
      applicationState: "SUBMITTED_MANUAL_EXTERNAL",
      requirementCount: 6,
      unansweredReviewQuestionCount: 5,
      recommendation: "ALREADY_APPLIED_MONITOR",
      runLabel: "j001_03a_synthetic",
      runDirectory: "/tmp/synthetic-private-run",
      privatePathVisible: false,
    },
    bundle: previousBundle,
  };
}

function decision(overrides = {}) {
  return review.createPrivateJobAnalysisOperatorDecision({
    bundle: bundle(),
    analysisRunId: "privjobanalysis_synthetic001",
    reviewQuestionId: "review_transferable",
    requirementId: "req_transferable",
    decisionType: "CONFIRM_TRANSFERABLE",
    selectedCareerFactIds: ["careerfact_synthetic001"],
    selectedEvidenceIds: ["careerev_synthetic001"],
    createdAt: "2026-08-05T12:05:00Z",
    operatorConfirmed: true,
    ...overrides,
  });
}

function writeSyntheticRun(rootDir, runBundle = bundle()) {
  const runDir = path.join(rootDir, "privjobopp_synthetic001", "j001_03a_synthetic");
  mkdirSync(runDir, { recursive: true, mode: 0o700 });
  const artifacts = {
    "requirements.json": runBundle.requirements,
    "requirement_evidence_mappings.json": runBundle.mappings,
    "fit_assessment.json": runBundle.fitAssessment,
    "positioning_brief.json": runBundle.positioningBrief,
    "role_review_queue.json": runBundle.reviewQueue,
    "application_event.json": runBundle.applicationEvent,
    "next_action.json": runBundle.nextAction,
    "processing_audit_summary.json": runBundle.auditSummary,
  };
  for (const [name, value] of Object.entries(artifacts)) {
    writeFileSync(path.join(runDir, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }
  return runDir;
}

test("analysis selection uses opaque IDs and hides private paths", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "j001-03b-runs-"));
  try {
    writeSyntheticRun(tmp);
    const runs = review.listPrivateJobAnalysisRuns({ analysisRoot: tmp, repositoryRoot: root });

    assert.equal(runs.length, 1);
    assert.match(runs[0].analysisRunId, /^privjobanalysis_/);
    assert.equal(runs[0].opportunityId, "privjobopp_synthetic001");
    assert.equal(runs[0].privatePathVisible, false);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("operator decisions require confirmation", () => {
  assert.throws(
    () =>
      review.createPrivateJobAnalysisOperatorDecision({
        bundle: bundle(),
        analysisRunId: "privjobanalysis_synthetic001",
        reviewQuestionId: "review_transferable",
        requirementId: "req_transferable",
        decisionType: "CONFIRM_TRANSFERABLE",
        selectedCareerFactIds: ["careerfact_synthetic001"],
        selectedEvidenceIds: ["careerev_synthetic001"],
        createdAt: "2026-08-05T12:05:00Z",
        operatorConfirmed: false,
      }),
    /OPERATOR_CONFIRMATION_REQUIRED/,
  );
});

test("decisions are append-only and supersession is explicit", () => {
  const first = decision({ createdAt: "2026-08-05T12:05:00Z" });
  const second = decision({
    decisionType: "KEEP_UNKNOWN",
    selectedCareerFactIds: [],
    selectedEvidenceIds: [],
    createdAt: "2026-08-05T12:06:00Z",
    existingDecisions: [first],
  });

  assert.notEqual(first.decisionId, second.decisionId);
  assert.equal(second.supersedesDecisionId, first.decisionId);
  assert.equal(first.canonicalCareerFactUpdated, false);
  assert.equal(second.canonicalCareerFactUpdated, false);
});

test("DEFER changes no mapping and KEEP_UNKNOWN remains UNKNOWN", () => {
  const deferDecision = decision({ decisionType: "DEFER", selectedCareerFactIds: [], selectedEvidenceIds: [] });
  const keepUnknown = decision({
    reviewQuestionId: "review_unknown",
    requirementId: "req_unknown",
    decisionType: "KEEP_UNKNOWN",
    selectedCareerFactIds: [],
    selectedEvidenceIds: [],
  });
  const updated = review.applyPrivateJobAnalysisDecisions({ bundle: bundle(), decisions: [deferDecision, keepUnknown] });

  assert.equal(updated.find((item) => item.requirementId === "req_transferable").classification, "UNKNOWN");
  assert.equal(updated.find((item) => item.requirementId === "req_unknown").classification, "UNKNOWN");
});

test("CONFIRM_TRANSFERABLE and CONFIRM_PARTIALLY_SUPPORTED cannot become PROVEN", () => {
  const transferable = decision({ decisionType: "CONFIRM_TRANSFERABLE" });
  const partial = decision({
    reviewQuestionId: "review_partial",
    requirementId: "req_partial",
    decisionType: "CONFIRM_PARTIALLY_SUPPORTED",
    selectedCareerFactIds: ["careerfact_synthetic001"],
    selectedEvidenceIds: ["careerev_synthetic001"],
  });
  const updated = review.applyPrivateJobAnalysisDecisions({ bundle: bundle(), decisions: [transferable, partial] });

  assert.equal(updated.find((item) => item.requirementId === "req_transferable").classification, "TRANSFERABLE");
  assert.equal(updated.find((item) => item.requirementId === "req_partial").classification, "PARTIAL");
  assert.notEqual(updated.find((item) => item.requirementId === "req_transferable").classification, "PROVEN");
  assert.notEqual(updated.find((item) => item.requirementId === "req_partial").classification, "PROVEN");
});

test("CONFIRM_SUPPORTED requires compatible evidence authority", () => {
  assert.throws(
    () =>
      decision({
        reviewQuestionId: "review_unknown",
        requirementId: "req_unknown",
        decisionType: "CONFIRM_SUPPORTED",
      }),
    /CONFIRM_SUPPORTED_REQUIRES_PROVEN_MAPPING/,
  );

  const proven = decision({
    reviewQuestionId: "review_proven",
    requirementId: "req_proven",
    decisionType: "CONFIRM_SUPPORTED",
  });
  const updated = review.applyPrivateJobAnalysisDecisions({ bundle: bundle(), decisions: [proven] });
  assert.equal(updated.find((item) => item.requirementId === "req_proven").classification, "PROVEN");
});

test("unsupported years and resume wording alone cannot verify", () => {
  assert.throws(
    () =>
      decision({
        reviewQuestionId: "review_years",
        requirementId: "req_years",
        decisionType: "CONFIRM_SUPPORTED",
      }),
    /UNSUPPORTED_YEARS_CANNOT_BE_CONFIRMED/,
  );

  const resumeOnlyBundle = bundle();
  resumeOnlyBundle.mappings = resumeOnlyBundle.mappings.map((item) =>
    item.requirementId === "req_proven"
      ? { ...item, supportLimitations: ["Resume wording alone is not verification authority."] }
      : item,
  );
  assert.throws(
    () =>
      review.createPrivateJobAnalysisOperatorDecision({
        bundle: resumeOnlyBundle,
        analysisRunId: "privjobanalysis_synthetic001",
        reviewQuestionId: "review_proven",
        requirementId: "req_proven",
        decisionType: "CONFIRM_SUPPORTED",
        selectedCareerFactIds: ["careerfact_synthetic001"],
        selectedEvidenceIds: ["careerev_synthetic001"],
        createdAt: "2026-08-05T12:05:00Z",
        operatorConfirmed: true,
      }),
    /RESUME_WORDING_CANNOT_VERIFY/,
  );
});

test("conflicts remain visible", () => {
  const conflict = decision({
    reviewQuestionId: "review_unknown",
    requirementId: "req_unknown",
    decisionType: "FLAG_CONFLICT",
    selectedCareerFactIds: [],
    selectedEvidenceIds: [],
  });
  const updated = review.applyPrivateJobAnalysisDecisions({ bundle: bundle(), decisions: [conflict] });
  const mapping = updated.find((item) => item.requirementId === "req_unknown");

  assert.equal(mapping.classification, "UNKNOWN");
  assert.equal(mapping.conflictStatus, "CONFLICT_REQUIRES_REVIEW");
});

test("reanalysis creates a deterministic changed bundle and preserves manual application state", () => {
  const prior = loaded();
  const decisions = [decision({ decisionType: "CONFIRM_TRANSFERABLE" })];
  const result = review.regeneratePrivateJobAnalysisFromDecisions({
    previous: prior,
    decisions,
    generatedAt: "2026-08-05T12:10:00Z",
  });

  assert.equal(result.regeneratedBundle.applicationEvent.applicationState, "SUBMITTED_MANUAL_EXTERNAL");
  assert.equal(result.regeneratedBundle.fitAssessment.finalRecommendation, "ALREADY_APPLIED_MONITOR");
  assert.equal(result.regeneratedBundle.fitAssessment.numericEmployerSuccessProbability, null);
  assert.equal(result.regeneratedBundle.mappings.find((item) => item.requirementId === "req_transferable").classification, "TRANSFERABLE");
  assert.equal(result.regeneratedBundle.mappings.find((item) => item.requirementId === "req_unaffected").classification, "MISSING");
  assert.equal(prior.bundle.mappings.find((item) => item.requirementId === "req_transferable").classification, "UNKNOWN");
  assert.equal(result.changeReport.classificationChanges.length, 1);
  assert.equal(result.changeReport.applicationStatePreserved, true);
});

test("regenerated private analysis writes a new version outside Git", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "j001-03b-output-"));
  try {
    const prior = loaded();
    const decisions = [decision({ decisionType: "CONFIRM_TRANSFERABLE" })];
    const result = review.regeneratePrivateJobAnalysisFromDecisions({
      previous: prior,
      decisions,
      generatedAt: "2026-08-05T12:10:00Z",
    });
    const written = review.writeRegeneratedPrivateJobAnalysis({
      outputRoot: tmp,
      repositoryRoot: root,
      previous: prior,
      regeneratedBundle: result.regeneratedBundle,
      changeReport: result.changeReport,
    });

    assert.match(written.regeneratedAnalysisRunId, /^privjobanalysis_/);
    assert.ok(written.privateArtifactNames.includes("change_report.json"));
    assert.ok(written.privateArtifacts.every((artifact) => artifact.startsWith(tmp)));
    assert.equal(written.changeReport.classificationChanges.length, 1);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("no duplicate application, submission, message, resume, provider, API, database, AI, Ollama, /os, or /operator path exists", () => {
  const combinedSource = `${reviewSource}\n${cliSource}`;

  assert.doesNotMatch(combinedSource, /createApplication|submitApplication|sendMessage|mutateResume/i);
  assert.doesNotMatch(combinedSource, /fetch\(|XMLHttpRequest|\/api\/|from ["']@prisma\/client|prisma\.|database\.|dbClient|sql`/i);
  assert.doesNotMatch(combinedSource, /from ["'][^"']*(ollama|openai|anthropic|gemini)|\b(ollama|openai|anthropic|gemini)\.|modelAdapter/i);
  assert.doesNotMatch(combinedSource, /from ["'][^"']*\/os|from ["'][^"']*\/operator|operatorWriteIsolation|STAFFORDOS_LOCAL_OPERATOR_WRITES_ENABLED/i);
});
