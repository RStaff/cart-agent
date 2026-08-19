import test from "node:test";
import assert from "node:assert/strict";
import { boundUsajobsSearch, searchUsajobs } from "./usajobsDiscovery.mjs";
import { parseJobDescription } from "./jobProduct.mjs";

function response(status, body) { return { status, ok: status >= 200 && status < 300, json: async () => body }; }
function fixture() { return { SearchResult: { SearchResultItems: [{ MatchedObjectId: "123", MatchedObjectDescriptor: { PositionID: "ABC", PositionTitle: "Program Manager", OrganizationName: "Example Agency", PositionURI: "https://www.usajobs.gov/View/123", PositionLocationDisplay: "Washington, DC", PublicationStartDate: "2026-08-19T00:00:00Z", ApplicationCloseDate: "2026-08-30T00:00:00Z", PositionRemuneration: [{ MinimumRange: "100000", MaximumRange: "120000" }], PositionSchedule: [{ Name: "Full Time" }], QualificationSummary: "Experience leading complex programs.", UserArea: { Details: { JobSummary: "Manage programs.", MajorDuties: "Lead cross-functional delivery and coordinate stakeholders.", KeyRequirements: ["Program management", "Security clearance required"], Requirements: "Applicants must demonstrate program delivery experience.", Evaluations: "Applicants are evaluated on technical and leadership experience.", Education: "A bachelor's degree is preferred.", OtherInformation: "Occasional travel may be required." } } } }] } }; }

test("search bounds result count and supported filters", () => {
  assert.deepEqual(boundUsajobsSearch({ keywords: "program", resultLimit: 100, postedWithinDays: 100, remotePreference: "remote" }), { keywords: "program", location: "", remotePreference: "remote", postedWithinDays: 60, salaryMin: null, resultLimit: 25 });
});

test("missing credentials fail closed", async () => { await assert.rejects(() => searchUsajobs({ env: {} }), { code: "USAJOBS_PROVIDER_NOT_CONFIGURED" }); });

test("normalizes USAJOBS results and preserves source provenance", async () => {
  let request;
  const result = await searchUsajobs({ env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" }, keywords: "program", resultLimit: 1, fetchImpl: async (url, options) => { request = { url: String(url), options }; return response(200, fixture()); }, now: new Date("2026-08-19T12:00:00Z") });
  assert.equal(result.provider, "USAJOBS");
  assert.equal(result.results[0].sourceProvider, "USAJOBS");
  assert.equal(result.results[0].externalOpportunityId, "123");
  assert.equal(result.results[0].sourceUrl, "https://www.usajobs.gov/View/123");
  assert.match(result.results[0].description, /Job summary: Manage programs\./);
  assert.match(result.results[0].description, /Major duties and responsibilities: Lead cross-functional delivery/);
  assert.match(result.results[0].description, /Security clearance required/);
  assert.match(request.url, /ResultsPerPage=1/);
  assert.equal(request.options.headers.Host, "data.usajobs.gov");
  assert.ok(request.options.headers["User-Agent"]);
  assert.ok(request.options.headers["Authorization-Key"]);
});

test("rich USAJOBS announcement sections reach the existing requirement parser", async () => {
  const result = await searchUsajobs({ env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" }, fetchImpl: async () => response(200, fixture()) });
  const parsed = parseJobDescription({ title: result.results[0].title, company: result.results[0].company, description: result.results[0].description });
  assert.ok(parsed.requirements.length >= 6);
  assert.ok(parsed.requirements.some((item) => item.text.includes("cross-functional delivery")));
  assert.ok(parsed.requirements.some((item) => item.text.includes("Security clearance")));
  assert.ok(parsed.requirements.some((item) => item.text.includes("technical and leadership")));
  assert.ok(parsed.requirements.some((item) => item.text.includes("Occasional travel")));
});

for (const [status, code] of [[401, "USAJOBS_AUTH_FAILED"], [403, "USAJOBS_AUTH_FAILED"], [429, "USAJOBS_RATE_LIMITED"], [500, "USAJOBS_UNAVAILABLE"]]) test("provider " + status + " is sanitized", async () => { await assert.rejects(() => searchUsajobs({ env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" }, fetchImpl: async () => response(status, { secret: "not returned" }) }), { code }); });

test("malformed and timeout responses fail closed", async () => {
  await assert.rejects(() => searchUsajobs({ env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" }, fetchImpl: async () => response(200, {}) }), { code: "USAJOBS_MALFORMED_RESPONSE" });
  await assert.rejects(() => searchUsajobs({ env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" }, fetchImpl: async () => { const error = new Error("timeout"); error.name = "AbortError"; throw error; } }), { code: "USAJOBS_TIMEOUT" });
});
