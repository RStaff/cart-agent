import test from "node:test";
import assert from "node:assert/strict";
import { buildPersonalizedSearchIntent, buildProviderCriteriaForIntent } from "./discoverySearchIntent.mjs";
import { searchUsajobs } from "./usajobsDiscovery.mjs";

function directCapability(key) {
  return { capabilityKey: key, key, label: key.replaceAll("_", " "), authorityState: "VERIFIED_DIRECT", provenance: { factIds: ["fact-1"] } };
}

test("static presets are no longer the sole search-intent source", () => {
  const intent = buildPersonalizedSearchIntent({
    preferences: { keywords: "", location: "", remotePreference: "any", resultLimit: 10 },
    facts: [{ id: "fact-1", statement: "Led cross-functional program delivery from planning through launch.", factType: "PROJECT", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }],
    capabilities: [directCapability("PROGRAM_DELIVERY")]
  });
  assert.ok(intent.themes.some((theme) => theme.source === "DIRECT_EVIDENCE" && theme.roleFamily === "PROGRAM_MANAGEMENT"));
  assert.notEqual(buildProviderCriteriaForIntent(intent).keywords, "");
});

test("unconfirmed CareerFacts cannot drive search intent", () => {
  const intent = buildPersonalizedSearchIntent({
    preferences: { keywords: "" },
    facts: [{ id: "fact-unconfirmed", statement: "Led enterprise AI transformation programs.", factType: "PROJECT", authorityState: "SYSTEM_PROPOSED" }],
    capabilities: []
  });
  assert.equal(intent.themes.some((theme) => theme.source === "DIRECT_EVIDENCE"), false);
  assert.equal(buildProviderCriteriaForIntent(intent).keywords, "");
});

test("rejected context cannot drive search intent", () => {
  const intent = buildPersonalizedSearchIntent({
    preferences: { keywords: "" },
    facts: [],
    capabilities: [],
    contextClaims: [{ dimension: "DOMAIN", displayValue: "marketing technology", authorityState: "CUSTOMER_REJECTED", status: "REJECTED" }]
  });
  assert.equal(intent.themes.some((theme) => theme.roleFamily === "MARKETING_TECHNOLOGY"), false);
});

test("tool and method mentions do not become unsupported job titles", () => {
  const intent = buildPersonalizedSearchIntent({
    preferences: { keywords: "" },
    facts: [{ id: "fact-1", statement: "Used Jira and Agile methods while coordinating developers as stakeholders.", factType: "TECHNOLOGY", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }],
    capabilities: [directCapability("TECHNOLOGY_IMPLEMENTATION")]
  });
  const text = intent.themes.map((theme) => theme.query).join(" ");
  assert.doesNotMatch(text, /jira administrator/i);
  assert.doesNotMatch(text, /scrum master/i);
  assert.doesNotMatch(text, /engineering manager/i);
});

test("role-family inference fails closed when evidence is not meaningful", () => {
  const intent = buildPersonalizedSearchIntent({
    preferences: { keywords: "" },
    facts: [{ id: "fact-1", statement: "Worked on something important.", factType: "OTHER", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }],
    capabilities: []
  });
  assert.equal(intent.themes.length, 0);
});

test("explicit targets and standard preferences are preserved", () => {
  const intent = buildPersonalizedSearchIntent({
    preferences: { keywords: "technical program manager", location: "Boston, MA", remotePreference: "remote", salaryMin: 130000, postedWithinDays: 14, resultLimit: 8 },
    facts: [],
    capabilities: []
  });
  assert.ok(intent.themes.some((theme) => theme.source === "EXPLICIT_TARGET" && theme.roleFamily === "TECHNICAL_PROJECT_PROGRAM_MANAGEMENT"));
  assert.equal(intent.criteria.location, "Boston, MA");
  assert.equal(intent.criteria.remotePreference, "remote");
  assert.equal(intent.criteria.salaryMin, 130000);
  assert.equal(intent.criteria.postedWithinDays, 14);
  assert.equal(intent.criteria.resultLimit, 8);
  assert.equal(buildProviderCriteriaForIntent(intent).keywords, "technical program manager");
});

for (const requestedTitle of ["AI Product Manager", "Program Manager"]) test("explicit target title remains authoritative with custom search: " + requestedTitle, () => {
  const intent = buildPersonalizedSearchIntent({ preferences: { requestedTitle, keywords: "", location: "", remotePreference: "any", postedWithinDays: null, salaryMin: null, resultLimit: 10 } });
  const criteria = buildProviderCriteriaForIntent(intent);
  assert.equal(criteria.keywords, requestedTitle);
  assert.equal(criteria.postedWithinDays, null);
  assert.equal(criteria.salaryMin, null);
  assert.equal(intent.roleIntent.requestedTitle, requestedTitle);
  assert.ok(intent.themes.some((theme) => theme.source === "EXPLICIT_TARGET"));
});

test("provider criteria contain generic terms but not private evidence text", () => {
  const intent = buildPersonalizedSearchIntent({
    preferences: { keywords: "" },
    facts: [{ id: "fact-private", statement: "Led Project Skyline for a confidential payment migration.", factType: "PROJECT", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }],
    capabilities: [directCapability("PROGRAM_DELIVERY")]
  });
  const criteriaText = JSON.stringify(buildProviderCriteriaForIntent(intent));
  assert.match(criteriaText, /program manager|project manager/i);
  assert.doesNotMatch(criteriaText, /Project Skyline|confidential payment migration/i);
});

test("external provider request contains no private CareerFact text", async () => {
  const intent = buildPersonalizedSearchIntent({
    preferences: { keywords: "" },
    facts: [{ id: "fact-private", statement: "Led Project Skyline for a confidential payment migration.", factType: "PROJECT", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }],
    capabilities: [directCapability("PROGRAM_DELIVERY")]
  });
  let requestUrl = "";
  await searchUsajobs({
    ...buildProviderCriteriaForIntent(intent),
    env: { USAJOBS_API_KEY: "secret", USAJOBS_USER_AGENT_EMAIL: "registered@example.com" },
    fetchImpl: async (url) => {
      requestUrl = String(url);
      return { ok: true, status: 200, json: async () => ({ SearchResult: { SearchResultItems: [] } }) };
    },
    now: new Date("2026-08-28T12:00:00Z")
  });
  assert.match(requestUrl, /Keyword=/);
  assert.doesNotMatch(requestUrl, /Project%20Skyline|confidential|payment%20migration/i);
});

test("Brother Beta and Ross-style fixtures do not share hard-coded search logic", () => {
  const brother = buildPersonalizedSearchIntent({
    preferences: { keywords: "" },
    facts: [{ id: "brother-fact", statement: "Owned project schedules, stakeholders, and delivery risks for multi-team implementation work.", factType: "PROJECT", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }],
    capabilities: [directCapability("PROGRAM_DELIVERY")]
  });
  const ross = buildPersonalizedSearchIntent({
    preferences: { keywords: "" },
    facts: [{ id: "ross-fact", statement: "Improved marketing technology workflows and CRM marketing operations.", factType: "TECHNOLOGY", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED" }],
    capabilities: [directCapability("MARKETING_DIGITAL")]
  });
  assert.notDeepEqual(brother.themes.map((theme) => theme.roleFamily), ross.themes.map((theme) => theme.roleFamily));
  assert.doesNotMatch(JSON.stringify(brother), /Ross|Stafford|ShopiFixer|Abando/i);
});
