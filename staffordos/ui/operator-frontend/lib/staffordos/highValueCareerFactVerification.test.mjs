import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const verificationPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/highValueCareerFactVerification.ts");
const mapperPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/candidateEvidenceMapper.ts");
const roleFocusedPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/roleFocusedCareerEvidenceReview.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runHighValueCareerFactVerification.mjs");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const verificationSource = readFileSync(verificationPath, "utf8");
const mapperSource = readFileSync(mapperPath, "utf8");
const roleFocusedSource = readFileSync(roleFocusedPath, "utf8");
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

const verification = requireTypeScriptModule(verificationPath);

function requirement(id, text, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_requirement.v1",
    id,
    workspaceId: "professional",
    jobOpportunityId: "privjobopp_synthetic005",
    sourceId: "privjobsrc_synthetic005",
    requirementText: text,
    normalizedRequirement: text.toLowerCase(),
    requirementCategory: "Responsibility",
    requirementLevel: "REQUIRED",
    importanceClassification: "Required",
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

function mapping(requirementId, classification = "UNKNOWN", overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_requirement_evidence_mapping.v1",
    id: `privjobmap_${requirementId}`,
    requirementId,
    jobOpportunityId: "privjobopp_synthetic005",
    careerFactIds: [],
    careerEvidenceIds: [],
    classification,
    explanation: "Synthetic mapping.",
    supportLimitations: ["Synthetic fixture only."],
    verificationStatus: "UNKNOWN",
    conflictStatus: "NO_CONFLICT",
    operatorReviewRequirement: "Needs synthetic review.",
    safePositioning: "Hold for review.",
    prohibitedOverstatement: ["Do not invent metrics, years, titles, dates, or production use."],
    matchedSignals: [],
    createdAt: "2026-08-06T12:00:00Z",
    privateRecord: true,
    testOnly: false,
    ...overrides,
  };
}

function fact(id, statement, overrides = {}) {
  return {
    id,
    workspaceId: "professional",
    factType: "PROJECT",
    subject: "Synthetic Person",
    statement,
    normalizedStatement: statement.toLowerCase(),
    startDate: null,
    endDate: null,
    current: null,
    organization: null,
    roleOrTitle: null,
    location: null,
    classification: "Synthetic",
    supportLevel: "UNKNOWN",
    verificationStatus: "PROPOSED",
    authorityClassification: "GENERATED_DOCUMENT",
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: [`careerev_${id}`],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    metricClassification: "NOT_APPLICABLE",
    measurementAuthority: null,
    experienceClassification: null,
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: "NEEDS_EVIDENCE",
    customerUseClaim: "NEEDS_EVIDENCE",
    technologyOrSkill: null,
    limitations: ["Synthetic fixture only."],
    operatorNotes: null,
    positioningBoundaries: [],
    createdAt: "2026-08-06T12:00:00Z",
    updatedAt: "2026-08-06T12:00:00Z",
    testOnly: false,
    ...overrides,
  };
}

function evidence(id, overrides = {}) {
  return {
    id: `careerev_${id}`,
    workspaceId: "professional",
    evidenceType: "PROJECT_ARTIFACT",
    title: "Synthetic project evidence",
    summary: "Synthetic non-production evidence.",
    sourceType: "PROJECT_ARTIFACT",
    sourceReference: `private-synthetic://${id}`,
    sourceArtifact: null,
    sourceOwner: "Synthetic owner",
    observedAt: "2026-08-06T12:00:00Z",
    sourceCreatedAt: null,
    authorityClassification: "GENERATED_DOCUMENT",
    privacyClassification: "Professional owner-private",
    freshness: "Historical",
    supportsFactIds: [id],
    challengesFactIds: [],
    contentDigest: "syntheticdigest",
    excerptReference: "synthetic excerpt",
    limitations: ["Synthetic fixture only."],
    operatorReviewStatus: "Needs Ross's review",
    testOnly: false,
    ...overrides,
  };
}

