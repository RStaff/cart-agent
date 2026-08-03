import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const contractPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/careerEvidenceContracts.ts");
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
  CAREER_CHIEF_OF_STAFF_SOURCE_TYPES,
  CAREER_EVIDENCE_FIXTURES,
  CAREER_EVIDENCE_WORKSPACE_ID,
  CAREER_FACT_EVIDENCE_POSITIONING_BOUNDARY,
  CAREER_FACT_FIXTURES,
  CAREER_JOB_REQUIREMENT_COMPATIBILITY_FIELDS,
  CAREER_RESUME_BOUNDARY,
  determineVerificationEligibility,
  getCareerChiefOfStaffCompatibility,
  getCareerJobRequirementCompatibility,
  getEvidenceForFact,
  getFactsSupportedByEvidence,
  identifyFactConflicts,
  validateCareerEvidenceFixture,
  validateCareerFactFixture,
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

const educationFact = CAREER_FACT_FIXTURES.find((fact) => fact.factType === "EDUCATION");
const certificationFact = CAREER_FACT_FIXTURES.find((fact) => fact.factType === "CERTIFICATION");
const projectFact = CAREER_FACT_FIXTURES.find((fact) => fact.factType === "PROJECT");
const controlledTechFact = CAREER_FACT_FIXTURES.find((fact) => fact.id === "careerfact_prof_technology_typescript_controlled");
const studiedTechFact = CAREER_FACT_FIXTURES.find((fact) => fact.id === "careerfact_prof_technology_riverdb_studied");
const employmentConflictFact = CAREER_FACT_FIXTURES.find((fact) => fact.factType === "EMPLOYMENT");
const unsupportedMetricFact = CAREER_FACT_FIXTURES.find((fact) => fact.factType === "ACHIEVEMENT");
const operatorFact = CAREER_FACT_FIXTURES.find((fact) => fact.factType === "LEADERSHIP");
const officialEvidence = CAREER_EVIDENCE_FIXTURES.find((evidence) => evidence.id === "careerev_prof_education_official_record");
const generatedResumeEvidence = CAREER_EVIDENCE_FIXTURES.find((evidence) => evidence.id === "careerev_prof_historical_resume_wording");

test("valid CareerFact fixture passes", () => {
  const result = validateCareerFactFixture(educationFact);

  assert.equal(result.valid, true);
  assert.equal(result.checkedRecordCount, 1);
});

test("valid CareerEvidence fixture passes", () => {
  const result = validateCareerEvidenceFixture(officialEvidence);

  assert.equal(result.valid, true);
  assert.equal(result.checkedRecordCount, 1);
});

test("Professional workspace is required", () => {
  assert.equal(educationFact.workspaceId, CAREER_EVIDENCE_WORKSPACE_ID);
  assert.equal(officialEvidence.workspaceId, CAREER_EVIDENCE_WORKSPACE_ID);
});

test("Business workspace is rejected", () => {
  const fact = clone(educationFact);
  fact.workspaceId = "stafford-media";

  const result = validateCareerFactFixture(fact);
  assertInvalid(result, "WORKSPACE_NOT_PROFESSIONAL");
  assertInvalid(result, "BUSINESS_OR_PERSONAL_LEAKAGE");
});

test("Personal workspace is rejected", () => {
  const evidence = clone(officialEvidence);
  evidence.workspaceId = "personal";

  const result = validateCareerEvidenceFixture(evidence);
  assertInvalid(result, "WORKSPACE_NOT_PROFESSIONAL");
  assertInvalid(result, "BUSINESS_OR_PERSONAL_LEAKAGE");
});

test("durable opaque IDs are required", () => {
  const fact = clone(educationFact);
  fact.id = "education-aurora-college";

  assertInvalid(validateCareerFactFixture(fact), "DURABLE_ID_REQUIRED");
});

test("source URL cannot be the primary ID", () => {
  const evidence = clone(officialEvidence);
  evidence.id = "https://career-fixtures.example.test/education";

  const result = validateCareerEvidenceFixture(evidence);
  assertInvalid(result, "DURABLE_ID_REQUIRED");
  assertInvalid(result, "URL_USED_AS_PRIMARY_ID");
});

