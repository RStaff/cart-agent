import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const validatorPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const validatorSource = readFileSync(validatorPath, "utf8");
const compiled = ts.transpileModule(validatorSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const validatorModule = new Module(validatorPath);
validatorModule.filename = validatorPath;
validatorModule.paths = Module._nodeModulePaths(path.dirname(validatorPath));
validatorModule._compile(compiled.outputText, validatorPath);

const {
  CHIEF_OF_STAFF_SAFE_UNKNOWN_FALLBACK,
  PERSONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE,
  STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES,
  VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE,
  formatChiefOfStaffValidationReport,
  validateChiefOfStaffResponse,
} = validatorModule.exports;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validate(response, sources = STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES, request = STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE) {
  return validateChiefOfStaffResponse(clone(request), clone(sources), clone(response));
}

function validResponse() {
  return clone(VALID_STAFFORD_MEDIA_CHIEF_OF_STAFF_RESPONSE_FIXTURE);
}

function expectError(result, code) {
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === code), `expected ${code}, got ${result.errors.map((error) => error.code).join(", ")}`);
}

function minimalResponse(claim) {
  return {
    responseId: "test-response",
    workspaceId: claim.workspaceId || "stafford-media",
    headline: "Static fixture response.",
    summary: "This response is only a deterministic validation fixture.",
    attentionItems: [],
    supportingClaims: [claim],
    missingInformation: [],
    candidateActions: [],
    risks: [],
    approvalsNeeded: [],
    proofExpected: "No proof is claimed by this fixture.",
    learningReferences: [],
    sources: (claim.supportingSourceIds || []).map((sourceId) => ({
      sourceId,
      exactSourceReference: "test-only",
    })),
    limitations: ["Static fixture only."],
    generatedAt: "2026-08-01T12:00:00-04:00",
    authorityStatus: "Informational only",
  };
}

function sourceFact(overrides = {}) {
  return {
    claimId: "test-claim",
    claimType: "SOURCE_FACT",
    statement: "Start My Day is the current static primary Action for Stafford Media.",
    supportingSourceIds: ["source-action-start-my-day"],
    confidenceClassification: "High confidence",
    limitation: "Static source only.",
    workspaceId: "stafford-media",
    authorityStatus: "Informational only",
    ...overrides,
  };
}

function conflictSources() {
  return [
    {
      sourceId: "source-conflict-current",
      sourceType: "architecture",
      workspaceId: "stafford-media",
      authorityClassification: "Repository-backed",
      freshness: "Current",
      privacyClassification: "owner_private_stafford_media_fixture",
      immutable: true,
      title: "Current bounded status",
      contentSummary: "Synthetic validation source says the bounded status is ready.",
      exactSourceReference: "synthetic://current-status",
      limitations: ["Synthetic conflict fixture only."],
      availability: "available_now",
      supportedClaimIds: ["claim-conflict-current"],
      supportedStatements: ["The bounded status is ready."],
      conflictGroup: "synthetic-status",
      conflictValue: "ready",
    },
    {
      sourceId: "source-conflict-historical",
      sourceType: "architecture",
      workspaceId: "stafford-media",
      authorityClassification: "Historical certification",
      freshness: "Historical",
      privacyClassification: "owner_private_stafford_media_fixture",
      immutable: true,
      title: "Historical bounded status",
      contentSummary: "Synthetic validation source says the bounded status still needs review.",
      exactSourceReference: "synthetic://historical-status",
      limitations: ["Synthetic conflict fixture only."],
      availability: "available_now",
      supportedClaimIds: ["claim-conflict-historical"],
      supportedStatements: ["The bounded status needs review."],
      conflictGroup: "synthetic-status",
      conflictValue: "needs_review",
    },
  ];
}

test("valid static Stafford Media response passes", () => {
  const result = validate(validResponse());

  assert.equal(result.valid, true);
  assert.equal(result.validationStatus, "accepted");
  assert.equal(result.checkedClaimCount, 4);
  assert.equal(result.checkedRecommendationCount, 1);
});