function analysis() {
  const requirements = [
    requirement("req_degree", "Master of Education or equivalent formal education."),
    requirement("req_automation", "Lead AI automation and agentic workflow implementation."),
    requirement("req_platform", "Coordinate platform operations, CI/CD, and Kubernetes delivery."),
  ];
  return {
    metadata: {
      analysisRunId: "privjobanalysis_synthetic005",
      opportunityId: "privjobopp_synthetic005",
      company: "Synthetic Employer",
      role: "Synthetic AI Operations Role",
      analysisTimestamp: "2026-08-06T12:00:00Z",
      applicationState: "SUBMITTED_MANUAL_EXTERNAL",
      requirementCount: requirements.length,
      unansweredReviewQuestionCount: 0,
      recommendation: "ALREADY_APPLIED_MONITOR",
      runLabel: "synthetic",
      runDirectory: "/private/tmp/synthetic",
      privatePathVisible: false,
    },
    bundle: {
      workflowVersion: "J001.03A",
      opportunity: {
        id: "privjobopp_synthetic005",
        companyName: "Synthetic Employer",
        roleTitle: "Synthetic AI Operations Role",
        observedAt: "2026-08-06T12:00:00Z",
      },
      requirements,
      mappings: requirements.map((item) => mapping(item.id)),
      fitAssessment: {
        schemaVersion: "staffordos.job_search.private_fit_assessment.v1",
        opportunityId: "privjobopp_synthetic005",
        applicationState: "SUBMITTED_MANUAL_EXTERNAL",
        finalRecommendation: "ALREADY_APPLIED_MONITOR",
        recommendationExplanation: "Synthetic already-submitted application remains monitor-only.",
        coverage: { PROVEN: 0, PARTIAL: 0, TRANSFERABLE: 0, MISSING: 0, UNKNOWN: 3 },
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
        opportunityId: "privjobopp_synthetic005",
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
        applicationState: "SUBMITTED_MANUAL_EXTERNAL",
        submittedByStaffordOS: false,
      },
      nextAction: {
        action: "Monitor synthetic employer response.",
      },
      auditSummary: {
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
        outputDirectoryRedacted: "$HOME/.staffordos/private/synthetic",
        summary: {
          requirementCount: 3,
          mappingCount: 3,
          reviewQuestionCount: 0,
          finalRecommendation: "ALREADY_APPLIED_MONITOR",
        },
      },
    },
  };
}

function careerStore() {
  return {
    facts: [
      fact("careerfact_pmp_resume", "Synthetic PMP certification wording from a resume.", {
        factType: "CERTIFICATION",
        sourceEvidenceIds: ["careerev_pmp_resume"],
      }),
      fact("careerfact_degree_official", "Synthetic Master of Education degree.", {
        factType: "EDUCATION",
        verificationStatus: "PROPOSED",
        authorityClassification: "OFFICIAL_DOCUMENT",
        sourceEvidenceIds: ["careerev_degree_official"],
      }),
      fact("careerfact_automation_repo", "Synthetic AI automation implementation for controlled project workflows.", {
        factType: "PROJECT",
        verificationStatus: "PARTIALLY_SUPPORTED",
        authorityClassification: "REPOSITORY_BACKED",
        experienceClassification: "USED_IN_CONTROLLED_PROJECT",
        sourceEvidenceIds: ["careerev_automation_repo"],
      }),
      fact("careerfact_platform_transfer", "Synthetic CI/CD and Kubernetes platform coordination context.", {
        factType: "TECHNOLOGY",
        verificationStatus: "PROPOSED",
        authorityClassification: "REPOSITORY_BACKED",
        experienceClassification: "TRANSFERABLE",
        sourceEvidenceIds: ["careerev_platform_transfer"],
      }),
      fact("careerfact_metric_gap", "Synthetic automation result improved throughput by 40%.", {
        factType: "ACHIEVEMENT",
        metricClassification: "UNSUPPORTED",
        sourceEvidenceIds: ["careerev_metric_gap"],
      }),
      fact("careerfact_prod_gap", "Synthetic production deployment ownership claim.", {
        factType: "PROJECT",
        authorityClassification: "REPOSITORY_BACKED",
        sourceEvidenceIds: ["careerev_prod_gap"],
      }),
    ],
    evidence: [
      evidence("pmp_resume", {
        evidenceType: "RESUME",
        sourceType: "RESUME",
        authorityClassification: "GENERATED_DOCUMENT",
      }),
      evidence("degree_official", {
        evidenceType: "EDUCATION_RECORD",
        sourceType: "EDUCATION_RECORD",
        authorityClassification: "OFFICIAL_DOCUMENT",
        title: "Synthetic official degree evidence",
      }),
      evidence("automation_repo", {
        authorityClassification: "REPOSITORY_BACKED",
        title: "Synthetic repository implementation evidence",
      }),
      evidence("platform_transfer", {
        authorityClassification: "REPOSITORY_BACKED",
        title: "Synthetic repository platform evidence",
      }),
      evidence("metric_gap", {
        authorityClassification: "GENERATED_DOCUMENT",
      }),
      evidence("prod_gap", {
        authorityClassification: "REPOSITORY_BACKED",
        title: "Synthetic repository evidence without release wording",
        summary: "Synthetic controlled project evidence.",
      }),
    ],
  };
}

