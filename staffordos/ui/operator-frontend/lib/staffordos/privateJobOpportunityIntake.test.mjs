import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const intakePath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/privateJobOpportunityIntake.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const source = readFileSync(intakePath, "utf8");

function compileModule(moduleSource, filename) {
  const compiled = ts.transpileModule(moduleSource, {
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

const intake = compileModule(source, intakePath);

const {
  PRIVATE_JOB_OPPORTUNITY_INTAKE_SCHEMA_VERSION,
  PRIVATE_JOB_SEARCH_WORKSPACE_ID,
  buildPrivateJobOpportunityIntakeTemplate,
  classifyPrivateJobOpportunityDuplicate,
  normalizePrivateJobOpportunityIntake,
  readPrivateJobOpportunityIntakeFile,
  runPrivateJobOpportunityIntakeBridge,
  validatePrivateJobOpportunityIntake,
  validatePrivateJobSearchStoragePath,
  writePrivateNormalizedJobOpportunity,
} = intake;

function validRecord(overrides = {}) {
  return {
    schemaVersion: PRIVATE_JOB_OPPORTUNITY_INTAKE_SCHEMA_VERSION,
    workspaceId: PRIVATE_JOB_SEARCH_WORKSPACE_ID,
    sourceUrl: "https://jobs.example.invalid/synthetic/opportunity-001",
    sourceProvider: "Synthetic employer source",
    sourceProviderRecordId: "synthetic-provider-001",
    sourceObservedAt: "2026-08-03T10:00:00-04:00",
    sourceSummary: "Synthetic source summary for a role review candidate.",
    listingText: "Synthetic listing text used only by tests.",
    roleTitle: "Synthetic Operations Role",
    companyName: "Example Works Cooperative",
    location: null,
    workArrangement: null,
    compensationText: null,
    employmentType: null,
    listingPublishedAt: null,
    listingExpiresAt: null,
    operatorNotes: null,
    privacy: "Professional owner-private",
    sourceAuthority: "Source explicit",
    limitations: ["Synthetic fixture only."],
    ...overrides,
  };
}

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

test("explicit private intake path is required", () => {
  const result = runPrivateJobOpportunityIntakeBridge({
    intakeDirectory: "",
    outputDirectory: null,
    repositoryRoot: root,
    generatedAt: "2026-08-03T10:00:00-04:00",
  });

  assert.equal(result.status, "failed");
  assert.equal(result.failureCode, "EXPLICIT_PRIVATE_INTAKE_PATH_REQUIRED");
});

test("intake path must remain outside Git", () => {
  const result = validatePrivateJobSearchStoragePath(path.join(root, "staffordos/job-search"), root, "intake");

  assertInvalid(result, "PRIVATE_INTAKE_PATH_INSIDE_REPOSITORY");
});

test("output path must remain outside Git", () => {
  const result = validatePrivateJobSearchStoragePath(path.join(root, "staffordos/job-search"), root, "output");

  assertInvalid(result, "PRIVATE_OUTPUT_PATH_INSIDE_REPOSITORY");
});

test("workspace must equal professional", () => {
  assert.equal(validRecord().workspaceId, "professional");

  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ workspaceId: "stafford-media" })), "WORKSPACE_NOT_PROFESSIONAL");
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ workspaceId: "personal" })), "WORKSPACE_NOT_PROFESSIONAL");
});

test("missing role is rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ roleTitle: "" })), "ROLE_TITLE_REQUIRED");
});

test("missing company is rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ companyName: "" })), "COMPANY_NAME_REQUIRED");
});

test("missing source URL is rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ sourceUrl: "" })), "SOURCE_URL_REQUIRED");
});

test("malformed source URL is rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ sourceUrl: "not a source url" })), "SOURCE_URL_MALFORMED");
});

test("non-HTTPS source handling is explicit and safe", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ sourceUrl: "http://jobs.example.invalid/synthetic" })), "SOURCE_URL_SCHEME_UNSUPPORTED");
});