test("unsourced claim fails", () => {
  const response = validResponse();
  response.supportingClaims.push(sourceFact({
    claimId: "claim-unsourced",
    statement: "This claim has no source.",
    supportingSourceIds: [],
  }));

  expectError(validate(response), "CLAIM_WITHOUT_SOURCE");
});

test("missing source fails", () => {
  const response = validResponse();
  response.supportingClaims[0].supportingSourceIds = ["source-does-not-exist"];

  expectError(validate(response), "SOURCE_NOT_FOUND");
});

test("cross-workspace claim fails", () => {
  const response = validResponse();
  response.supportingClaims[0].workspaceId = "professional";

  expectError(validate(response), "CLAIM_WORKSPACE_MISMATCH");
});

test("response workspace mismatch fails", () => {
  const response = validResponse();
  response.workspaceId = "personal";

  expectError(validate(response), "RESPONSE_WORKSPACE_MISMATCH");
});

test("cross-workspace source fails", () => {
  const response = minimalResponse(sourceFact({
    claimId: "claim-professional-leak",
    statement: "Professional is planned and has no real professional data connected.",
    supportingSourceIds: ["source-professional-planned"],
  }));
  const sources = [...STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES, ...PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES];

  expectError(validate(response, sources), "SOURCE_WORKSPACE_MISMATCH");
});

test("disallowed source type fails", () => {
  const request = clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE);
  request.allowedSourceTypes = ["workspace", "capability"];

  expectError(validate(validResponse(), STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES, request), "SOURCE_NOT_ALLOWED");
});

test("planned Professional capability presented as available fails", () => {
  const response = minimalResponse(sourceFact({
    claimId: "claim-professional-available-now",
    statement: "Professional is available now.",
    supportingSourceIds: ["source-professional-planned"],
  }));
  const sources = [...STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES, ...PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES];

  expectError(validate(response, sources), "PLANNED_CAPABILITY_PRESENTED_AS_AVAILABLE");
});

test("planned Personal capability presented as available fails", () => {
  const response = minimalResponse(sourceFact({
    claimId: "claim-personal-available-now",
    statement: "Personal is available now.",
    supportingSourceIds: ["source-personal-planned"],
  }));
  const sources = [...STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES, ...PERSONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES];

  expectError(validate(response, sources), "PLANNED_CAPABILITY_PRESENTED_AS_AVAILABLE");
});

test("approved recommendation fails", () => {
  const response = validResponse();
  response.candidateActions[0].recommendationStatus = "Approved";

  expectError(validate(response), "RECOMMENDATION_STATUS_NOT_ALLOWED");
});

test("executing recommendation fails", () => {
  const response = validResponse();
  response.candidateActions[0].recommendationStatus = "Executing";

  expectError(validate(response), "RECOMMENDATION_STATUS_NOT_ALLOWED");
});

test("completed recommendation fails", () => {
  const response = validResponse();
  response.candidateActions[0].recommendationStatus = "Completed";

  expectError(validate(response), "RECOMMENDATION_STATUS_NOT_ALLOWED");
});

test("recommendation without source trace fails", () => {
  const response = validResponse();
  response.candidateActions[0].sourceTrace = [];

  expectError(validate(response), "RECOMMENDATION_WITHOUT_SOURCE_TRACE");
});

test("recommendation without authority status fails", () => {
  const response = validResponse();
  response.candidateActions[0].authorityNeeded = "";
  response.candidateActions[0].authorityStatus = "";

  expectError(validate(response), "RECOMMENDATION_WITHOUT_AUTHORITY_STATUS");
});

test("unsupported numeric business claim fails", () => {
  const response = minimalResponse(sourceFact({
    claimId: "claim-unsupported-revenue",
    statement: "Stafford Revenue is $950 today.",
    supportingSourceIds: ["source-architecture-s009-contract"],
  }));

  expectError(validate(response), "UNSUPPORTED_NUMERIC_VALUE");
});

test("expected result presented as Outcome fails", () => {
  const response = minimalResponse({
    ...sourceFact({
      claimId: "claim-expected-as-outcome",
      claimType: "DERIVED_SUMMARY",
      statement: "The expected result occurred.",
      supportingSourceIds: ["source-action-start-my-day"],
    }),
  });

  expectError(validate(response), "EXPECTED_RESULT_PRESENTED_AS_OUTCOME");
});

