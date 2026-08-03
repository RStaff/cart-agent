import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const contractPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobSearchContracts.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const contractSource = readFileSync(contractPath, "utf8");

function compileModule(source, filename) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}

const contract = compileModule(contractSource, contractPath);

const {
  JOB_OPPORTUNITY_FIXTURES,
  JOB_REQUIREMENT_FIXTURES,
  JOB_SEARCH_APPLICATION_BOUNDARY,
  JOB_SEARCH_CHIEF_OF_STAFF_SOURCE_TYPES,
  JOB_SEARCH_FIT_ASSESSMENT_BOUNDARY,
  JOB_SEARCH_SOURCE_TYPES,
  JOB_SEARCH_WORKSPACE_ID,
  JOB_SOURCE_FIXTURES,
  getJobSearchChiefOfStaffCompatibility,
  getOpportunityById,
  getRequirementsForOpportunity,
  validateJobOpportunityFixture,
  validateJobRequirementFixture,
  validateJobSourceFixture,
} = contract;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function codes(result) {
  return result.errors.map((error) => error.code);
}

function assertInvalid(result, expectedCode) {
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes(expectedCode), `expected ${expectedCode}, got ${codes(result).join(", ")}`);
}

const validSource = JOB_SOURCE_FIXTURES[0];
const unknownDateSource = JOB_SOURCE_FIXTURES[1];
const validOpportunity = JOB_OPPORTUNITY_FIXTURES[0];
const possibleDuplicateOpportunity = JOB_OPPORTUNITY_FIXTURES[1];
const requiredRequirement = JOB_REQUIREMENT_FIXTURES[0];
const preferredRequirement = JOB_REQUIREMENT_FIXTURES[1];
const ambiguousRequirement = JOB_REQUIREMENT_FIXTURES[2];
const equivalentRequirement = JOB_REQUIREMENT_FIXTURES[3];

test("valid JobSource fixture passes", () => {
  const result = validateJobSourceFixture(validSource);

  assert.equal(result.valid, true);
  assert.equal(result.checkedRecordCount, 1);
});

test("valid JobOpportunity fixture passes", () => {
  const result = validateJobOpportunityFixture(validOpportunity);

  assert.equal(result.valid, true);
});

test("valid JobRequirement fixture passes", () => {
  const result = validateJobRequirementFixture(requiredRequirement);

  assert.equal(result.valid, true);
});

test("Professional workspace is required", () => {
  assert.equal(validSource.workspaceId, JOB_SEARCH_WORKSPACE_ID);
  assert.equal(validOpportunity.workspaceId, JOB_SEARCH_WORKSPACE_ID);
  assert.equal(requiredRequirement.workspaceId, JOB_SEARCH_WORKSPACE_ID);
});

test("Business workspace is rejected", () => {
  const source = clone(validSource);
  source.workspaceId = "stafford-media";

  assertInvalid(validateJobSourceFixture(source), "WORKSPACE_NOT_PROFESSIONAL");
});

test("Personal workspace is rejected", () => {
  const opportunity = clone(validOpportunity);
  opportunity.workspaceId = "personal";

  assertInvalid(validateJobOpportunityFixture(opportunity), "WORKSPACE_NOT_PROFESSIONAL");
});

test("public source data does not change Professional privacy of Ross-specific fields", () => {
  assert.equal(validSource.privacyClassification, "Public listing with Professional handling");
  assert.equal(validOpportunity.privacyClassification, "Professional owner-private");

  const opportunity = clone(validOpportunity);
  opportunity.privacyClassification = "Public listing with Professional handling";
  assertInvalid(validateJobOpportunityFixture(opportunity), "PROFESSIONAL_PRIVACY_REQUIRED");
});

test("Opportunity requires a durable opaque ID", () => {
  const opportunity = clone(validOpportunity);
  opportunity.id = "Northstar Systems Lab Platform Program Manager";

  assertInvalid(validateJobOpportunityFixture(opportunity), "DURABLE_ID_REQUIRED");
});

test("Source URL is not used as primary ID", () => {
  const source = clone(validSource);
  source.id = source.sourceUrl;

  const result = validateJobSourceFixture(source);
  assertInvalid(result, "DURABLE_ID_REQUIRED");
  assertInvalid(result, "URL_USED_AS_PRIMARY_ID");
});

test("Provider record ID is not used as primary ID", () => {
  const source = clone(validSource);
  source.id = source.providerRecordId;

  const result = validateJobSourceFixture(source);
  assertInvalid(result, "DURABLE_ID_REQUIRED");
  assertInvalid(result, "PROVIDER_ID_USED_AS_PRIMARY_ID");
});

test("unknown published date remains Unknown", () => {
  assert.equal(unknownDateSource.publishedAt, null);
  assert.equal(unknownDateSource.updatedAt, null);
  assert.equal(unknownDateSource.freshness, "Unknown");
  assert.equal(validateJobSourceFixture(unknownDateSource).valid, true);
});