test("missing provenance is rejected", () => {
  const result = validatePrivateJobOpportunityIntake(validRecord({ sourceProvider: "", sourceObservedAt: "", sourceAuthority: "" }));

  assertInvalid(result, "SOURCE_PROVIDER_REQUIRED");
  assertInvalid(result, "SOURCE_OBSERVED_AT_REQUIRED");
  assertInvalid(result, "SOURCE_AUTHORITY_REQUIRED");
  assertInvalid(result, "SOURCE_PROVENANCE_REQUIRED");
});

test("source text with no source authority is rejected", () => {
  const result = validatePrivateJobOpportunityIntake(validRecord({ sourceAuthority: "" }));

  assertInvalid(result, "SOURCE_AUTHORITY_REQUIRED");
});

test("unknown listing date remains unknown", () => {
  const result = normalizePrivateJobOpportunityIntake(validRecord(), {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  });

  assert.equal(result.valid, true);
  assert.equal(result.normalizedOpportunity.listingFreshness, "UNKNOWN");
  assert.equal(result.normalizedOpportunity.s010ListingFreshness, "Unknown");
});

test("import time does not become publication time", () => {
  const result = normalizePrivateJobOpportunityIntake(validRecord(), {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  });

  assert.equal(result.normalizedOpportunity.sourceRecord.listingPublishedAt, null);
  assert.notEqual(result.normalizedOpportunity.intakeTimestamp, result.normalizedOpportunity.sourceRecord.listingPublishedAt);
});

test("unknown open status is not called open", () => {
  const result = normalizePrivateJobOpportunityIntake(validRecord(), {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  });

  assert.equal(result.normalizedOpportunity.opportunityStatus, "NEEDS_VERIFICATION");
  assert.doesNotMatch(JSON.stringify(result.normalizedOpportunity), /"Open"/);
});

test("compensation is not invented", () => {
  const result = normalizePrivateJobOpportunityIntake(validRecord(), {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  });

  assert.equal(result.normalizedOpportunity.compensationText, null);
});

test("work arrangement is not invented", () => {
  const result = normalizePrivateJobOpportunityIntake(validRecord(), {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  });

  assert.equal(result.normalizedOpportunity.workArrangement, null);
});

test("location is not invented", () => {
  const result = normalizePrivateJobOpportunityIntake(validRecord(), {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  });

  assert.equal(result.normalizedOpportunity.locationText, null);
});

test("application fields are rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ applicationStatus: "submitted" })), "APPLICATION_FIELD_NOT_ALLOWED");
});

test("interview fields are rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ interviewStatus: "scheduled" })), "INTERVIEW_FIELD_NOT_ALLOWED");
});

test("offer fields are rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ offerStatus: "received" })), "OFFER_FIELD_NOT_ALLOWED");
});

test("fit score fields are rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ fitScore: 91 })), "FIT_FIELD_NOT_ALLOWED");
});

test("model recommendation fields are rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ aiRecommendation: "strong" })), "MODEL_CERTAINTY_FIELD_NOT_ALLOWED");
});

test("unsupported compensation normalization is rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ compensationMinimum: 100000 })), "UNSUPPORTED_COMPENSATION_NORMALIZATION");
});

test("unsupported open status is rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ listingStatus: "OPEN" })), "UNSUPPORTED_OPEN_STATUS");
});

test("unsupported status is rejected", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ opportunityStatus: "SUBMITTED" })), "UNSUPPORTED_STATUS");
});

test("inputs are not mutated", () => {
  const record = validRecord();
  const before = clone(record);

  normalizePrivateJobOpportunityIntake(record, {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  });

  assert.deepEqual(record, before);
});

test("durable IDs are not raw URLs", () => {
  const record = validRecord();
  const result = normalizePrivateJobOpportunityIntake(record, {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  });

  assert.match(result.normalizedOpportunity.id, /^privjobopp_[a-f0-9]{18}$/);
  assert.notEqual(result.normalizedOpportunity.id, record.sourceUrl);
  assert.notEqual(result.normalizedOpportunity.id, record.sourceProviderRecordId);
});

test("source record is not accepted as primary authority", () => {
  assertInvalid(validatePrivateJobOpportunityIntake(validRecord({ id: "https://jobs.example.invalid/synthetic/opportunity-001" })), "PRIMARY_ID_NOT_ACCEPTED");
});