test("Evidence presented as Proof fails", () => {
  const response = minimalResponse({
    ...sourceFact({
      claimId: "claim-evidence-as-proof",
      claimType: "DERIVED_SUMMARY",
      statement: "Supporting evidence is proof that the action worked.",
      supportingSourceIds: ["source-evidence-start-my-day"],
    }),
  });

  expectError(validate(response), "EVIDENCE_PRESENTED_AS_PROOF");
});

test("Proof presented as automatic completion fails", () => {
  const response = minimalResponse({
    ...sourceFact({
      claimId: "claim-proof-completes-action",
      claimType: "DERIVED_SUMMARY",
      statement: "Proof means the action is complete.",
      supportingSourceIds: ["source-proof-start-my-day-route"],
      limitation: "Historical route proof only.",
    }),
  });

  expectError(validate(response), "PROOF_PRESENTED_AS_COMPLETION");
});

test("Learning presented as Policy fails", () => {
  const response = minimalResponse({
    ...sourceFact({
      claimId: "claim-learning-as-policy",
      claimType: "DERIVED_SUMMARY",
      statement: "Learning is policy for future work.",
      supportingSourceIds: ["source-learning-os-grows-beside-operator"],
      limitation: "Historical lesson only.",
    }),
  });

  expectError(validate(response), "LEARNING_PRESENTED_AS_POLICY");
});

test("AI approval claim fails", () => {
  const response = validResponse();
  response.summary = "The AI approved this recommendation.";

  expectError(validate(response), "AI_AUTHORITY_CLAIM");
});

test("AI execution claim fails", () => {
  const response = validResponse();
  response.summary = "The Chief of Staff executed the Action.";

  expectError(validate(response), "AI_AUTHORITY_CLAIM");
});

test("missing limitation fails where required", () => {
  const response = validResponse();
  response.supportingClaims[0].limitation = "";

  expectError(validate(response), "MISSING_LIMITATION");
});

test("missing response limitation fails", () => {
  const response = validResponse();
  response.limitations = [];

  expectError(validate(response), "MISSING_LIMITATION");
});

test("missing authority status fails", () => {
  const response = validResponse();
  response.authorityStatus = "";

  expectError(validate(response), "MISSING_AUTHORITY_STATUS");
});

test("missing claim authority status fails", () => {
  const response = validResponse();
  response.supportingClaims[0].authorityStatus = "";

  expectError(validate(response), "MISSING_AUTHORITY_STATUS");
});

test("conflicting sources silently resolved fails", () => {
  const sources = conflictSources();
  const response = minimalResponse(sourceFact({
    claimId: "claim-conflict-current",
    statement: "The bounded status is ready.",
    supportingSourceIds: ["source-conflict-current"],
  }));

  expectError(validate(response, sources), "CONFLICT_SILENTLY_RESOLVED");
});

test("conflict disclosed with operator review passes", () => {
  const sources = conflictSources();
  const response = minimalResponse({
    claimId: "claim-conflict-disclosed",
    claimType: "DERIVED_SUMMARY",
    statement: "These sources conflict about the bounded status and need operator review.",
    supportingSourceIds: ["source-conflict-current", "source-conflict-historical"],
    confidenceClassification: "Not enough evidence",
    limitation: "One source is historical and the sources conflict; operator review is required.",
    workspaceId: "stafford-media",
    authorityStatus: "Operator review required",
    conflictDisclosure: true,
  });

  const result = validate(response, sources);
  assert.equal(result.valid, true);
});

test("stale source without disclosure fails", () => {
  const response = minimalResponse(sourceFact({
    claimId: "claim-proof-route-only",
    statement: "Historical Proof shows route availability only.",
    supportingSourceIds: ["source-proof-start-my-day-route"],
    limitation: "Static source only.",
  }));

  expectError(validate(response), "STALE_SOURCE_NOT_DISCLOSED");
});

