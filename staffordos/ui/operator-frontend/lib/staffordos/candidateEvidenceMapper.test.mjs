import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const mapperPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/candidateEvidenceMapper.ts");
const extractorPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobRequirementExtractor.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const mapperSource = readFileSync(mapperPath, "utf8");

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

const { mapRequirementsToCareerEvidence } = requireTypeScriptModule(mapperPath);
const { extractPrivateJobRequirements } = requireTypeScriptModule(extractorPath);

function requirementsFrom(text) {
  return extractPrivateJobRequirements({
    workspaceId: "professional",
    jobOpportunityId: "privjobopp_synthetic001",
    sourceId: "privjobsrc_synthetic001",
    listingText: text,
    createdAt: "2026-08-04T12:00:00Z",
  });
}

function fact(overrides = {}) {
  return {
    id: "careerfact_synthetic_product_ai",
    workspaceId: "professional",
    factType: "PROJECT",
    statement: "Synthetic product automation project with AI workflow planning.",
    normalizedStatement: "synthetic product automation project with ai workflow planning",
    technologyOrSkill: "AI",
    sourceEvidenceIds: ["careerev_synthetic_project"],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    verificationStatus: "VERIFIED",
    supportLevel: "DIRECT",
    authorityClassification: "OPERATOR_CONFIRMED",
    experienceClassification: "USED_IN_CONTROLLED_PROJECT",
    deploymentClaim: "CONTROLLED_PROJECT",
    customerUseClaim: "NONE",
    yearsOfExperience: null,
    yearsAuthority: null,
    operatorReviewStatus: "Ross confirmed",
    testOnly: true,
    ...overrides,
  };
}

function evidence(overrides = {}) {
  return {
    id: "careerev_synthetic_project",
    evidenceType: "PROJECT_ARTIFACT",
    sourceType: "PROJECT_ARTIFACT",
    title: "Synthetic project evidence",
    summary: "Synthetic evidence for AI workflow planning.",
    sourceReference: "synthetic fixture",
    authorityClassification: "OPERATOR_CONFIRMED",
    supportsFactIds: ["careerfact_synthetic_product_ai"],
    challengesFactIds: [],
    testOnly: true,
    ...overrides,
  };
}

test("verified facts with non-resume evidence can become PROVEN", () => {
  const requirements = requirementsFrom("Requirements\n- Must have experience with AI automation workflows.");
  const mappings = mapRequirementsToCareerEvidence({
    requirements,
    careerFacts: [fact()],
    careerEvidence: [evidence()],
    createdAt: "2026-08-04T12:00:00Z",
  });

  assert.equal(mappings[0].classification, "PROVEN");
});

test("evidence supportsFactIds can link facts that do not carry sourceEvidenceIds", () => {
  const requirements = requirementsFrom("Requirements\n- Must have experience with AI automation workflows.");
  const mappings = mapRequirementsToCareerEvidence({
    requirements,
    careerFacts: [fact({ sourceEvidenceIds: [] })],
    careerEvidence: [evidence({ supportsFactIds: ["careerfact_synthetic_product_ai"] })],
    createdAt: "2026-08-04T12:00:00Z",
  });

  assert.equal(mappings[0].classification, "PROVEN");
  assert.deepEqual(mappings[0].careerEvidenceIds, ["careerev_synthetic_project"]);
});

test("career facts without evidence cannot become PROVEN", () => {
  const requirements = requirementsFrom("Requirements\n- Must have experience with AI automation workflows.");
  const mappings = mapRequirementsToCareerEvidence({
    requirements,
    careerFacts: [fact({ sourceEvidenceIds: [] })],
    careerEvidence: [],
    createdAt: "2026-08-04T12:00:00Z",
  });

  assert.notEqual(mappings[0].classification, "PROVEN");
  assert.match(mappings[0].supportLimitations.join(" "), /No supporting CareerEvidence/);
});

test("partial support cannot become PROVEN", () => {
  const requirements = requirementsFrom("Requirements\n- Must have experience with AI automation workflows.");
  const mappings = mapRequirementsToCareerEvidence({
    requirements,
    careerFacts: [fact({ verificationStatus: "PARTIALLY_SUPPORTED", supportLevel: "PARTIAL" })],
    careerEvidence: [evidence()],
    createdAt: "2026-08-04T12:00:00Z",
  });

  assert.equal(mappings[0].classification, "PARTIAL");
});