function candidateByFact(candidates, sourceFactId, category = null) {
  const candidate = candidates.find((item) => item.sourceFactId === sourceFactId && (!category || item.category === category));
  assert.ok(candidate, `missing ${sourceFactId}`);
  return candidate;
}

test("high-value candidates enforce credential and production evidence authority", () => {
  const candidates = verification.buildHighValueCareerFactCandidates({
    analysis: analysis(),
    careerStore: careerStore(),
    maxItems: 12,
  });

  const pmp = candidateByFact(candidates, "careerfact_pmp_resume");
  assert.equal(pmp.proposedAuthorityStatus, "NEEDS_EVIDENCE");
  assert.equal(pmp.allowedOutcomes.includes("VERIFIED"), false);

  const degree = candidateByFact(candidates, "careerfact_degree_official");
  assert.equal(degree.proposedAuthorityStatus, "VERIFIED");
  assert.ok(degree.allowedOutcomes.includes("VERIFIED"));

  const production = candidateByFact(candidates, "careerfact_prod_gap", "production/deployment status");
  assert.equal(production.proposedAuthorityStatus, "NEEDS_EVIDENCE");
  assert.equal(production.allowedOutcomes.includes("PARTIALLY_SUPPORTED"), false);
});

test("verified and partial outcomes require allowed source authority", () => {
  const candidates = verification.buildHighValueCareerFactCandidates({
    analysis: analysis(),
    careerStore: careerStore(),
    maxItems: 12,
  });
  const pmp = candidateByFact(candidates, "careerfact_pmp_resume");
  assert.throws(
    () =>
      verification.createHighValueCareerFactVerificationDecision({
        analysisRunId: "privjobanalysis_synthetic005",
        candidate: pmp,
        outcome: "VERIFIED",
        operatorConfirmed: true,
        createdAt: "2026-08-06T12:00:00Z",
      }),
    /OUTCOME_NOT_ALLOWED_FOR_EVIDENCE|VERIFIED_REQUIRES_DIRECT_AUTHORITY/,
  );
});

test("transferable decision remains transferable during deterministic remapping", () => {
  const sourceAnalysis = analysis();
  const store = careerStore();
  const candidates = verification.buildHighValueCareerFactCandidates({
    analysis: sourceAnalysis,
    careerStore: store,
    maxItems: 12,
  });
  const platform = candidateByFact(candidates, "careerfact_platform_transfer");
  const decision = verification.createHighValueCareerFactVerificationDecision({
    analysisRunId: sourceAnalysis.metadata.analysisRunId,
    candidate: platform,
    outcome: "TRANSFERABLE",
    operatorConfirmed: true,
    createdAt: "2026-08-06T12:00:00Z",
  });
  const result = verification.finalizeHighValueCareerFactVerification({
    analysis: sourceAnalysis,
    careerStore: store,
    candidates,
    decisions: [decision],
    generatedAt: "2026-08-06T12:00:00Z",
  });
  assert.equal(result.promotedFacts.length, 1);
  assert.equal(result.promotedFacts[0].supportLevel, "TRANSFERABLE");
  assert.equal(result.promotedFacts[0].experienceClassification, "TRANSFERABLE");
  assert.match(mapperSource, /if \(explicitlyTransferable\) return false/);
});

test("official education evidence can promote a verified canonical fact and improve coverage", () => {
  const sourceAnalysis = analysis();
  const store = careerStore();
  const candidates = verification.buildHighValueCareerFactCandidates({
    analysis: sourceAnalysis,
    careerStore: store,
    maxItems: 12,
  });
  const degree = candidateByFact(candidates, "careerfact_degree_official");
  const automation = candidateByFact(candidates, "careerfact_automation_repo");
  const decisions = [
    verification.createHighValueCareerFactVerificationDecision({
      analysisRunId: sourceAnalysis.metadata.analysisRunId,
      candidate: degree,
      outcome: "VERIFIED",
      operatorConfirmed: true,
      createdAt: "2026-08-06T12:00:00Z",
    }),
    verification.createHighValueCareerFactVerificationDecision({
      analysisRunId: sourceAnalysis.metadata.analysisRunId,
      candidate: automation,
      outcome: "PARTIALLY_SUPPORTED",
      operatorConfirmed: true,
      createdAt: "2026-08-06T12:01:00Z",
    }),
  ];
  const result = verification.finalizeHighValueCareerFactVerification({
    analysis: sourceAnalysis,
    careerStore: store,
    candidates,
    decisions,
    generatedAt: "2026-08-06T12:02:00Z",
  });
  assert.equal(result.promotedFacts.length, 2);
  assert.ok(result.report.coverageAfter.PROVEN >= 1);
  assert.ok(result.report.coverageAfter.PARTIAL >= 1);
  assert.equal(result.report.noApplicationSubmitted, true);
  assert.equal(result.report.noResumeMutated, true);
});