test("safe UNKNOWN fallback passes", () => {
  const response = minimalResponse({
    claimId: "claim-unknown-fallback",
    claimType: "UNKNOWN",
    statement: CHIEF_OF_STAFF_SAFE_UNKNOWN_FALLBACK,
    supportingSourceIds: [],
    confidenceClassification: "Not enough evidence",
    limitation: "The current StaffordOS sources do not support the requested answer.",
    workspaceId: "stafford-media",
    authorityStatus: "Informational only",
  });
  response.sources = [];
  response.candidateActions = [];
  response.summary = CHIEF_OF_STAFF_SAFE_UNKNOWN_FALLBACK;

  const result = validate(response);
  assert.equal(result.valid, true);
});

test("unsupported confident answer fails", () => {
  const response = minimalResponse(sourceFact({
    claimId: "claim-confident-unsupported",
    statement: "The best customer to contact is already known.",
    supportingSourceIds: [],
    confidenceClassification: "High confidence",
  }));

  expectError(validate(response), "UNKNOWN_NOT_USED");
});

test("SOURCE_FACT requiring inference fails without direct support", () => {
  const response = minimalResponse(sourceFact({
    claimId: "claim-inference-as-fact",
    statement: "Therefore Start My Day should now be executed.",
    supportingSourceIds: ["source-action-start-my-day"],
  }));

  expectError(validate(response), "INFERENCE_NOT_LABELED");
});

test("invalid claim type fails", () => {
  const response = minimalResponse(sourceFact({
    claimId: "claim-invalid-type",
    claimType: "MAGIC",
  }));

  expectError(validate(response), "INVALID_CLAIM_TYPE");
});

test("private source outside request authorization fails", () => {
  const privateSource = {
    ...STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES[0],
    sourceId: "source-private-extra",
    privacyClassification: "owner_private_personal_fixture",
    supportedClaimIds: ["claim-private-extra"],
    supportedStatements: ["A private source says something."],
  };
  const response = minimalResponse(sourceFact({
    claimId: "claim-private-extra",
    statement: "A private source says something.",
    supportingSourceIds: ["source-private-extra"],
  }));

  expectError(validate(response, [...STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES, privateSource]), "PRIVATE_SOURCE_NOT_AUTHORIZED");
});

test("validator does not mutate its inputs", () => {
  const request = clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_REQUEST_FIXTURE);
  const sources = clone(STAFFORD_MEDIA_CHIEF_OF_STAFF_SOURCE_FIXTURES);
  const response = validResponse();
  const before = JSON.stringify({ request, sources, response });

  const result = validateChiefOfStaffResponse(request, sources, response);

  assert.equal(result.valid, true);
  assert.equal(JSON.stringify({ request, sources, response }), before);
});

test("Professional and Personal fixtures remain planned-only", () => {
  assert.ok(PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES.length > 0);
  assert.ok(PERSONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES.length > 0);
  assert.ok(PROFESSIONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES.every((source) => source.availability === "planned"));
  assert.ok(PERSONAL_CHIEF_OF_STAFF_SOURCE_FIXTURES.every((source) => source.availability === "planned"));
});

test("validation report formatter uses operator-safe language", () => {
  const validReport = formatChiefOfStaffValidationReport(validate(validResponse()));
  assert.equal(validReport.headline, "Response follows the current StaffordOS rules.");
  assert.equal(validReport.trusted, true);

  const invalidResponse = validResponse();
  invalidResponse.supportingClaims[0].supportingSourceIds = [];
  const invalidReport = formatChiefOfStaffValidationReport(validate(invalidResponse));
  assert.equal(invalidReport.headline, "Response cannot be shown as trusted.");
  assert.equal(invalidReport.trusted, false);
  assert.ok(invalidReport.technicalDetails.some((detail) => detail.includes("CLAIM_WITHOUT_SOURCE")));
});

test("validator source contains no external calls, persistence, runtime prompts, or operator imports", () => {
  assert.doesNotMatch(validatorSource, /fetch\(|XMLHttpRequest|https?:\/\/|openai|anthropic|gemini|googleai|embedding|vector|prisma|\/api\/|writeFile|localStorage|sessionStorage|promptTemplate|chatCompletion|operator\/|from "\.\.\/operator|from '\.\.\/operator/i);
});