test("transferable evidence remains labeled TRANSFERABLE", () => {
  const requirements = requirementsFrom("Requirements\n- Must have product roadmap leadership.");
  const mappings = mapRequirementsToCareerEvidence({
    requirements,
    careerFacts: [
      fact({
        id: "careerfact_synthetic_leadership",
        factType: "LEADERSHIP",
        statement: "Synthetic leadership in adjacent workflow planning.",
        normalizedStatement: "synthetic leadership in adjacent workflow planning",
        technologyOrSkill: null,
        verificationStatus: "PROPOSED",
        supportLevel: "TRANSFERABLE",
        sourceEvidenceIds: ["careerev_synthetic_project"],
      }),
    ],
    careerEvidence: [evidence({ supportsFactIds: ["careerfact_synthetic_leadership"] })],
    createdAt: "2026-08-04T12:00:00Z",
  });

  assert.equal(mappings[0].classification, "TRANSFERABLE");
  assert.match(mappings[0].safePositioning, /adjacent|transferable/i);
});

test("missing evidence remains MISSING", () => {
  const requirements = requirementsFrom("Requirements\n- Must have underwater basket weaving certification.");
  const mappings = mapRequirementsToCareerEvidence({
    requirements,
    careerFacts: [fact()],
    careerEvidence: [evidence()],
    createdAt: "2026-08-04T12:00:00Z",
  });

  assert.equal(mappings[0].classification, "MISSING");
});

test("conflicting evidence becomes UNKNOWN or review-required", () => {
  const requirements = requirementsFrom("Requirements\n- Must have experience with AI automation workflows.");
  const mappings = mapRequirementsToCareerEvidence({
    requirements,
    careerFacts: [fact({ verificationStatus: "CONFLICTING", conflictTypes: ["SKILL_CONTEXT_CONFLICT"] })],
    careerEvidence: [evidence({ challengesFactIds: ["careerfact_synthetic_product_ai"] })],
    createdAt: "2026-08-04T12:00:00Z",
  });

  assert.equal(mappings[0].classification, "UNKNOWN");
  assert.equal(mappings[0].conflictStatus, "CONFLICT_REQUIRES_REVIEW");
});

test("resume wording alone does not verify a fact", () => {
  const requirements = requirementsFrom("Requirements\n- Must have experience with AI automation workflows.");
  const mappings = mapRequirementsToCareerEvidence({
    requirements,
    careerFacts: [fact()],
    careerEvidence: [evidence({ evidenceType: "RESUME", sourceType: "RESUME", authorityClassification: "GENERATED_DOCUMENT" })],
    createdAt: "2026-08-04T12:00:00Z",
  });

  assert.notEqual(mappings[0].classification, "PROVEN");
  assert.match(mappings[0].supportLimitations.join(" "), /Resume wording alone/);
});

test("repository-backed or local testing does not become production or customer use", () => {
  const requirements = requirementsFrom("Requirements\n- Must have 3 years of production customer AI automation work.");
  const mappings = mapRequirementsToCareerEvidence({
    requirements,
    careerFacts: [
      fact({
        authorityClassification: "REPOSITORY_BACKED",
        experienceClassification: "USED_IN_CONTROLLED_PROJECT",
        deploymentClaim: "LOCAL_ONLY",
        customerUseClaim: "NONE",
        yearsOfExperience: null,
        yearsAuthority: null,
      }),
    ],
    careerEvidence: [evidence({ authorityClassification: "REPOSITORY_BACKED" })],
    createdAt: "2026-08-04T12:00:00Z",
  });

  assert.match(mappings[0].prohibitedOverstatement.join(" "), /production use/i);
  assert.match(mappings[0].prohibitedOverstatement.join(" "), /customer use/i);
  assert.match(mappings[0].prohibitedOverstatement.join(" "), /years of experience/i);
});

test("mapper source has no provider, API, database, AI, application, message, or resume mutation behavior", () => {
  assert.doesNotMatch(mapperSource, /fetch\(|XMLHttpRequest|\/api\/|from ["']@prisma\/client|prisma\.|database\.|dbClient|sql`/i);
  assert.doesNotMatch(mapperSource, /ollama|openai|anthropic|gemini|modelAdapter/i);
  assert.doesNotMatch(mapperSource, /submitApplication|sendMessage|mutateResume|writeFile|appendFile|unlink|spawn\(|exec\(/i);
});
