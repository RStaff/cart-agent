import test from "node:test";
import assert from "node:assert/strict";
import { authorizeSourceForAutomaticRetrieval } from "./sourceAuthorityRegistry.mjs";
import { greenhouseJobsEndpoint, normalizeGreenhouseJob, searchGreenhouseSource } from "./greenhouseDiscovery.mjs";

function source(overrides = {}) {
  const entry = {
    sourceId: "source-greenhouse-approved",
    provider: "GREENHOUSE",
    employerName: "Approved Fixture Employer",
    boardToken: "approved-fixture",
    interfaceType: "GREENHOUSE_JOB_BOARD_API",
    authorityStatus: "AUTHORIZED",
    authorityEvidenceRef: "TEST_ONLY_WRITTEN_APPROVAL_FIXTURE",
    commercialMultiUserAllowed: true,
    storageAllowed: true,
    derivedAnalysisAllowed: true,
    displayAllowed: true,
    attributionText: "Source: Greenhouse / Approved Fixture Employer career site",
    sourceLinkRequired: true,
    applyRedirectRequired: true,
    rateLimitPolicy: "CONSERVATIVE_UNKNOWN",
    removalPolicy: "SOURCE_REMOVAL_REQUIRES_REVIEW",
    enabled: true,
    productionNetworkAllowed: true,
    lastReviewedAt: "2026-09-01",
    ...overrides,
  };
  return authorizeSourceForAutomaticRetrieval(entry.sourceId, { registry: [entry] }).source;
}

function job(overrides = {}) {
  return {
    id: 123,
    internal_job_id: 456,
    title: "Program Manager",
    company_name: "Approved Fixture Employer",
    location: { name: "Remote" },
    first_published: "2026-08-25T00:00:00Z",
    updated_at: "2026-08-26T00:00:00Z",
    requisition_id: "REQ-123",
    absolute_url: "https://boards.greenhouse.io/approved-fixture/jobs/123",
    content: "<p><strong>Responsibilities</strong></p><ul><li>Lead cross-functional program delivery.</li><li>Coordinate stakeholders across launch work.</li></ul>",
    departments: [{ name: "Operations" }],
    offices: [{ name: "Remote" }],
    metadata: [{ name: "Employment Type", value: "Full Time" }],
    ...overrides,
  };
}

test("Greenhouse endpoint uses the fixed documented board API host", () => {
  assert.equal(greenhouseJobsEndpoint("approved-fixture"), "https://boards-api.greenhouse.io/v1/boards/approved-fixture/jobs?content=true");
  assert.throws(() => greenhouseJobsEndpoint("https://example.com/jobs"), { code: "GREENHOUSE_BOARD_IDENTIFIER_INVALID" });
});

test("Greenhouse job normalizes into the CareerOS canonical discovery shape", () => {
  const result = normalizeGreenhouseJob(job(), { source: source(), retrievedAt: "2026-09-01T12:00:00Z" });
  assert.equal(result.provider, "GREENHOUSE");
  assert.equal(result.sourceProvider, "GREENHOUSE");
  assert.equal(result.sourceName, "Greenhouse / Approved Fixture Employer");
  assert.equal(result.providerJobId, "123");
  assert.equal(result.externalOpportunityId, "123");
  assert.equal(result.company, "Approved Fixture Employer");
  assert.equal(result.location, "Remote");
  assert.equal(result.employmentType, "Full Time");
  assert.equal(result.sourceUrl, "https://boards.greenhouse.io/approved-fixture/jobs/123");
  assert.equal(result.applyUrl, "https://boards.greenhouse.io/approved-fixture/jobs/123");
  assert.match(result.description, /Lead cross-functional program delivery/);
  assert.doesNotMatch(result.description, /<li>/);
  assert.equal(result.authoritySourceId, "source-greenhouse-approved");
  assert.equal(result.providerMetadata.sourceAuthority.sourceId, "source-greenhouse-approved");
});

test("authorized Greenhouse source invokes one bounded network call and sends no private evidence", async () => {
  let request = null;
  const result = await searchGreenhouseSource({
    source: source(),
    criteria: { keywords: "program manager", resultLimit: 10, privateEvidence: "do not send" },
    now: new Date("2026-09-01T12:00:00Z"),
    fetchImpl: async (url, init) => {
      request = { url: String(url), init };
      return { ok: true, status: 200, text: async () => JSON.stringify({ jobs: [job()] }) };
    },
  });
  assert.equal(request.url, "https://boards-api.greenhouse.io/v1/boards/approved-fixture/jobs?content=true");
  assert.equal(request.init.method, "GET");
  assert.equal(request.init.headers.Accept, "application/json");
  assert.doesNotMatch(request.url, /program|privateEvidence|do%20not%20send/i);
  assert.equal(result.results.length, 1);
});

test("zero-result authorized Greenhouse source stays zero", async () => {
  const result = await searchGreenhouseSource({
    source: source(),
    fetchImpl: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ jobs: [] }) }),
    now: new Date("2026-09-01T12:00:00Z"),
  });
  assert.deepEqual(result.results, []);
});

test("provider failure does not fabricate Greenhouse jobs", async () => {
  await assert.rejects(() => searchGreenhouseSource({
    source: source(),
    fetchImpl: async () => ({ ok: false, status: 500, text: async () => "unavailable" }),
  }), { code: "GREENHOUSE_UNAVAILABLE" });
});

test("malformed Greenhouse payload fails safely", async () => {
  await assert.rejects(() => searchGreenhouseSource({
    source: source(),
    fetchImpl: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ notJobs: [] }) }),
  }), { code: "GREENHOUSE_MALFORMED_RESPONSE" });
});

test("Greenhouse adapter refuses a source that did not pass authority gating", async () => {
  await assert.rejects(() => searchGreenhouseSource({
    source: { ...source(), retrievalAuthorized: false },
    fetchImpl: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ jobs: [job()] }) }),
  }), { code: "GREENHOUSE_SOURCE_NOT_AUTHORIZED" });
});