test("VERIFIED requires supporting evidence", () => {
  const fact = clone(educationFact);
  fact.sourceEvidenceIds = [];

  assertInvalid(validateCareerFactFixture(fact), "VERIFIED_REQUIRES_EVIDENCE");
});

test("generated resume alone cannot verify a fact", () => {
  const fact = clone(certificationFact);
  fact.verificationStatus = "VERIFIED";
  fact.supportLevel = "DIRECT";
  fact.authorityClassification = "GENERATED_DOCUMENT";
  fact.sourceEvidenceIds = [generatedResumeEvidence.id];
  fact.current = false;

  const result = validateCareerFactFixture(fact);
  assertInvalid(result, "GENERATED_RESUME_CANNOT_VERIFY_FACT");
});

test("PARTIALLY_SUPPORTED cannot become VERIFIED", () => {
  const fact = clone(projectFact);
  fact.verificationStatus = "VERIFIED";
  fact.supportLevel = "PARTIAL";

  assertInvalid(validateCareerFactFixture(fact), "PARTIALLY_SUPPORTED_PRESENTED_VERIFIED");
});

test("conflicting title remains unresolved", () => {
  const fact = clone(employmentConflictFact);
  fact.verificationStatus = "VERIFIED";
  fact.supportLevel = "DIRECT";

  const result = validateCareerFactFixture(fact);
  assertInvalid(result, "CONFLICT_SILENTLY_RESOLVED");
  assertInvalid(result, "TITLE_CONFLICT_SILENTLY_RESOLVED");
});

test("conflicting dates remain unresolved", () => {
  const fact = clone(employmentConflictFact);
  fact.verificationStatus = "PARTIALLY_SUPPORTED";

  const result = validateCareerFactFixture(fact);
  assertInvalid(result, "CONFLICT_SILENTLY_RESOLVED");
  assertInvalid(result, "DATE_CONFLICT_SILENTLY_RESOLVED");
});

test("unsupported accomplishment metric fails", () => {
  const result = validateCareerFactFixture(unsupportedMetricFact);

  assertInvalid(result, "UNSUPPORTED_METRIC");
});

test("unsupported years fail", () => {
  const fact = clone(controlledTechFact);
  fact.yearsOfExperience = 4;
  fact.yearsAuthority = null;

  assertInvalid(validateCareerFactFixture(fact), "UNSUPPORTED_YEARS_OF_EXPERIENCE");
});

test("unsupported proficiency labels fail", () => {
  const fact = clone(controlledTechFact);
  fact.proficiencyLabel = "Expert";

  assertInvalid(validateCareerFactFixture(fact), "UNSUPPORTED_PROFICIENCY_LABEL");
});

test("official-document evidence supports verification eligibility", () => {
  const fact = clone(educationFact);
  fact.verificationStatus = "PROPOSED";

  const eligibility = determineVerificationEligibility(fact);
  assert.equal(eligibility.eligibilityStatus, "ELIGIBLE_FOR_OPERATOR_VERIFICATION");
  assert.equal(fact.verificationStatus, "PROPOSED");
});

test("repository evidence supports only scoped project facts", () => {
  const result = validateCareerFactFixture(projectFact);

  assert.equal(result.valid, true);
  assert.equal(projectFact.deploymentClaim, "LOCAL_ONLY");
  assert.equal(projectFact.customerUseClaim, "NONE");
  assert.match(projectFact.limitations.join(" "), /does not prove deployment or customer use/);
});

test("controlled-project use does not become production use", () => {
  const fact = clone(controlledTechFact);
  fact.experienceClassification = "USED_IN_PRODUCTION";

  assertInvalid(validateCareerFactFixture(fact), "PRODUCTION_USE_UNSUPPORTED");
});