test("missing status does not become open", () => {
  const opportunity = clone(validOpportunity);
  delete opportunity.opportunityStatus;

  assertInvalid(validateJobOpportunityFixture(opportunity), "OPPORTUNITY_STATUS_MISSING");
});

test("Required and Preferred remain distinct", () => {
  assert.equal(requiredRequirement.requirementLevel, "REQUIRED");
  assert.equal(preferredRequirement.requirementLevel, "PREFERRED");

  const requirement = clone(preferredRequirement);
  requirement.requirementLevel = "REQUIRED";
  assertInvalid(validateJobRequirementFixture(requirement), "REQUIREMENT_LEVEL_CONFLICT");
});

test("Ambiguous requirement remains unclear", () => {
  assert.equal(ambiguousRequirement.requirementLevel, "UNCLEAR");
  assert.match(ambiguousRequirement.ambiguity, /does not say/);

  const requirement = clone(ambiguousRequirement);
  requirement.requirementLevel = "REQUIRED";
  assertInvalid(validateJobRequirementFixture(requirement), "REQUIREMENT_AMBIGUITY_NOT_PRESERVED");
});

test("or equivalent wording is preserved", () => {
  assert.match(equivalentRequirement.requirementText, /or equivalent/);
  assert.match(equivalentRequirement.normalizedRequirement, /or equivalent/);

  const requirement = clone(equivalentRequirement);
  requirement.normalizedRequirement = "Bachelor's degree in computer science or business.";
  assertInvalid(validateJobRequirementFixture(requirement), "EQUIVALENT_WORDING_NOT_PRESERVED");
});

test("AI-proposed extraction is not operator-confirmed", () => {
  const requirement = clone(requiredRequirement);
  requirement.extractionMethod = "AI_PROPOSED";
  requirement.operatorReviewStatus = "Operator confirmed";

  assertInvalid(validateJobRequirementFixture(requirement), "AI_PROPOSED_NOT_CONFIRMED");
});

test("Requirement without source trace fails", () => {
  const requirement = clone(requiredRequirement);
  requirement.sourceExcerptReference = "";

  const result = validateJobRequirementFixture(requirement);
  assertInvalid(result, "FIELD_REQUIRED");
  assertInvalid(result, "SOURCE_TRACE_REQUIRED");
});

test("Unsupported opportunity status fails", () => {
  const opportunity = clone(validOpportunity);
  opportunity.opportunityStatus = "SUBMITTED";

  assertInvalid(validateJobOpportunityFixture(opportunity), "OPPORTUNITY_STATUS_UNSUPPORTED");
});

test("Historical context cannot appear current", () => {
  const source = clone(validSource);
  source.id = "jobsrc_prof_historical_context";
  source.sourceType = "Historical continuity context";
  source.freshness = "Historical";
  source.status = "Historical context";
  source.publishedAt = null;
  source.updatedAt = null;

  const opportunity = clone(validOpportunity);
  opportunity.sourceId = source.id;
  opportunity.listingFreshness = "Current";

  assertInvalid(validateJobOpportunityFixture(opportunity, [source]), "HISTORICAL_CONTEXT_PRESENTED_CURRENT");
});

test("Source falsely classified as open fails", () => {
  const source = clone(validSource);
  source.status = "Open";

  assertInvalid(validateJobSourceFixture(source), "SOURCE_STATUS_FALSELY_OPEN");
});

test("Possible duplicate is not silently merged", () => {
  assert.equal(possibleDuplicateOpportunity.duplicateStatus, "POSSIBLE_DUPLICATE");
  assert.equal(validateJobOpportunityFixture(possibleDuplicateOpportunity).valid, true);
  assert.equal(getOpportunityById(possibleDuplicateOpportunity.id)?.id, possibleDuplicateOpportunity.id);
});

test("Confirmed duplicate without group fails", () => {
  const opportunity = clone(validOpportunity);
  opportunity.duplicateStatus = "CONFIRMED_DUPLICATE";
  opportunity.duplicateGroupId = null;

  assertInvalid(validateJobOpportunityFixture(opportunity), "DUPLICATE_SILENTLY_MERGED");
});

test("JobOpportunity is distinct from Application", () => {
  assert.match(JOB_SEARCH_APPLICATION_BOUNDARY, /not an Application/);
  assert.match(validOpportunity.limitations.join(" "), /Ross has not applied/);

  const opportunity = clone(validOpportunity);
  opportunity.applicationStatus = "SUBMITTED";
  assertInvalid(validateJobOpportunityFixture(opportunity), "APPLICATION_FIELD_NOT_ALLOWED");
});

test("REJECTED_BY_ROSS is not employer rejection", () => {
  const statusModel = contract.JOB_OPPORTUNITY_STATUS_MODEL.find((item) => item.status === "REJECTED_BY_ROSS");
  assert.equal(statusModel.label, "Passed on this role");

  const opportunity = clone(validOpportunity);
  opportunity.opportunityStatus = "REJECTED_BY_EMPLOYER";
  assertInvalid(validateJobOpportunityFixture(opportunity), "OPPORTUNITY_STATUS_UNSUPPORTED");
});

