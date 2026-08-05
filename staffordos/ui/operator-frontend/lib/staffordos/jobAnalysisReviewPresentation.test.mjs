import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const presentationPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobAnalysisReviewPresentation.ts");
const reviewPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateJobAnalysisReview.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const presentationSource = readFileSync(presentationPath, "utf8");

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

const presentation = requireTypeScriptModule(presentationPath);
const review = requireTypeScriptModule(reviewPath);

function requirement(id, level, overrides = {}) {
  return {
    id,
    requirementLevel: level,
    ambiguity: null,
    requirementText: "Synthetic requirement",
    ...overrides,
  };
}

function mapping(requirementId, classification, overrides = {}) {
  return {
    requirementId,
    classification,
    careerFactIds: classification === "MISSING" ? [] : ["careerfact_synthetic001"],
    careerEvidenceIds: classification === "MISSING" ? [] : ["careerev_synthetic001"],
    supportLimitations: ["Synthetic limitation."],
    ...overrides,
  };
}

function bundle() {
  return {
    opportunity: { id: "privjobopp_synthetic001", companyName: "Example Works Cooperative", roleTitle: "Synthetic Role" },
    requirements: [
      requirement("req_required", "REQUIRED"),
      requirement("req_preferred", "PREFERRED"),
      requirement("req_responsibility", "RESPONSIBILITY"),
      requirement("req_info", "INFORMATIONAL"),
      requirement("req_unknown", "UNCLEAR", { ambiguity: "Synthetic ambiguity." }),
    ],
    mappings: [
      mapping("req_required", "PROVEN"),
      mapping("req_preferred", "PARTIAL"),
      mapping("req_responsibility", "TRANSFERABLE"),
      mapping("req_info", "MISSING"),
      mapping("req_unknown", "UNKNOWN"),
    ],
    fitAssessment: {
      finalRecommendation: "ALREADY_APPLIED_MONITOR",
      numericEmployerSuccessProbability: null,
    },
    positioningBrief: {
      strongestSupportedThemes: ["Synthetic supported theme"],
      transferableExperience: [{ requirementId: "req_responsibility" }],
      unsupportedClaimsToAvoid: ["Synthetic unsupported claim"],
      primaryGap: "Synthetic primary gap",
    },
    reviewQueue: [
      {
        id: "review_required",
        requirementId: "req_required",
        question: "Synthetic question 1?",
        whyItMatters: "Synthetic reason.",
        priority: 1,
      },
      {
        id: "review_unknown",
        requirementId: "req_unknown",
        question: "Synthetic question 2?",
        whyItMatters: "Synthetic reason.",
        priority: 2,
      },
    ],
    applicationEvent: {
      applicationState: "SUBMITTED_MANUAL_EXTERNAL",
    },
    nextAction: {
      action: "Monitor employer response and prepare synthetic evidence.",
    },
    auditSummary: {
      generatedAt: "2026-08-05T12:00:00Z",
    },
  };
}

function metadata() {
  return {
    analysisRunId: "privjobanalysis_synthetic001",
    opportunityId: "privjobopp_synthetic001",
    company: "Example Works Cooperative",
    role: "Synthetic Role",
    analysisTimestamp: "2026-08-05T12:00:00Z",
    applicationState: "SUBMITTED_MANUAL_EXTERNAL",
    requirementCount: 5,
    unansweredReviewQuestionCount: 2,
    recommendation: "ALREADY_APPLIED_MONITOR",
    runLabel: "j001_03a_synthetic",
    runDirectory: "/tmp/synthetic-private-run",
    privatePathVisible: false,
  };
}

test("presentation model summarizes opportunity, requirements, coverage, and safety", () => {
  const model = presentation.buildJobAnalysisReviewPresentation({
    metadata: metadata(),
    bundle: bundle(),
  });

  assert.equal(model.surface, "OWNER_PRIVATE_LOCAL_CLI");
  assert.equal(model.opportunitySummary.applicationStatus, "SUBMITTED_MANUAL_EXTERNAL");
  assert.equal(model.requirementSummary.total, 5);
  assert.equal(model.requirementSummary.required, 1);
  assert.equal(model.requirementSummary.preferred, 1);
  assert.equal(model.requirementSummary.responsibilities, 1);
  assert.equal(model.requirementSummary.informational, 1);
  assert.equal(model.requirementSummary.ambiguous, 1);
  assert.equal(model.evidenceCoverage.PROVEN, 1);
  assert.equal(model.evidenceCoverage.PARTIAL, 1);
  assert.equal(model.evidenceCoverage.TRANSFERABLE, 1);
  assert.equal(model.evidenceCoverage.MISSING, 1);
  assert.equal(model.evidenceCoverage.UNKNOWN, 1);
  assert.equal(model.safety.privatePathVisible, false);
  assert.equal(model.safety.rawListingTextVisible, false);
  assert.equal(model.safety.noApplicationActionAvailable, true);
});

test("answered review questions are removed from priority queue", () => {
  const runBundle = bundle();
  const decision = review.createPrivateJobAnalysisOperatorDecision({
    bundle: runBundle,
    analysisRunId: "privjobanalysis_synthetic001",
    reviewQuestionId: "review_unknown",
    requirementId: "req_unknown",
    decisionType: "KEEP_UNKNOWN",
    selectedCareerFactIds: [],
    selectedEvidenceIds: [],
    createdAt: "2026-08-05T12:05:00Z",
    operatorConfirmed: true,
  });
  const model = presentation.buildJobAnalysisReviewPresentation({
    metadata: metadata(),
    bundle: runBundle,
    decisions: [decision],
  });

  assert.equal(model.priorityReviewQuestions.length, 1);
  assert.equal(model.priorityReviewQuestions[0].reviewQuestionId, "review_required");
});

test("run list presentation hides private paths", () => {
  const list = presentation.buildJobAnalysisRunListPresentation([metadata()]);

  assert.equal(list.length, 1);
  assert.equal(list[0].privatePathVisible, false);
  assert.equal(Object.prototype.hasOwnProperty.call(list[0], "runDirectory"), false);
});

test("presentation source contains no server, route, API, provider, database, or AI behavior", () => {
  assert.doesNotMatch(presentationSource, /createServer|listen\(|app\/api|\/os|\/operator|fetch\(|XMLHttpRequest/i);
  assert.doesNotMatch(presentationSource, /from ["']@prisma\/client|prisma\.|database\.|dbClient|sql`/i);
  assert.doesNotMatch(presentationSource, /from ["'][^"']*(ollama|openai|anthropic|gemini)|\b(ollama|openai|anthropic|gemini)\.|modelAdapter/i);
});
