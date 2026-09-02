import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { authorizeSourceForAutomaticRetrieval, safeLeverSiteIdentifier } from "./sourceAuthorityRegistry.mjs";
import { LEVER_POSTINGS_API_HOSTS, leverPostingsEndpoint, normalizeLeverPosting, searchLeverSource } from "./leverDiscovery.mjs";

const adapterSource = readFileSync(new URL("./leverDiscovery.mjs", import.meta.url), "utf8");

function source(overrides = {}) {
  const entry = {
    sourceId: "source-lever-approved",
    provider: "LEVER",
    employerName: "Approved Fixture Employer",
    siteIdentifier: "approved-fixture",
    leverSite: "approved-fixture",
    interfaceType: "LEVER_POSTINGS_API",
    authorityStatus: "AUTHORIZED",
    authorityEvidenceRef: "TEST_ONLY_LEVER_PUBLIC_POSTINGS_FIXTURE",
    commercialMultiUserAllowed: true,
    storageAllowed: true,
    derivedAnalysisAllowed: true,
    displayAllowed: true,
    attributionText: "Source: Lever / Approved Fixture Employer career site",
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

function posting(overrides = {}) {
  return {
    id: "lever-123",
    text: "Program Manager",
    categories: {
      department: "Operations",
      team: "Delivery",
      location: "Remote",
      commitment: "Full-time",
      allLocations: ["Remote", { name: "Boston, MA" }],
    },
    content: {
      descriptionPlain: "Lead cross-functional program delivery for automation initiatives.",
      lists: [
        { text: "Responsibilities", content: "<ul><li>Coordinate stakeholders across launch work.</li></ul>" },
        { text: "Qualifications", content: "<p>Experience managing delivery risks and implementation plans.</p>" },
      ],
    },
    hostedUrl: "https://jobs.lever.co/approved-fixture/lever-123",
    applyUrl: "https://jobs.lever.co/approved-fixture/lever-123/apply",
    workplaceType: "remote",
    salaryRange: { min: 120000, max: 180000, currency: "USD", interval: "yearly-salary" },
    ...overrides,
  };
}

function jsonResponse(body, overrides = {}) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
    ...overrides,
  };
}

test("Lever endpoint uses only the documented fixed public postings API hosts", () => {
  assert.deepEqual(LEVER_POSTINGS_API_HOSTS, { US: "api.lever.co", EU: "api.eu.lever.co" });
  assert.equal(leverPostingsEndpoint("approved-fixture"), "https://api.lever.co/v0/postings/approved-fixture?mode=json");
  assert.equal(leverPostingsEndpoint("approved-fixture", { region: "EU" }), "https://api.eu.lever.co/v0/postings/approved-fixture");
  assert.throws(() => leverPostingsEndpoint("https://jobs.lever.co/approved-fixture"), { code: "LEVER_SITE_IDENTIFIER_INVALID" });
  assert.throws(() => leverPostingsEndpoint("jobs.lever.co/approved-fixture"), { code: "LEVER_SITE_IDENTIFIER_INVALID" });
  assert.throws(() => leverPostingsEndpoint("../approved-fixture"), { code: "LEVER_SITE_IDENTIFIER_INVALID" });
  assert.throws(() => leverPostingsEndpoint("approved-fixture?mode=json"), { code: "LEVER_SITE_IDENTIFIER_INVALID" });
});

test("Lever site validation rejects URL, hostname, traversal, whitespace, and query-shaped identifiers", () => {
  assert.equal(safeLeverSiteIdentifier("approved-fixture"), "approved-fixture");
  for (const value of ["https://example.com/jobs", "example.com", "example/jobs", "../example", "example jobs", "example?mode=json", "example#fragment"]) {
    assert.equal(safeLeverSiteIdentifier(value), null, value);
  }
});

test("Lever posting normalizes into the CareerOS canonical discovery shape", () => {
  const result = normalizeLeverPosting(posting(), { source: source(), retrievedAt: "2026-09-01T12:00:00Z" });
  assert.equal(result.provider, "LEVER");
  assert.equal(result.sourceProvider, "LEVER");
  assert.equal(result.sourceName, "Lever / Approved Fixture Employer");
  assert.equal(result.providerJobId, "lever-123");
  assert.equal(result.externalOpportunityId, "lever-123");
  assert.equal(result.company, "Approved Fixture Employer");
  assert.equal(result.location, "Remote; Boston, MA");
  assert.equal(result.workMode, "remote");
  assert.equal(result.employmentType, "Full-time");
  assert.equal(result.salaryMin, 120000);
  assert.equal(result.salaryMax, 180000);
  assert.equal(result.postedAt, null);
  assert.equal(result.sourceUrl, "https://jobs.lever.co/approved-fixture/lever-123");
  assert.equal(result.applyUrl, "https://jobs.lever.co/approved-fixture/lever-123/apply");
  assert.match(result.description, /Lead cross-functional program delivery/);
  assert.match(result.description, /Coordinate stakeholders/);
  assert.doesNotMatch(result.description, /<li>/);
  assert.equal(result.authoritySourceId, "source-lever-approved");
  assert.equal(result.sourceAuthority.sourceId, "source-lever-approved");
  assert.equal(result.sourceAuthority.siteIdentifier, "approved-fixture");
  assert.equal(result.providerMetadata.lever.siteIdentifier, "approved-fixture");
  assert.equal(result.providerMetadata.lever.hostedUrl, "https://jobs.lever.co/approved-fixture/lever-123");
  assert.equal(result.providerMetadata.lever.applyUrl, "https://jobs.lever.co/approved-fixture/lever-123/apply");
});

