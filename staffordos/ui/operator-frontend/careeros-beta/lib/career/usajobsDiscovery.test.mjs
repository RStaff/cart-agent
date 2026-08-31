import test from "node:test";
import assert from "node:assert/strict";
import { boundUsajobsSearch, searchUsajobs } from "./usajobsDiscovery.mjs";
import { parseJobDescription } from "./jobProduct.mjs";

function response(status, body) { return { status, ok: status >= 200 && status < 300, json: async () => body }; }
function fixture() { return { SearchResult: { SearchResultItems: [{ MatchedObjectId: "123", MatchedObjectDescriptor: { PositionID: "ABC", PositionTitle: "Program Manager", OrganizationName: "Example Agency", PositionURI: "https://www.usajobs.gov/View/123", PositionLocationDisplay: "Washington, DC", PublicationStartDate: "2026-08-19T00:00:00Z", ApplicationCloseDate: "2026-08-30T00:00:00Z", PositionRemuneration: [{ MinimumRange: "100000", MaximumRange: "120000" }], PositionSchedule: [{ Name: "Full Time" }], QualificationSummary: "Experience leading complex programs.", UserArea: { Details: { JobSummary: "Manage programs.", MajorDuties: "Lead cross-functional delivery and coordinate stakeholders.", KeyRequirements: ["Program management", "Security clearance required"], Requirements: "Applicants must demonstrate program delivery experience.", Evaluations: "Applicants are evaluated on technical and leadership experience.", Education: "A bachelor's degree is preferred.", OtherInformation: "Occasional travel may be required." } } } }] } }; }

test("search bounds result count and supported filters", () => {
  assert.deepEqual(boundUsajobsSearch({ keywords: "program", resultLimit: 100, postedWithinDays: 100, remotePreference: "remote" }), { keywords: "program", location: "", remotePreference: "remote", postedWithinDays: 60, salaryMin: null, resultLimit: 25 });
});

test("blank optional filters are omitted while explicit zero remains valid", () => {
  assert.equal(boundUsajobsSearch({ postedWithinDays: null, salaryMin: null }).postedWithinDays, null);
  assert.equal(boundUsajobsSearch({ postedWithinDays: "", salaryMin: "" }).salaryMin, null);
  assert.equal(boundUsajobsSearch({ postedWithinDays: 0, salaryMin: 0 }).postedWithinDays, 0);
  assert.equal(boundUsajobsSearch({ postedWithinDays: 30, salaryMin: 120000 }).postedWithinDays, 30);
  assert.equal(boundUsajobsSearch({ postedWithinDays: 30, salaryMin: 120000 }).salaryMin, 120000);
});

test("blank optional filters do not become USAJOBS query parameters", async () => {
  let requestUrl = "";
  await searchUsajobs({ keywords: "AI Product Manager", postedWithinDays: null, salaryMin: null, resultLimit: 10, env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" }, fetchImpl: async (url) => { requestUrl = String(url); return response(200, { SearchResult: { SearchResultItems: [] } }); } });
  assert.match(requestUrl, /Keyword=AI\+Product\+Manager/);
  assert.doesNotMatch(requestUrl, /DatePosted=/);
  assert.doesNotMatch(requestUrl, /RemunerationMinimumAmount=/);
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

test("structural headings and role-overview context do not become requirements", async () => {
  const parsed = parseJobDescription({ title: "Program Manager", description: [
    "Role Overview:\nThis role is focused on helping employees understand and apply approved AI assistants in their day-to-day work.",
    "Key Responsibilities:",
    "AI Assistants Management & Governance Support:",
    "Coordinate stakeholders across technical and business teams.",
    "Qualifications:",
    "Experience leading cross-functional programs."
  ].join("\n") });
  assert.deepEqual(parsed.requirements.map((item) => item.text), [
    "Coordinate stakeholders across technical and business teams.",
    "Experience leading cross-functional programs."
  ]);
});

test("USAJOBS duties heading exits role-summary context and preserves prose requirements", () => {
  const parsed = parseJobDescription({ title: "Program Manager", description: [
    "Job Summary:",
    "This role coordinates complex public programs and supports agency priorities.",
    "Duties:",
    "Lead cross-functional delivery and coordinate stakeholders across the program.",
    "Manage implementation planning and report progress to leadership."
  ].join("\n") });
  assert.deepEqual(parsed.requirements.map((item) => item.text), [
    "Lead cross-functional delivery and coordinate stakeholders across the program.",
    "Manage implementation planning and report progress to leadership."
  ]);
});

test("genuine responsibility, qualification, and experience language remains parseable", async () => {
  const parsed = parseJobDescription({ title: "Program Manager", description: [
    "Responsibilities:",
    "Lead delivery planning and coordinate implementation partners.",
    "Qualifications:",
    "Bachelor's degree and experience managing complex programs.",
    "Required experience:",
    "Must demonstrate stakeholder management in a technology environment."
  ].join("\n") });
  assert.ok(parsed.requirements.some((item) => /Lead delivery planning/.test(item.text)));
  assert.ok(parsed.requirements.some((item) => /Bachelor's degree/.test(item.text)));
  assert.ok(parsed.requirements.some((item) => /Must demonstrate stakeholder/.test(item.text)));
  assert.equal(parsed.requirements.some((item) => /^(Responsibilities|Qualifications|Required experience):?$/.test(item.text)), false);
});

test("visual wraps and bullet continuations remain atomic requirements", () => {
  const parsed = parseJobDescription({ title: "AI Enablement Program Manager", description: [
    "Responsibilities:",
    "- Experience supporting enterprise technology",
    "  tools or business applications, including safe enablement practices.",
    "- Coordinate stakeholder",
    "  discussions across frontier AI assistants.",
    "Qualifications:",
    "Experience leading cross-functional programs."
  ].join("\n") });
  assert.equal(parsed.requirements.length, 3);
  assert.match(parsed.requirements[0].text, /enterprise technology tools or business applications/);
  assert.match(parsed.requirements[1].text, /Coordinate stakeholder discussions across frontier AI assistants/);
  assert.equal(parsed.requirements.some((item) => /^(tools|coordination|patterns|across frontier)/i.test(item.text)), false);
});

test("unbulleted wrapped prose joins lowercase continuation lines without hiding genuine lines", () => {
  const parsed = parseJobDescription({ title: "Operations Manager", description: [
    "Responsibilities:",
    "Improve workflows across technology tools",
    "or business applications.",
    "Coordinate stakeholder discussions.",
    "Qualifications:",
    "Experience managing operational programs."
  ].join("\n") });
  assert.deepEqual(parsed.requirements.map((item) => item.text), [
    "Improve workflows across technology tools or business applications.",
    "Coordinate stakeholder discussions.",
    "Experience managing operational programs."
  ]);
});

for (const [status, code] of [[401, "USAJOBS_AUTH_FAILED"], [403, "USAJOBS_AUTH_FAILED"], [429, "USAJOBS_RATE_LIMITED"], [500, "USAJOBS_UNAVAILABLE"]]) test("provider " + status + " is sanitized", async () => { await assert.rejects(() => searchUsajobs({ env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" }, fetchImpl: async () => response(status, { secret: "not returned" }) }), { code }); });

test("malformed and timeout responses fail closed", async () => {
  await assert.rejects(() => searchUsajobs({ env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" }, fetchImpl: async () => response(200, {}) }), { code: "USAJOBS_MALFORMED_RESPONSE" });
  await assert.rejects(() => searchUsajobs({ env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" }, fetchImpl: async () => { const error = new Error("timeout"); error.name = "AbortError"; throw error; } }), { code: "USAJOBS_TIMEOUT" });
});
