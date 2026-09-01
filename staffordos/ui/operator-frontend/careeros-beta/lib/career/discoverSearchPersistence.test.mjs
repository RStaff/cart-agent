import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url).pathname;
const read = (relative) => fs.readFileSync(`${root}${relative}`, "utf8");

test("Search now is disabled while automatic discovery authority is unavailable", () => {
  const client = read("app/career/discover/DiscoverClient.tsx");
  const search = client.slice(client.indexOf("async function search"), client.indexOf("async function savePreferences"));
  assert.match(search, /searchPayload\(form\)/);
  assert.match(client, /const automaticDiscoveryAvailable = false/);
  assert.match(client, /Automatic discovery is unavailable pending provider authorization/);
  assert.match(client, /Search unavailable/);
  assert.ok(search.indexOf("!automaticDiscoveryAvailable") < search.indexOf('method: "PUT"'));
  assert.ok(search.indexOf("!automaticDiscoveryAvailable") < search.indexOf('method: "POST"'));
  assert.match(search, /setResults\(\[\]\)/);
});

test("Search now preserves the complete existing preference payload", () => {
  const client = read("app/career/discover/DiscoverClient.tsx");
  const payload = client.slice(client.indexOf("function searchPayload"), client.indexOf("const PRESETS"));
  for (const field of ["requestedTitle", "keywords", "location", "remotePreference", "postedWithinDays", "salaryMin", "resultLimit"]) {
    assert.match(payload, new RegExp(field));
  }
  assert.match(client, /Search preferences saved for future authorized discovery/);
  assert.match(client, /const searchGeneration = useRef\(0\)/);
  assert.match(client, /generation !== searchGeneration\.current/);
});

test("Search preference persistence remains the canonical server authority", () => {
  const route = read("app/api/career/discover/route.ts");
  const put = route.slice(route.indexOf("export async function PUT"), route.indexOf("export async function POST"));
  assert.match(put, /saveSearchPreferences/);
  assert.doesNotMatch(put, /searchUsajobs/);
});

test("a clearly new analyzable discovery result is analyzed through the existing inbox authority", () => {
  const client = read("app/career/discover/DiscoverClient.tsx");
  const save = client.slice(client.indexOf("async function save(result"), client.indexOf("return <>", client.indexOf("async function save(result")));
  assert.match(save, /body\.duplicate !== "NEW"/);
  assert.match(save, /body\.item\?\.status !== "READY_TO_ANALYZE"/);
  assert.match(save, /opportunity-inbox\/\$\{body\.item\.id\}/);
  assert.match(save, /action: "analyze"/);
  assert.ok(save.indexOf('method: "POST"') < save.lastIndexOf('method: "POST"'));
  assert.match(save, /analysisBody\.opportunity\?\.id/);
});

test("review-required and failed analysis paths remain in the inbox", () => {
  const client = read("app/career/discover/DiscoverClient.tsx");
  const save = client.slice(client.indexOf("async function save(result"), client.indexOf("return <>", client.indexOf("async function save(result")));
  assert.match(save, /Review it before analysis/);
  assert.match(save, /may still be available in your inbox/);
  assert.match(save, /Opportunity added to your inbox, but analysis could not be completed/);
});

test("discovery save preserves provider source provenance through the inbox contract", () => {
  const client = read("app/career/discover/DiscoverClient.tsx");
  const save = client.slice(client.indexOf("async function save(result"), client.indexOf("return <>", client.indexOf("async function save(result")));
  assert.match(save, /sourceName: sourceLabel\(result\)/);
  assert.match(save, /sourceUrl: sourceHref\(result\)/);
  assert.match(save, /provenance: inboxProvenance\(result\)/);
  assert.match(client, /authoritySourceId/);
  assert.match(client, /sourceAuthority/);
});

test("Greenhouse source-registry requests cannot fall back to USAJOBS", () => {
  const route = read("app/api/career/discover/route.ts");
  assert.match(route, /const searchAuthorizedSources = searchAuthorizedDiscoverySources/);
  assert.match(route, /requestedProvider === "GREENHOUSE"/);
  assert.match(route, /SOURCE_ID_REQUIRED/);
  assert.match(route, /sourceIds\.length > 0 && requestedProvider !== "USAJOBS"/);
  assert.match(route, /useSourceRegistry \? await searchAuthorizedSources/);
  assert.match(route, /: await searchAuthorizedUsajobs/);
  assert.doesNotMatch(route, /await searchAuthorizedProvider\(providerCriteria\)/);
});

test("USAJOBS authority-required errors are not presented as zero results", () => {
  const route = read("app/api/career/discover/route.ts");
  const client = read("app/career/discover/DiscoverClient.tsx");
  assert.match(route, /USAJOBS_WRITTEN_APPROVAL_REQUIRED/);
  assert.match(route, /sourceAuthorityCodes\.includes\(code\) \? 403/);
  assert.match(client, /body\.error === "USAJOBS_WRITTEN_APPROVAL_REQUIRED"/);
  assert.doesNotMatch(client, /0 ranked opportunities found via USAJOBS/);
});
