import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url).pathname;
const read = (relative) => fs.readFileSync(`${root}${relative}`, "utf8");

test("saved search preferences use a separate scoped authority and do not search", () => {
  const route = read("app/api/career/discover/route.ts");
  assert.match(route, /export async function PUT/);
  assert.match(route, /saveSearchPreferences/);
  const put = route.slice(route.indexOf("export async function PUT"), route.indexOf("export async function POST"));
  assert.doesNotMatch(put, /searchUsajobs/);
});

test("discovery results remain transient and explicitly separate from matching", () => {
  const client = read("app/career/discover/DiscoverClient.tsx");
  assert.match(client, /Search now/);
  assert.match(client, /Add to Opportunity Inbox/);
  assert.match(client, /not CareerOS match assessments/);
  assert.match(client, /USAJOBS/);
});

test("discovery preserves home navigation and workspace attention", () => {
  const page = read("app/career/discover/page.tsx");
  const jobs = read("app/career/jobs/page.tsx");
  assert.match(page, /href="\/career"/);
  assert.match(jobs, /Needs attention/);
});

test("search criteria exclude CareerOS authority data", () => {
  const adapter = read("lib/career/usajobsDiscovery.mjs");
  assert.doesNotMatch(adapter, /CareerFact|capabilit|resume|tenantId|matchResult/i);
});

test("saved preference schema is applied by the existing CareerOS startup path", () => {
  const startup = read("scripts/start-careeros.mjs");
  assert.match(startup, /20260820050000_add_career_search_preferences\/migration\.sql/);
});
