import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const reviewPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/roleFocusedCareerEvidenceReview.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runRoleFocusedCareerEvidenceReview.mjs");
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

function requirement(id, text, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_requirement.v1",
    id,
    workspaceId: "professional",
    jobOpportunityId: "privjobopp_synthetic002",
    sourceId: "privjobsrc_synthetic002",
    requirementText: text,
    normalizedRequirement: text.toLowerCase(),
    requirementCategory: "Responsibility",
    requirementLevel: "RESPONSIBILITY",
    importanceClassification: "Responsibility",
    evidenceExpectation: "Synthetic fixture only.",
    yearsMentioned: null,
    degreeMentioned: null,
    certificationMentioned: null,
    technologyOrSkill: null,
    responsibilityOrQualification: null,
    sourceAuthority: "SOURCE_EXPLICIT",
    sourceLocation: { sourceField: "listingText", lineNumber: 1, sectionHint: "requirements" },
    sourceExcerptReference: `listingText:line:${id}`,
    extractionMethod: "DETERMINISTIC_EXTRACTION",
    extractionConfidence: "High",
    operatorReviewStatus: "Needs review",
    ambiguity: null,
    limitations: ["Synthetic fixture only."],
    createdAt: "2026-08-06T12:00:00Z",
    privateRecord: true,
    testOnly: false,
    ...overrides,
  };
}

function mapping(requirementId, classification, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_requirement_evidence_mapping.v1",
    id: `privjobmap_${requirementId}`,
    requirementId,
    jobOpportunityId: "privjobopp_synthetic002",
    careerFactIds: [`fact_${requirementId}`],
    careerEvidenceIds: [`evidence_${requirementId}`],
    classification,
    explanation: "Synthetic mapping.",
    supportLimitations: ["Resume wording alone cannot verify this claim."],
    verificationStatus: "UNREVIEWED",
    conflictStatus: "NO_CONFLICT",
    operatorReviewRequirement: "Needs Ross review.",
    safePositioning: "Hold for review.",
    prohibitedOverstatement: ["Do not invent metrics, years, titles, dates, or production use."],
    matchedSignals: ["synthetic"],
    createdAt: "2026-08-06T12:00:00Z",
    privateRecord: true,
    testOnly: false,
    ...overrides,
  };
}

function fact(id, statement, overrides = {}) {
  return {
    id,
    factType: "PROJECT",
    statement,
    verificationStatus: "PROPOSED",
    authorityClassification: "GENERATED_DOCUMENT",
    skillContext: "NEEDS_VERIFICATION",
    metricClassification: "NOT_APPLICABLE",
    limitations: ["Synthetic candidate fact only."],
    ...overrides,
  };
}

function evidence(id, overrides = {}) {
  return {
    id,
    evidenceType: "RESUME",
    sourceKind: "TEXT",
    authorityClassification: "GENERATED_DOCUMENT",
    freshness: "Historical",
    limitations: ["Resume wording is not automatic truth."],
    ...overrides,
  };
}

