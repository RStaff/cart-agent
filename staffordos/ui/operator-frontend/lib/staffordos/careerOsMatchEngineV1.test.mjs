import assert from "node:assert/strict";
import test from "node:test";
import { buildOpportunityMatchResult, MATCH_ENGINE_WEIGHTS } from "./careerOsMatchEngineV1.mjs";

const preference = { state: "MATCH", reason: "Matches the explicit test preference.", preferenceAuthority: "ROSS_OPERATOR_EXPLICIT" };
const base = {
  opportunity: { opportunityId: "opp-1", canonicalOpportunityId: "canon-1", sourceRecordId: "source-1", providerJobId: "job-1", providerName: "Greenhouse", company: "Example", title: "Technical Program Manager", location: "Boston, MA", remoteState: "Hybrid", descriptionText: "A detailed role description with responsibilities and qualifications.", freshness: "RECENT", sourceAuthority: "PUBLIC_READ_ONLY_PROVIDER" },
  requirements: [
    { id: "req-1", requirementLevel: "REQUIRED", importanceClassification: "Required", requirementCategory: "Skill", extractionConfidence: "High" },
    { id: "req-2", requirementLevel: "PREFERRED", importanceClassification: "Preferred", requirementCategory: "Responsibility", extractionConfidence: "Moderate" },
  ],
  mappings: [
    { requirementId: "req-1", classification: "PROVEN", careerEvidenceIds: ["e-1"], careerFactIds: [], conflictStatus: "NO_CONFLICT" },
    { requirementId: "req-2", classification: "TRANSFERABLE", careerEvidenceIds: ["e-2"], careerFactIds: [], conflictStatus: "NO_CONFLICT" },
  ],
  qualification: { state: "PLAUSIBLE_TARGET", reasons: ["Target lane supported."], hardMismatchCategories: [] },
  recommendation: "REVIEW",
  recommendationReasons: ["Existing J003 recommendation."],
  preferenceCompatibility: preference,
  queueItem: { state: "READY_FOR_OPPORTUNITY_IMPORT", rankingSummary: { totalScore: 70, categoryContributions: [{ matchedTerms: ["program"] }] } },
};

test("produces a decomposable contract result without changing source input", () => {
  const input = structuredClone(base);
  const result = buildOpportunityMatchResult(input);
  assert.equal(result.fit.scoreStatus, "PARTIAL");
  assert.equal(typeof result.fit.score, "number");
  assert.equal(result.fit.components.length, 8);
  assert.equal(result.confidence.components.length, 7);
  assert.equal(result.preferences.compatibility, "MATCH");
  assert.deepEqual(input, base);
  assert.equal(MATCH_ENGINE_WEIGHTS.requiredSkillsFit, 35);
});

test("hard mismatch remains ineligible despite diagnostic fit inputs", () => {
  const result = buildOpportunityMatchResult({ ...base, qualification: { state: "HARD_MISMATCH", reasons: ["Missing mandatory certification."], hardMismatchCategories: ["mandatory certification"] } });
  assert.equal(result.eligibility.state, "INELIGIBLE");
  assert.match(result.eligibility.blockingReasons[0], /certification/);
});

test("unknown preference and unknown location remain unknown", () => {
  const result = buildOpportunityMatchResult({ ...base, opportunity: { ...base.opportunity, location: null, remoteState: null }, preferenceCompatibility: { state: "UNKNOWN", reason: "Preferences are unresolved." } });
  assert.equal(result.preferences.compatibility, "UNKNOWN");
  assert.equal(result.fit.components.find((item) => item.name === "geographyWorkArrangementFit").value, null);
  assert.ok(result.confidence.missingInputs.includes("location"));
});

test("transferable evidence is not counted as exact evidence", () => {
  const result = buildOpportunityMatchResult(base);
  assert.equal(result.evidenceSummary.exactEvidenceCount, 1);
  assert.equal(result.evidenceSummary.transferableEvidenceCount, 1);
});

test("outside preference does not rescue qualification and remains explainable", () => {
  const result = buildOpportunityMatchResult({ ...base, preferenceCompatibility: { state: "OUTSIDE_PREFERENCE", reason: "Outside the explicit test region." } });
  assert.equal(result.preferences.compatibility, "OUTSIDE_PREFERENCE");
  assert.equal(result.fit.components.find((item) => item.name === "geographyWorkArrangementFit").value, 0);
  assert.equal(result.eligibility.state, "ELIGIBLE");
});

test("authority diagnostics keep transferable responsibility separate from capability failure", async () => {
  const { projectMatchAuthorityDiagnostics } = await import("./careerOsMatchAuthorityProjections.mjs");
  const diagnostics = projectMatchAuthorityDiagnostics({ title: "Director, Technical Program Management", requirements: [{ id: "r1", requirementCategory: "Leadership", requirementLevel: "RESPONSIBILITY", requirementText: "Lead complex cross-functional programs." }], mappings: [{ requirementId: "r1", classification: "TRANSFERABLE", careerEvidenceIds: ["e1"] }] });
  assert.equal(diagnostics.responsibilitySimilarity.counts.STRONG_TRANSFERABLE_SUPPORT, 1);
  assert.equal(diagnostics.responsibilitySimilarity.comparisons[0].capabilityConclusion, "TRANSFERABLE_CAPABILITY");
  assert.equal(diagnostics.seniorityCompatibility.state, "UPWARD_STRETCH_WITH_SUPPORTED_SCOPE");
  assert.equal(diagnostics.seniorityCompatibility.capabilityConclusion, "NO_PROOF_OF_LEVEL_CAPABILITY_GAP");
  assert.equal(diagnostics.domainCompatibility.capabilityConclusion, "TRANSFERABLE_CAPABILITY");
});

test("unknown and missing evidence do not become capability failures", async () => {
  const { projectMatchAuthorityDiagnostics } = await import("./careerOsMatchAuthorityProjections.mjs");
  const diagnostics = projectMatchAuthorityDiagnostics({ title: "AI Operations Lead", requirements: [{ id: "r1", requirementCategory: "Responsibility", requirementText: "Build an operating model." }, { id: "r2", requirementCategory: "Responsibility", requirementText: "Lead transformation." }], mappings: [{ requirementId: "r1", classification: "UNKNOWN" }, { requirementId: "r2", classification: "MISSING" }] });
  assert.equal(diagnostics.responsibilitySimilarity.counts.UNKNOWN, 1);
  assert.equal(diagnostics.responsibilitySimilarity.counts.NO_SUPPORTED_EVIDENCE, 1);
  assert.equal(diagnostics.responsibilitySimilarity.comparisons[0].capabilityConclusion, "UNRESOLVED_CAPABILITY");
  assert.equal(diagnostics.responsibilitySimilarity.comparisons[1].capabilityConclusion, "NO_PROOF_OF_CAPABILITY_GAP");
});

test("result exposes every V1 contract section", () => {
  const result = buildOpportunityMatchResult(base);
  for (const field of ["opportunityId", "opportunityIdentity", "eligibility", "qualification", "requirementSummary", "evidenceSummary", "fit", "confidence", "preferences", "recommendation", "workflow", "application"]) {
    assert.ok(Object.hasOwn(result, field), field);
  }
});