test("No fit score exists in the contracts", () => {
  assert.doesNotMatch(contractSource, /fitScore:|fitPercentage:|matchScore:|likelihoodOfOffer:/);
  assert.doesNotMatch(JSON.stringify(JOB_OPPORTUNITY_FIXTURES), /fitScore|fitPercentage|matchScore|likelihoodOfOffer/);
  assert.doesNotMatch(JSON.stringify(JOB_REQUIREMENT_FIXTURES), /fitScore|fitPercentage|matchScore|likelihoodOfOffer/);

  const opportunity = clone(validOpportunity);
  opportunity.fitScore = 92;
  assertInvalid(validateJobOpportunityFixture(opportunity), "FIT_ASSESSMENT_FIELD_NOT_ALLOWED");
});

test("No CandidateEvidence exists in this slice", () => {
  assert.doesNotMatch(contractSource, /export type CandidateEvidence/);
  assert.doesNotMatch(contractSource, /JOB_CANDIDATE_EVIDENCE_FIXTURES/);
  assert.match(JOB_SEARCH_FIT_ASSESSMENT_BOUNDARY, /Candidate evidence and fit assessment come later/);
});

test("No application submission method exists", () => {
  assert.doesNotMatch(
    contractSource,
    /export function (create|update|delete|submit|qualify|reject|apply|persist|sync|fetch|scrape|import)/i
  );
});

test("No fetch, scrape, network, API, database, or persistence path exists", () => {
  assert.doesNotMatch(contractSource, /fetch\(|XMLHttpRequest|prisma|writeFile|readFile|\/api\/|ollama|vector|embedding/i);
});

test("Validators do not mutate inputs", () => {
  const source = clone(validSource);
  const opportunity = clone(validOpportunity);
  const requirement = clone(requiredRequirement);
  const before = JSON.stringify({ source, opportunity, requirement });

  validateJobSourceFixture(source);
  validateJobOpportunityFixture(opportunity);
  validateJobRequirementFixture(requirement);

  assert.equal(JSON.stringify({ source, opportunity, requirement }), before);
});

test("Fixture records are explicitly test-only", () => {
  assert.equal(JOB_SOURCE_FIXTURES.length, 2);
  assert.equal(JOB_OPPORTUNITY_FIXTURES.length, 2);
  assert.equal(JOB_REQUIREMENT_FIXTURES.length, 8);
  assert.ok(JOB_SOURCE_FIXTURES.every((fixture) => fixture.testOnly === true));
  assert.ok(JOB_OPPORTUNITY_FIXTURES.every((fixture) => fixture.testOnly === true));
  assert.ok(JOB_REQUIREMENT_FIXTURES.every((fixture) => fixture.testOnly === true));
});

test("S009 source-contract compatibility fields are available", () => {
  const compatibility = getJobSearchChiefOfStaffCompatibility();

  assert.deepEqual([...JOB_SEARCH_CHIEF_OF_STAFF_SOURCE_TYPES], [
    "job_opportunity_snapshot",
    "job_requirement_snapshot",
  ]);
  for (const field of [
    "source ID",
    "workspace",
    "authority",
    "freshness",
    "privacy",
    "exact source reference",
    "limitations",
    "excluded fields",
    "permission requirement",
  ]) {
    assert.ok(compatibility.requiredFields.includes(field), `${field} missing`);
  }
});

test("Malformed URL fails without external access", () => {
  const source = clone(validSource);
  source.sourceUrl = "not a url";

  assertInvalid(validateJobSourceFixture(source), "URL_MALFORMED");
});

test("Missing opportunity source fails", () => {
  const opportunity = clone(validOpportunity);
  opportunity.sourceId = "jobsrc_prof_missing";

  assertInvalid(validateJobOpportunityFixture(opportunity), "SOURCE_NOT_FOUND");
});

test("Invented years of experience fails", () => {
  const requirement = clone(requiredRequirement);
  requirement.yearsMentioned = 7;

  assertInvalid(validateJobRequirementFixture(requirement), "YEARS_INVENTED");
});

test("Requirements are looked up by explicit opportunity ID", () => {
  const requirements = getRequirementsForOpportunity(validOpportunity.id);

  assert.ok(requirements.length > 0);
  assert.ok(requirements.every((requirement) => requirement.jobOpportunityId === validOpportunity.id));
});

test("Opportunity lookup uses explicit ID and unsupported IDs fail safely", () => {
  assert.equal(getOpportunityById(validOpportunity.id)?.roleTitle, validOpportunity.roleTitle);
  assert.equal(getOpportunityById("jobopp_prof_missing"), null);
  assert.equal(getOpportunityById(null), null);
});

test("Source types include permitted source classifications", () => {
  for (const sourceType of [
    "Employer career site",
    "Recruiter-provided",
    "Professional network",
    "Job board",
    "Operator-entered",
    "Imported document",
    "Historical continuity context",
    "Needs verification",
  ]) {
    assert.ok(JOB_SEARCH_SOURCE_TYPES.includes(sourceType), `${sourceType} missing`);
  }
});