test("official credential verification does not prove unrelated program-management requirements", () => {
  const credentialAnalysis = analysis();
  credentialAnalysis.bundle.requirements = [
    requirement("req_pmp", "Project Management Professional (PMP) certification.", {
      requirementCategory: "Certification",
      certificationMentioned: "PMP",
    }),
    requirement("req_program_management", "Lead project management workstreams across technical teams.", {
      requirementCategory: "Leadership",
    }),
  ];
  credentialAnalysis.bundle.mappings = credentialAnalysis.bundle.requirements.map((item) => mapping(item.id));
  const decision = verification.createOfficialCredentialVerificationDecision({
    analysisRunId: credentialAnalysis.metadata.analysisRunId,
    credentialName: "Project Management Professional (PMP)",
    issuingOrganization: "Synthetic Credential Institute",
    reviewedAt: "2026-08-06T12:00:00Z",
    operatorConfirmed: true,
  });
  const records = verification.buildOfficialCredentialVerificationRecords({
    decision,
    holderName: "Synthetic Holder",
    credentialName: "Project Management Professional (PMP)",
    issuingOrganization: "Synthetic Credential Institute",
    credentialNumber: "SYNTHETIC-000",
    originalGrantDate: "2026-01-01",
    expirationDate: "2029-01-01",
    evidenceReviewed: "Synthetic official credential document reviewed.",
  });
  const result = verification.finalizeHighValueCareerFactVerificationWithPromotedRecords({
    analysis: credentialAnalysis,
    careerStore: { facts: [], evidence: [] },
    promotedFacts: [records.fact],
    canonicalEvidence: [records.evidence],
    decisions: [decision],
    generatedAt: "2026-08-06T12:01:00Z",
  });
  const byRequirement = new Map(result.regeneratedBundle.mappings.map((item) => [item.requirementId, item.classification]));
  assert.equal(byRequirement.get("req_pmp"), "PROVEN");
  assert.notEqual(byRequirement.get("req_program_management"), "PROVEN");
});

test("private write helper stores only owner-private artifacts outside the repository", () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), "s01002e-private-"));
  try {
    const sourceAnalysis = analysis();
    const store = careerStore();
    const candidates = verification.buildHighValueCareerFactCandidates({
      analysis: sourceAnalysis,
      careerStore: store,
      maxItems: 12,
    });
    const degree = candidateByFact(candidates, "careerfact_degree_official");
    const decision = verification.createHighValueCareerFactVerificationDecision({
      analysisRunId: sourceAnalysis.metadata.analysisRunId,
      candidate: degree,
      outcome: "VERIFIED",
      operatorConfirmed: true,
      createdAt: "2026-08-06T12:00:00Z",
    });
    const result = verification.finalizeHighValueCareerFactVerification({
      analysis: sourceAnalysis,
      careerStore: store,
      candidates,
      decisions: [decision],
      generatedAt: "2026-08-06T12:01:00Z",
    });
    const written = verification.writeHighValueCareerFactVerificationOutputs({
      outputRoot: path.join(temp, "verification"),
      analysisOutputRoot: path.join(temp, "analysis"),
      positioningOutputRoot: path.join(temp, "positioning"),
      repositoryRoot: root,
      analysis: sourceAnalysis,
      promotedFacts: result.promotedFacts,
      regeneratedBundle: result.regeneratedBundle,
      positioningModel: result.afterModel,
      report: result.report,
    });
    assert.equal(written.privatePathVisible, false);
    assert.equal(written.promotedFactCount, 1);
    const mode = statSync(path.join(temp, "verification")).mode & 0o777;
    assert.equal(mode, 0o700);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("source and CLI do not expose forbidden integration or mutation paths", () => {
  assert.doesNotMatch(verificationSource, /fetch\(|XMLHttpRequest|prisma|\/api\/|openai|anthropic|sendMessage\(|submitApplication\(|mutateResume\(/i);
  assert.doesNotMatch(cliSource, /fetch\(|XMLHttpRequest|prisma|\/api\/|openai|anthropic|sendMessage\(|submitApplication\(|mutateResume\(/i);
  assert.doesNotMatch(verificationSource, /\/os\/|\/operator\//);
  assert.match(cliSource, /No \/os route, \/operator route/);
});

test("canonical private files are discoverable by the shared private loader", () => {
  assert.match(roleFocusedSource, /canonical_career_facts/);
  assert.match(roleFocusedSource, /canonical_career_evidence/);
});

test("transferable support is not upgraded to partial by the generic mapper", () => {
  assert.match(mapperSource, /if \(explicitlyTransferable\) return false/);
});
