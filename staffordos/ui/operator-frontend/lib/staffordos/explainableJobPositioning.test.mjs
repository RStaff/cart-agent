import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const positioningPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/explainableJobPositioning.ts");
const cliPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/runExplainableJobPositioning.mjs");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const positioningSource = readFileSync(positioningPath, "utf8");
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

const positioning = requireTypeScriptModule(positioningPath);

function requirement(id, text, overrides = {}) {
  return {
    schemaVersion: "staffordos.job_search.private_requirement.v1",
    id,
    workspaceId: "professional",
    jobOpportunityId: "privjobopp_synthetic004",
    sourceId: "privjobsrc_synthetic004",
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
    jobOpportunityId: "privjobopp_synthetic004",
    careerFactIds: [`careerfact_${requirementId}`],
    careerEvidenceIds: [`careerev_${requirementId}`],
    classification,
    explanation: "Synthetic mapping.",
    supportLimitations: ["Resume wording alone cannot verify this claim."],
    verificationStatus: "UNREVIEWED",
    conflictStatus: "NO_CONFLICT",
    operatorReviewRequirement: "Needs Ross review.",
    safePositioning: "Use only evidence-safe wording.",
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
    limitations: ["Synthetic fixture only."],
    ...overrides,
  };
}

function evidence(id, overrides = {}) {
  return {
    id,
    evidenceType: "PROJECT_ARTIFACT",
    sourceKind: "TEXT",
    authorityClassification: "GENERATED_DOCUMENT",
    freshness: "Historical",
    limitations: ["Synthetic evidence only."],
    ...overrides,
  };
}

function analysis() {
  const requirements = [
    requirement("req_ai_product", "Lead AI product roadmap and customer experience rollout."),
    requirement("req_governance", "Design AI evaluation frameworks, guardrails, and governance standards."),
    requirement("req_program", "Serve as technical program manager across engineering and business stakeholders."),
    requirement("req_unknown_years", "5+ years of direct production Kubernetes platform ownership."),
  ];
  const mappings = [
    mapping("req_ai_product", "TRANSFERABLE", { matchedSignals: ["ai", "product", "roadmap"] }),
    mapping("req_governance", "UNKNOWN", { careerFactIds: [], careerEvidenceIds: [], conflictStatus: "CONFLICT_REQUIRES_REVIEW" }),
    mapping("req_program", "PARTIAL", { matchedSignals: ["program", "stakeholder"] }),
    mapping("req_unknown_years", "MISSING", { careerFactIds: [], careerEvidenceIds: [], matchedSignals: ["kubernetes", "platform"] }),
  ];
  return {
    metadata: {
      analysisRunId: "privjobanalysis_synthetic004",
      opportunityId: "privjobopp_synthetic004",
      company: "Synthetic Employer",
      role: "Synthetic AI Product Operations Role",
      analysisTimestamp: "2026-08-06T12:00:00Z",
      applicationState: "SUBMITTED_MANUAL_EXTERNAL",
      requirementCount: requirements.length,
      unansweredReviewQuestionCount: 0,
      recommendation: "ALREADY_APPLIED_MONITOR",
      runLabel: "Synthetic run",
      runDirectory: "/private/tmp/synthetic",
      privatePathVisible: false,
    },
    bundle: {
      workflowVersion: "J001.03A",
      opportunity: {
        id: "privjobopp_synthetic004",
        companyName: "Synthetic Employer",
        roleTitle: "Synthetic AI Product Operations Role",
        observedAt: "2026-08-06T12:00:00Z",
      },
      requirements,
      mappings,
      fitAssessment: {
        schemaVersion: "staffordos.job_search.private_fit_assessment.v1",
        opportunityId: "privjobopp_synthetic004",
        applicationState: "SUBMITTED_MANUAL_EXTERNAL",
        finalRecommendation: "ALREADY_APPLIED_MONITOR",
        recommendationExplanation: "Synthetic already-applied monitor recommendation.",
        coverage: { PROVEN: 0, PARTIAL: 1, TRANSFERABLE: 1, MISSING: 1, UNKNOWN: 1 },
        dimensions: [],
        majorBlockers: [],
        applicationEffort: "MODERATE",
        strategicValue: "HIGH",
        numericEmployerSuccessProbability: null,
        limitations: ["Synthetic fixture only."],
        createdAt: "2026-08-06T12:00:00Z",
        privateRecord: true,
        testOnly: false,
      },
      positioningBrief: {
        strongestSupportedThemes: [],
        transferableExperience: [],
        unsupportedClaimsToAvoid: [],
      },
      reviewQueue: [],
      applicationEvent: {
        applicationState: "SUBMITTED_MANUAL_EXTERNAL",
      },
      nextAction: {
        action: "Monitor synthetic employer response.",
      },
      auditSummary: {
        generatedAt: "2026-08-06T12:00:00Z",
      },
    },
  };
}

function facts() {
  return [
    fact("careerfact_req_ai_product", "Synthetic digital transformation and automation program support."),
    fact("careerfact_req_program", "Synthetic stakeholder program management across technical delivery.", {
      verificationStatus: "PARTIALLY_SUPPORTED",
      authorityClassification: "OPERATOR_CONFIRMED",
    }),
  ];
}

function evidenceRecords() {
  return [
    evidence("careerev_req_ai_product"),
    evidence("careerev_req_program", { authorityClassification: "OPERATOR_CONFIRMED" }),
  ];
}