test("studied technology does not become professional experience", () => {
  assert.equal(studiedTechFact.experienceClassification, "STUDIED");

  const fact = clone(studiedTechFact);
  fact.experienceClassification = "USED_IN_PRODUCTION";

  assertInvalid(validateCareerFactFixture(fact), "PRODUCTION_USE_UNSUPPORTED");
});

test("operator attestation remains labeled", () => {
  const evidence = getEvidenceForFact(operatorFact.id).find((item) => item.sourceType === "OPERATOR_ATTESTATION");

  assert.ok(evidence);
  assert.equal(operatorFact.authorityClassification, "OPERATOR_CONFIRMED");
  assert.equal(evidence.sourceType, "OPERATOR_ATTESTATION");
  assert.match(operatorFact.limitations.join(" "), /does not prove people-management authority/);
  assert.equal(validateCareerFactFixture(operatorFact).valid, true);
});

test("historical wording cannot become current truth automatically", () => {
  const fact = clone(certificationFact);
  fact.verificationStatus = "VERIFIED";
  fact.supportLevel = "DIRECT";
  fact.authorityClassification = "HISTORICAL_CONTINUITY";
  fact.current = true;

  assertInvalid(validateCareerFactFixture(fact), "HISTORICAL_WORDING_PRESENTED_CURRENT");
});

test("certification without authority is not verification eligible", () => {
  const eligibility = determineVerificationEligibility(certificationFact);

  assert.equal(eligibility.eligibilityStatus, "NOT_ELIGIBLE");
  assert.match(eligibility.reasons.join(" "), /Certification needs provider confirmation/);
});

test("project deployment requires evidence", () => {
  const fact = clone(projectFact);
  fact.deploymentClaim = "DEPLOYED";

  assertInvalid(validateCareerFactFixture(fact), "PROJECT_DEPLOYMENT_UNSUPPORTED");
});

test("customer adoption requires evidence", () => {
  const fact = clone(projectFact);
  fact.customerUseClaim = "CUSTOMER_USED";

  assertInvalid(validateCareerFactFixture(fact), "CUSTOMER_USE_UNSUPPORTED");
});

test("conflict detection works", () => {
  const conflicts = identifyFactConflicts();
  const conflict = conflicts.find((item) => item.factId === employmentConflictFact.id);

  assert.ok(conflict);
  assert.ok(conflict.conflictTypes.includes("TITLE_CONFLICT"));
  assert.ok(conflict.conflictTypes.includes("START_DATE_CONFLICT"));
  assert.ok(conflict.conflictTypes.includes("END_DATE_CONFLICT"));
  assert.ok(conflict.evidenceIds.includes("careerev_prof_employment_title_b"));
});

test("verification eligibility does not mutate status", () => {
  const fact = clone(projectFact);
  const before = JSON.stringify(fact);

  const eligibility = determineVerificationEligibility(fact);

  assert.equal(eligibility.verificationStatusUnchanged, fact.verificationStatus);
  assert.equal(JSON.stringify(fact), before);
});

test("validators do not mutate inputs", () => {
  const fact = clone(educationFact);
  const evidence = clone(officialEvidence);
  const beforeFact = JSON.stringify(fact);
  const beforeEvidence = JSON.stringify(evidence);

  validateCareerFactFixture(fact);
  validateCareerEvidenceFixture(evidence);

  assert.equal(JSON.stringify(fact), beforeFact);
  assert.equal(JSON.stringify(evidence), beforeEvidence);
});

test("fixtures are test-only", () => {
  assert.ok(CAREER_FACT_FIXTURES.length <= 8);
  assert.ok(CAREER_EVIDENCE_FIXTURES.length <= 10);
  assert.ok(CAREER_FACT_FIXTURES.every((fact) => fact.testOnly === true));
  assert.ok(CAREER_EVIDENCE_FIXTURES.every((evidence) => evidence.testOnly === true));
});