function bundle() {
  const requirements = [
    requirement("req_platform", "Lead an AI platform roadmap from architecture to rollout.", {
      requirementCategory: "Leadership",
    }),
    requirement("req_guardrails", "Partner with engineers on prompt evaluation frameworks and guardrails."),
    requirement("req_compensation", "Compensation and benefit information.", {
      requirementCategory: "Compensation",
      requirementLevel: "INFORMATIONAL",
    }),
  ];
  const mappings = [
    mapping("req_platform", "TRANSFERABLE"),
    mapping("req_guardrails", "UNKNOWN", { conflictStatus: "CONFLICT_REQUIRES_REVIEW" }),
    mapping("req_compensation", "UNKNOWN"),
  ];
  return {
    workflowVersion: "J001.03A",
    opportunity: {
      id: "privjobopp_synthetic002",
      companyName: "Example Works Cooperative",
      roleTitle: "Synthetic AI Product Role",
      observedAt: "2026-08-06T12:00:00Z",
    },
    requirements,
    mappings,
    fitAssessment: {
      schemaVersion: "staffordos.job_search.private_fit_assessment.v1",
      opportunityId: "privjobopp_synthetic002",
      applicationState: "SUBMITTED_MANUAL_EXTERNAL",
      finalRecommendation: "ALREADY_APPLIED_MONITOR",
      recommendationExplanation: "Synthetic manual application already happened outside StaffordOS.",
      coverage: { PROVEN: 0, PARTIAL: 0, TRANSFERABLE: 1, MISSING: 0, UNKNOWN: 2 },
      dimensions: [],
      majorBlockers: [],
      applicationEffort: "MODERATE",
      strategicValue: "MEDIUM",
      numericEmployerSuccessProbability: null,
      limitations: ["Synthetic fixture only."],
      createdAt: "2026-08-06T12:00:00Z",
      privateRecord: true,
      testOnly: false,
    },
    positioningBrief: {
      schemaVersion: "staffordos.job_search.private_positioning_brief.v1",
      opportunityId: "privjobopp_synthetic002",
      strongestSupportedThemes: [],
      evidenceToEmphasize: [],
      transferableExperience: [],
      unsupportedClaimsToAvoid: [],
      primaryGap: "Synthetic gap",
      recommendedResumeEmphasis: [],
      recommendedProjectExamples: [],
      recommendedInterviewStories: [],
      employerSpecificLanguage: [],
      questionsRequiringRossReview: [],
      factEvidencePositioningBoundary: "FACT_TO_EVIDENCE_TO_POSITIONING",
      finalResumeGenerated: false,
      createdAt: "2026-08-06T12:00:00Z",
      privateRecord: true,
    },
    reviewQueue: [],
    applicationEvent: {
      schemaVersion: "staffordos.job_search.private_application_event.v1",
      opportunityId: "privjobopp_synthetic002",
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
      opportunityId: "privjobopp_synthetic002",
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
      opportunityId: "privjobopp_synthetic002",
      generatedAt: "2026-08-06T12:00:00Z",
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
        requirementCount: 3,
        mappingCount: 3,
        reviewQuestionCount: 0,
        finalRecommendation: "ALREADY_APPLIED_MONITOR",
      },
    },
  };
}

function loaded(previousBundle = bundle()) {
  return {
    metadata: {
      analysisRunId: "privjobanalysis_synthetic002",
      opportunityId: "privjobopp_synthetic002",
      company: "Example Works Cooperative",
      role: "Synthetic AI Product Role",
      analysisTimestamp: "2026-08-06T12:00:00Z",
      applicationState: "SUBMITTED_MANUAL_EXTERNAL",
      requirementCount: 3,
      unansweredReviewQuestionCount: 0,
      recommendation: "ALREADY_APPLIED_MONITOR",
      runLabel: "s010_02d_synthetic",
      runDirectory: "/tmp/synthetic-private-run",
      privatePathVisible: false,
    },
    bundle: previousBundle,
  };
}

test("focused review ranks reusable AI product and platform items and excludes compensation", () => {
  const analysis = loaded();
  const facts = [
    fact("fact_req_platform", "Led a synthetic platform initiative from roadmap to rollout."),
    fact("fact_req_guardrails", "Designed synthetic evaluation guardrails with engineers."),
    fact("fact_req_compensation", "Synthetic compensation value."),
  ];
  const evidenceRecords = [evidence("evidence_req_platform"), evidence("evidence_req_guardrails"), evidence("evidence_req_compensation")];
  const items = review.buildRoleFocusedCareerEvidenceReviewItems({
    analysis,
    facts,
    evidence: evidenceRecords,
    maxItems: 10,
  });

  assert.equal(items.length, 2);
  assert.equal(items[0].requirementId, "req_platform");
  assert.ok(items.some((item) => item.requirementId === "req_guardrails"));
  assert.ok(items.every((item) => item.requirementId !== "req_compensation"));
  assert.ok(items[0].reusableCareerLanes.length > 0);
});