test("model builds positioning cards without upgrading evidence classifications", () => {
  const model = positioning.buildExplainableJobPositioningModel({
    analysis: analysis(),
    facts: facts(),
    evidence: evidenceRecords(),
    generatedAt: "2026-08-06T13:00:00Z",
  });
  positioning.assertNoForbiddenPositioningUpgrade(model);
  assert.equal(model.safety.noApplicationSubmitted, true);
  assert.equal(model.safety.noResumeMutated, true);
  assert.equal(model.safety.notConnectedToOs, true);
  assert.equal(model.safety.notConnectedToOperator, true);
  assert.ok(model.positioningCards.length > 0);
  assert.equal(model.explainableFitSummary.coverage.TRANSFERABLE, 1);
  assert.equal(model.explainableFitSummary.coverage.UNKNOWN, 1);
  assert.equal(model.explainableFitSummary.coverage.MISSING, 1);
});

test("transferable cards remain transferable or mixed and carry prohibited wording", () => {
  const model = positioning.buildExplainableJobPositioningModel({
    analysis: analysis(),
    facts: facts(),
    evidence: evidenceRecords(),
    generatedAt: "2026-08-06T13:00:00Z",
  });
  const aiProduct = model.positioningCards.find((card) => card.capability === "AI Product");
  assert.ok(aiProduct);
  assert.notEqual(aiProduct.evidenceClassification, "PROVEN");
  assert.match(aiProduct.prohibitedWording.join(" "), /Do not infer years/);
  assert.match(aiProduct.prohibitedWording.join(" "), /Do not convert local testing/);
});

test("resume and LinkedIn recommendations are recommendations only", () => {
  const model = positioning.buildExplainableJobPositioningModel({
    analysis: analysis(),
    facts: facts(),
    evidence: evidenceRecords(),
    generatedAt: "2026-08-06T13:00:00Z",
  });
  assert.ok(model.resumePositioningRecommendations.length > 0);
  assert.ok(model.linkedInPositioningGuidance.length > 0);
  assert.equal(model.resumePositioningRecommendations.every((item) => item.finalResumeModified === false), true);
  assert.equal(model.linkedInPositioningGuidance.every((item) => item.finalResumeModified === false), true);
});

test("interview guidance names honesty boundaries for transferable capabilities", () => {
  const model = positioning.buildExplainableJobPositioningModel({
    analysis: analysis(),
    facts: facts(),
    evidence: evidenceRecords(),
    generatedAt: "2026-08-06T13:00:00Z",
  });
  assert.ok(model.interviewGuidance.length > 0);
  assert.match(model.interviewGuidance[0].honestyBoundary, /Do not present/);
  assert.match(model.interviewGuidance[0].expectedFollowUpQuestions.join(" "), /production-used/);
});

test("private positioning output writes JSON and Markdown outside the repository", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "j00104-positioning-"));
  try {
    const model = positioning.buildExplainableJobPositioningModel({
      analysis: analysis(),
      facts: facts(),
      evidence: evidenceRecords(),
      generatedAt: "2026-08-06T13:00:00Z",
    });
    const result = positioning.writeExplainableJobPositioningOutput({
      model,
      outputRoot: tmp,
      repositoryRoot: root,
    });
    assert.equal(result.written, true);
    assert.equal(result.privatePathVisible, false);
    assert.ok(result.artifactNames.includes("explainable_positioning_model.json"));
    assert.ok(result.artifactNames.includes("explainable_positioning_report.md"));
    const files = readdirSync(path.join(tmp, model.opportunityId, "j001_04_20260806130000"));
    assert.equal(files.some((file) => file.endsWith(".json")), true);
    for (const file of files.filter((name) => name.endsWith(".json"))) {
      JSON.parse(readFileSync(path.join(tmp, model.opportunityId, "j001_04_20260806130000", file), "utf8"));
      assert.equal((statSync(path.join(tmp, model.opportunityId, "j001_04_20260806130000", file)).mode & 0o077), 0);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("repository output roots are rejected", () => {
  const model = positioning.buildExplainableJobPositioningModel({
    analysis: analysis(),
    facts: facts(),
    evidence: evidenceRecords(),
    generatedAt: "2026-08-06T13:00:00Z",
  });
  assert.throws(
    () =>
      positioning.writeExplainableJobPositioningOutput({
        model,
        outputRoot: path.join(root, "staffordos/tmp"),
        repositoryRoot: root,
      }),
    /outside the repository/,
  );
});

test("source contains no route, provider, database, external AI, submission, message, resume, or LinkedIn mutation path", () => {
  const source = `${positioningSource}\n${cliSource}`;
  assert.doesNotMatch(source, /from ["']next|app\/os|app\/operator|fetch\(|axios|openai|from ["']ollama|ollama\.|ollama\(|runOllama|PrismaClient|prisma\./i);
  assert.doesNotMatch(source, /submitApplication\(|sendMessage\(|contactRecruiter\(|modifyResume\(|writeResume\(|updateLinkedIn\(|providerFetch\(/i);
  assert.doesNotMatch(source, /privjobanalysis_(?!synthetic)[a-f0-9]{18}/i);
  assert.doesNotMatch(source, /privjobopp_(?!synthetic)[a-f0-9]{18}/i);
});