test("duplicate candidates are not silently merged", () => {
  const first = normalizePrivateJobOpportunityIntake(validRecord(), {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  }).normalizedOpportunity;
  const second = normalizePrivateJobOpportunityIntake(validRecord({ sourceUrl: "https://jobs.example.invalid/synthetic/opportunity-002" }), {
    intakeTimestamp: "2026-08-03T10:06:00-04:00",
    existingOpportunities: [first],
  }).normalizedOpportunity;

  assert.equal(classifyPrivateJobOpportunityDuplicate(second, [first]), "SAME_PROVIDER_ALIAS");
  assert.equal(second.s010DuplicateStatus, "POSSIBLE_DUPLICATE");
  assert.notEqual(first.id, second.id);
});

test("source text remains private in normalized output", () => {
  const result = normalizePrivateJobOpportunityIntake(validRecord(), {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  });
  const serialized = JSON.stringify(result.normalizedOpportunity);

  assert.doesNotMatch(serialized, /Synthetic listing text used only by tests/);
  assert.equal(result.normalizedOpportunity.sourceRecord.sourceTextRetainedInIntake, true);
});

test("template has no real job values", () => {
  const template = buildPrivateJobOpportunityIntakeTemplate();

  assert.equal(template.sourceUrl, "");
  assert.equal(template.roleTitle, "");
  assert.equal(template.companyName, "");
  assert.equal(template.privacy, "Professional owner-private");
});

test("private output writes outside Git", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "j00102-job-output-"));
  const opportunity = normalizePrivateJobOpportunityIntake(validRecord(), {
    intakeTimestamp: "2026-08-03T10:05:00-04:00",
  }).normalizedOpportunity;
  const result = writePrivateNormalizedJobOpportunity(opportunity, directory, root);

  assert.equal(result.ok, true);
  assert.ok(result.outputPath.startsWith(directory));
  assert.ok(existsSync(result.outputPath));
  assert.equal((statSync(result.outputPath).mode & 0o777).toString(8), "600");
});

test("run bridge reads explicit JSON and preserves source files", () => {
  const intakeDirectory = mkdtempSync(path.join(os.tmpdir(), "j00102-job-intake-"));
  const outputDirectory = mkdtempSync(path.join(os.tmpdir(), "j00102-job-normalized-"));
  const intakeFile = path.join(intakeDirectory, "synthetic-opportunity.private.json");
  writeFileSync(intakeFile, `${JSON.stringify(validRecord(), null, 2)}\n`, { mode: 0o600 });
  const before = statSync(intakeFile);

  const result = runPrivateJobOpportunityIntakeBridge({
    intakeDirectory,
    outputDirectory,
    repositoryRoot: root,
    generatedAt: "2026-08-03T10:05:00-04:00",
    writePrivateArtifacts: true,
  });
  const after = statSync(intakeFile);

  assert.equal(result.status, "completed");
  assert.equal(result.summary.intakeFileCount, 1);
  assert.equal(result.summary.validOpportunityCount, 1);
  assert.equal(result.summary.writtenPrivateArtifactCount, 1);
  assert.equal(result.sourceFilesModified, false);
  assert.equal(before.size, after.size);
  assert.equal(before.mtimeMs, after.mtimeMs);
});

test("non-JSON private files are rejected safely", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "j00102-job-intake-"));
  const textFile = path.join(directory, "synthetic-opportunity.txt");
  writeFileSync(textFile, "synthetic", { mode: 0o600 });
  const result = readPrivateJobOpportunityIntakeFile(textFile, root);

  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "PRIVATE_INTAKE_JSON_REQUIRED");
});

test("no network, model, database, or submission path exists", () => {
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|http\.request|https\.request|puppeteer|playwright/i);
  assert.doesNotMatch(source, /ollama|openai|anthropic|gemini|modelAdapter/i);
  assert.doesNotMatch(source, /prisma|database|dbClient|sql`|from ".*db/i);
  assert.doesNotMatch(source, /submitApplication|sendMessage|sendRecruiter|mailto:/);
});