test("VERIFIED requires direct non-resume authority", () => {
  const item = review.buildRoleFocusedCareerEvidenceReviewItems({
    analysis: loaded(),
    facts: [fact("fact_req_platform", "Led a synthetic platform initiative from roadmap to rollout.")],
    evidence: [evidence("evidence_req_platform")],
    maxItems: 1,
  })[0];

  assert.throws(
    () =>
      review.createRoleFocusedCareerEvidenceDecision({
        item,
        outcome: "VERIFIED",
        selectedCareerFactIds: ["fact_req_platform"],
        selectedEvidenceIds: ["evidence_req_platform"],
        createdAt: "2026-08-06T12:05:00Z",
        operatorConfirmed: true,
      }),
    /VERIFIED_REQUIRES_DIRECT_NON_RESUME_AUTHORITY/,
  );
});

test("PARTIALLY_SUPPORTED and TRANSFERABLE require selected candidate evidence", () => {
  const item = review.buildRoleFocusedCareerEvidenceReviewItems({
    analysis: loaded(),
    facts: [fact("fact_req_platform", "Led a synthetic platform initiative from roadmap to rollout.")],
    evidence: [evidence("evidence_req_platform")],
    maxItems: 1,
  })[0];

  assert.throws(
    () =>
      review.createRoleFocusedCareerEvidenceDecision({
        item,
        outcome: "PARTIALLY_SUPPORTED",
        createdAt: "2026-08-06T12:05:00Z",
        operatorConfirmed: true,
      }),
    /SUPPORT_OUTCOME_REQUIRES_SELECTED_CANDIDATE_EVIDENCE/,
  );

  const decision = review.createRoleFocusedCareerEvidenceDecision({
    item,
    outcome: "TRANSFERABLE",
    selectedCareerFactIds: ["fact_req_platform"],
    selectedEvidenceIds: ["evidence_req_platform"],
    createdAt: "2026-08-06T12:06:00Z",
    operatorConfirmed: true,
  });
  assert.equal(decision.outcome, "TRANSFERABLE");
  assert.equal(decision.canonicalCareerEvidenceUpdated, false);
});

test("role-focused decisions update mappings without changing application state", () => {
  const analysis = loaded();
  const [platform, guardrails] = review.buildRoleFocusedCareerEvidenceReviewItems({
    analysis,
    facts: [
      fact("fact_req_platform", "Led a synthetic platform initiative from roadmap to rollout."),
      fact("fact_req_guardrails", "Designed synthetic evaluation guardrails with engineers."),
    ],
    evidence: [evidence("evidence_req_platform"), evidence("evidence_req_guardrails")],
    maxItems: 2,
  });
  const decisions = [
    review.createRoleFocusedCareerEvidenceDecision({
      item: platform,
      outcome: "TRANSFERABLE",
      selectedCareerFactIds: ["fact_req_platform"],
      selectedEvidenceIds: ["evidence_req_platform"],
      createdAt: "2026-08-06T12:05:00Z",
      operatorConfirmed: true,
    }),
    review.createRoleFocusedCareerEvidenceDecision({
      item: guardrails,
      outcome: "NEEDS_EVIDENCE",
      selectedCareerFactIds: [],
      selectedEvidenceIds: [],
      createdAt: "2026-08-06T12:06:00Z",
      operatorConfirmed: true,
    }),
  ];
  const regenerated = review.regenerateAnalysisAfterRoleFocusedCareerReview({
    previous: analysis,
    decisions,
    generatedAt: "2026-08-06T12:10:00Z",
  });

  assert.equal(regenerated.regeneratedBundle.applicationEvent.applicationState, "SUBMITTED_MANUAL_EXTERNAL");
  assert.equal(regenerated.regeneratedBundle.fitAssessment.numericEmployerSuccessProbability, null);
  assert.equal(regenerated.changeReport.canonicalCareerEvidenceUpdated, false);
  assert.equal(regenerated.changeReport.applicationStatePreserved, true);
  assert.equal(regenerated.regeneratedBundle.mappings.find((item) => item.requirementId === "req_guardrails").classification, "UNKNOWN");
});

