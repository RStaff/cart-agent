import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const fitPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobFitAssessment.ts");
const extractorPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobRequirementExtractor.ts");
const mapperPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/candidateEvidenceMapper.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const fitSource = readFileSync(fitPath, "utf8");

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

const { buildManualExternalApplicationEvent, buildPrivateJobFitAssessment } = requireTypeScriptModule(fitPath);
const { extractPrivateJobRequirements } = requireTypeScriptModule(extractorPath);
const { mapRequirementsToCareerEvidence } = requireTypeScriptModule(mapperPath);

function requirements() {
  return extractPrivateJobRequirements({
    workspaceId: "professional",
    jobOpportunityId: "privjobopp_synthetic001",
    sourceId: "privjobsrc_synthetic001",
    listingText: "Requirements\n- Must have AI automation product experience.\nPreferred\n- Nice to have SQL analytics.",
    createdAt: "2026-08-04T12:00:00Z",
  });
}

function mappingsFor(requirementRecords) {
  return mapRequirementsToCareerEvidence({
    requirements: requirementRecords,
    careerFacts: [
      {
        id: "careerfact_synthetic_ai",
        factType: "PROJECT",
        statement: "Synthetic AI automation product project.",
        normalizedStatement: "synthetic ai automation product project",
        sourceEvidenceIds: ["careerev_synthetic_ai"],
        verificationStatus: "PARTIALLY_SUPPORTED",
        supportLevel: "PARTIAL",
        conflictTypes: [],
        conflictingEvidenceIds: [],
        testOnly: true,
      },
    ],
    careerEvidence: [
      {
        id: "careerev_synthetic_ai",
        evidenceType: "PROJECT_ARTIFACT",
        sourceType: "PROJECT_ARTIFACT",
        authorityClassification: "OPERATOR_CONFIRMED",
        supportsFactIds: ["careerfact_synthetic_ai"],
        challengesFactIds: [],
        testOnly: true,
      },
    ],
    createdAt: "2026-08-04T12:00:00Z",
  });
}

test("manual submission is distinct from StaffordOS submission", () => {
  const event = buildManualExternalApplicationEvent({
    opportunityId: "privjobopp_synthetic001",
    rossConfirmedSubmission: true,
  });

  assert.equal(event.applicationState, "SUBMITTED_MANUAL_EXTERNAL");
  assert.equal(event.submissionChannel, "MANUAL_EXTERNAL");
  assert.equal(event.submittedBy, "Ross");
  assert.equal(event.submittedByStaffordOS, false);
});

test("already-applied opportunity does not recommend applying again", () => {
  const reqs = requirements();
  const maps = mappingsFor(reqs);
  const event = buildManualExternalApplicationEvent({
    opportunityId: "privjobopp_synthetic001",
    rossConfirmedSubmission: true,
  });
  const assessment = buildPrivateJobFitAssessment({
    opportunityId: "privjobopp_synthetic001",
    requirements: reqs,
    mappings: maps,
    applicationEvent: event,
    createdAt: "2026-08-04T12:00:00Z",
  });

  assert.equal(assessment.finalRecommendation, "ALREADY_APPLIED_MONITOR");
  assert.match(assessment.recommendationExplanation, /already submitted/i);
  assert.ok(assessment.majorBlockers.some((blocker) => /do not submit again/i.test(blocker)));
});

test("no employer-success probability or unexplained fit score is generated", () => {
  const reqs = requirements();
  const maps = mappingsFor(reqs);
  const event = buildManualExternalApplicationEvent({
    opportunityId: "privjobopp_synthetic001",
    rossConfirmedSubmission: false,
  });
  const assessment = buildPrivateJobFitAssessment({
    opportunityId: "privjobopp_synthetic001",
    requirements: reqs,
    mappings: maps,
    applicationEvent: event,
    createdAt: "2026-08-04T12:00:00Z",
  });

  assert.equal(assessment.numericEmployerSuccessProbability, null);
  assert.doesNotMatch(JSON.stringify(assessment), /fitScore|matchScore|likelihoodOfInterview|likelihoodOfOffer/i);
});

test("assessment source has no provider, API, database, AI, application, message, or resume mutation behavior", () => {
  assert.doesNotMatch(fitSource, /fetch\(|XMLHttpRequest|\/api\/|from ["']@prisma\/client|prisma\.|database\.|dbClient|sql`/i);
  assert.doesNotMatch(fitSource, /ollama|openai|anthropic|gemini|modelAdapter/i);
  assert.doesNotMatch(fitSource, /submitApplication\(|sendMessage\(|mutateResume\(|writeFile|appendFile|unlink|spawn\(|exec\(/i);
});