test("no real Ross career data exists", () => {
  const fixtureText = JSON.stringify({ facts: CAREER_FACT_FIXTURES, evidence: CAREER_EVIDENCE_FIXTURES });

  assert.ok(CAREER_FACT_FIXTURES.every((fact) => fact.subject === "Synthetic candidate"));
  assert.doesNotMatch(fixtureText, /\bBosch\b/i);
  assert.doesNotMatch(fixtureText, /\bRobert Bosch\b/i);
  assert.doesNotMatch(fixtureText, /\bStafford Media\b/);
  assert.doesNotMatch(fixtureText, /\bShopiFixer\b/);
  assert.doesNotMatch(fixtureText, /\bAbando\b/);
});

test("no create update delete verify resume generation fit scoring persistence fetch or AI path exists", () => {
  assert.doesNotMatch(contractSource, /export function (create|update|delete|approve|import|parseResume|generateResume|tailor|score|persist|sync|fetch|invoke)/);
  assert.doesNotMatch(contractSource, /\bfetch\s*\(/);
  assert.doesNotMatch(contractSource, /\bXMLHttpRequest\b/);
  assert.doesNotMatch(contractSource, /\bollama\b/i);
  assert.doesNotMatch(contractSource, /\bopenai\b/i);
  assert.doesNotMatch(contractSource, /\bprisma\b/i);
});

test("compatibility fields exist for S010.01 mapping", () => {
  const compatibility = getCareerJobRequirementCompatibility();

  assert.match(compatibility.mapping, /JobRequirement/);
  assert.equal(compatibility.candidateEvidenceImplemented, false);
  assert.equal(compatibility.fitMappingImplemented, false);
  assert.ok(CAREER_JOB_REQUIREMENT_COMPATIBILITY_FIELDS.includes("fact type"));
  assert.ok(CAREER_JOB_REQUIREMENT_COMPATIBILITY_FIELDS.includes("verification status"));
});

test("Chief of Staff future source types remain unauthorized for model use", () => {
  const compatibility = getCareerChiefOfStaffCompatibility();

  assert.ok(CAREER_CHIEF_OF_STAFF_SOURCE_TYPES.includes("career_fact_snapshot"));
  assert.ok(CAREER_CHIEF_OF_STAFF_SOURCE_TYPES.includes("career_evidence_snapshot"));
  assert.ok(CAREER_CHIEF_OF_STAFF_SOURCE_TYPES.includes("career_conflict_snapshot"));
  assert.equal(compatibility.authorizedForModelUseNow, false);
});

test("Fact Evidence and Positioning boundary is explicit", () => {
  assert.match(CAREER_FACT_EVIDENCE_POSITIONING_BOUNDARY, /Career facts assert truth/);
  assert.match(CAREER_FACT_EVIDENCE_POSITIONING_BOUNDARY, /positioning/);
});

test("resume boundary treats resumes as downstream artifacts", () => {
  assert.match(CAREER_RESUME_BOUNDARY, /downstream/);
  assert.match(CAREER_RESUME_BOUNDARY, /not primary authority/);
});

test("Positioning text changing the underlying fact fails", () => {
  const fact = clone(operatorFact);
  fact.positioningBoundaries = [
    {
      statement: "Managed a large team and owned delivery.",
      sourceFactIds: [operatorFact.id],
      positioningState: "DRAFT",
      changesMeaning: true,
      limitation: "This changes the fact and is not allowed.",
    },
  ];

  assertInvalid(validateCareerFactFixture(fact), "POSITIONING_CHANGES_FACT");
});

test("evidence lookup uses explicit fact IDs", () => {
  const evidence = getEvidenceForFact(educationFact.id);

  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].id, officialEvidence.id);
});

test("fact lookup by evidence uses explicit support IDs", () => {
  const facts = getFactsSupportedByEvidence(officialEvidence.id);

  assert.equal(facts.length, 1);
  assert.equal(facts[0].id, educationFact.id);
});

test("generated document cannot be treated as official record", () => {
  const evidence = clone(generatedResumeEvidence);
  evidence.sourceType = "CERTIFICATION_RECORD";

  assertInvalid(validateCareerEvidenceFixture(evidence), "GENERATED_DOCUMENT_TREATED_AS_OFFICIAL_RECORD");
});