test("authorized Lever source invokes one bounded GET request and sends no private data", async () => {
  let request = null;
  const result = await searchLeverSource({
    source: source(),
    criteria: {
      keywords: "program manager",
      resultLimit: 10,
      privateEvidence: "PRIVATE_EVIDENCE_SHOULD_NOT_EGRESS",
      resume: "RESUME_SHOULD_NOT_EGRESS",
      userProfile: "PROFILE_SHOULD_NOT_EGRESS",
      fitResult: "FIT_SHOULD_NOT_EGRESS",
    },
    now: new Date("2026-09-01T12:00:00Z"),
    fetchImpl: async (url, init) => {
      request = {
        url: String(url),
        method: init.method,
        headers: init.headers,
        redirect: init.redirect,
        credentials: init.credentials,
        body: init.body,
      };
      return jsonResponse([posting()]);
    },
  });
  assert.equal(request.url, "https://api.lever.co/v0/postings/approved-fixture?mode=json");
  assert.equal(request.method, "GET");
  assert.equal(request.headers.Accept, "application/json");
  assert.equal(Object.hasOwn(request.headers, "Authorization"), false);
  assert.equal(request.redirect, "manual");
  assert.equal(request.credentials, "omit");
  assert.equal(request.body, undefined);
  assert.doesNotMatch(JSON.stringify(request), /PRIVATE_EVIDENCE_SHOULD_NOT_EGRESS|RESUME_SHOULD_NOT_EGRESS|PROFILE_SHOULD_NOT_EGRESS|FIT_SHOULD_NOT_EGRESS/i);
  assert.equal(result.results.length, 1);
});

test("Lever adapter has no application write method, authenticated API usage, or credential path", () => {
  assert.doesNotMatch(adapterSource, /method:\s*["']POST["']|method:\s*["']PUT["']|method:\s*["']PATCH["']|method:\s*["']DELETE["']/);
  assert.doesNotMatch(adapterSource, /Authorization|Bearer|OAuth|apiKey|api_key|clientSecret|client_secret/i);
  assert.match(adapterSource, /credentials:\s*"omit"/);
});

test("zero-result authorized Lever source stays zero", async () => {
  const result = await searchLeverSource({
    source: source(),
    fetchImpl: async () => jsonResponse([]),
    now: new Date("2026-09-01T12:00:00Z"),
  });
  assert.deepEqual(result.results, []);
});

test("provider failure does not fabricate Lever jobs", async () => {
  await assert.rejects(() => searchLeverSource({
    source: source(),
    fetchImpl: async () => ({ ok: false, status: 500, headers: { get: () => null }, text: async () => "unavailable" }),
  }), { code: "LEVER_PROVIDER_FAILURE" });
});

test("rate limiting, malformed payloads, and oversized responses fail as bounded provider errors", async () => {
  await assert.rejects(() => searchLeverSource({
    source: source(),
    fetchImpl: async () => ({ ok: false, status: 429, headers: { get: () => null }, text: async () => "rate limited" }),
  }), { code: "LEVER_RATE_LIMITED" });

  await assert.rejects(() => searchLeverSource({
    source: source(),
    fetchImpl: async () => jsonResponse({ postings: [] }),
  }), { code: "LEVER_MALFORMED_RESPONSE" });

  await assert.rejects(() => searchLeverSource({
    source: source(),
    fetchImpl: async () => jsonResponse([], { headers: { get: (name) => name === "content-length" ? "2000001" : null } }),
  }), { code: "LEVER_RESPONSE_TOO_LARGE" });
});

test("Lever adapter blocks redirects instead of following them to another host", async () => {
  let request = null;
  await assert.rejects(() => searchLeverSource({
    source: source(),
    fetchImpl: async (url, init) => {
      request = { url: String(url), redirect: init.redirect };
      return { ok: false, status: 302, headers: { get: () => "https://example.com/jobs" }, text: async () => "" };
    },
  }), { code: "LEVER_REDIRECT_NOT_ALLOWED" });
  assert.equal(request.url, "https://api.lever.co/v0/postings/approved-fixture?mode=json");
  assert.equal(request.redirect, "manual");
});

test("Lever adapter refuses a source that did not pass authority gating", async () => {
  await assert.rejects(() => searchLeverSource({
    source: { ...source(), retrievalAuthorized: false },
    fetchImpl: async () => jsonResponse([posting()]),
  }), { code: "LEVER_SOURCE_NOT_AUTHORIZED" });
});

test("Lever adapter refuses a source from another provider", async () => {
  await assert.rejects(() => searchLeverSource({
    source: { ...source(), provider: "GREENHOUSE" },
    fetchImpl: async () => jsonResponse([posting()]),
  }), { code: "LEVER_SOURCE_PROVIDER_MISMATCH" });
});