test("private decisions are append-only and written outside the repository", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "s010-02d-decisions-"));
  try {
    const item = review.buildRoleFocusedCareerEvidenceReviewItems({
      analysis: loaded(),
      facts: [fact("fact_req_platform", "Led a synthetic platform initiative from roadmap to rollout.")],
      evidence: [evidence("evidence_req_platform")],
      maxItems: 1,
    })[0];
    const first = review.createRoleFocusedCareerEvidenceDecision({
      item,
      outcome: "TRANSFERABLE",
      selectedCareerFactIds: ["fact_req_platform"],
      selectedEvidenceIds: ["evidence_req_platform"],
      createdAt: "2026-08-06T12:05:00Z",
      operatorConfirmed: true,
    });
    const second = review.createRoleFocusedCareerEvidenceDecision({
      item,
      outcome: "NEEDS_EVIDENCE",
      selectedCareerFactIds: [],
      selectedEvidenceIds: [],
      existingDecisions: [first],
      createdAt: "2026-08-06T12:06:00Z",
      operatorConfirmed: true,
    });
    review.appendRoleFocusedCareerEvidenceDecision({ decisionRoot: tmp, repositoryRoot: root, decision: first });
    review.appendRoleFocusedCareerEvidenceDecision({ decisionRoot: tmp, repositoryRoot: root, decision: second });
    const loadedDecisions = review.loadRoleFocusedCareerEvidenceDecisions({
      decisionRoot: tmp,
      repositoryRoot: root,
      analysisRunId: item.analysisRunId,
    });

    assert.equal(loadedDecisions.length, 2);
    assert.equal(second.supersedesDecisionId, first.decisionId);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("regenerated analysis writes a new private version and change report", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "s010-02d-output-"));
  try {
    const analysis = loaded();
    const item = review.buildRoleFocusedCareerEvidenceReviewItems({
      analysis,
      facts: [fact("fact_req_platform", "Led a synthetic platform initiative from roadmap to rollout.")],
      evidence: [evidence("evidence_req_platform")],
      maxItems: 1,
    })[0];
    const decision = review.createRoleFocusedCareerEvidenceDecision({
      item,
      outcome: "TRANSFERABLE",
      selectedCareerFactIds: ["fact_req_platform"],
      selectedEvidenceIds: ["evidence_req_platform"],
      createdAt: "2026-08-06T12:05:00Z",
      operatorConfirmed: true,
    });
    const regenerated = review.regenerateAnalysisAfterRoleFocusedCareerReview({
      previous: analysis,
      decisions: [decision],
      generatedAt: "2026-08-06T12:10:00Z",
    });
    const written = review.writeRegeneratedAnalysisAfterRoleFocusedCareerReview({
      outputRoot: tmp,
      repositoryRoot: root,
      previous: analysis,
      regeneratedBundle: regenerated.regeneratedBundle,
      changeReport: regenerated.changeReport,
    });

    assert.match(written.regeneratedAnalysisRunId, /^privjobanalysis_/);
    assert.ok(written.privateArtifactNames.includes("s010_02d_career_evidence_change_report.json"));
    assert.ok(written.privateArtifacts.every((artifact) => artifact.startsWith(tmp)));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("source contains no route, API, provider, database, AI, submission, message, or resume mutation path", () => {
  const combinedSource = `${reviewSource}\n${cliSource}`;

  assert.doesNotMatch(combinedSource, /createServer|listen\(|app\/api|fetch\(|XMLHttpRequest/i);
  assert.doesNotMatch(combinedSource, /from ["'][^"']*(\/os|\/operator)|require\([^)]*(\/os|\/operator)/i);
  assert.doesNotMatch(combinedSource, /from ["']@prisma\/client|prisma\.|database\.|dbClient|sql`/i);
  assert.doesNotMatch(combinedSource, /from ["'][^"']*(ollama|openai|anthropic|gemini)|\b(ollama|openai|anthropic|gemini)\.|modelAdapter/i);
  assert.doesNotMatch(combinedSource, /createApplication|submitApplication|sendMessage|mutateResume/i);
});
