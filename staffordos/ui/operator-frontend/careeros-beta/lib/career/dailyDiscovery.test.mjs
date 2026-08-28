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

test("discovery uses bounded search intent and pre-import ranking", () => {
  const route = read("app/api/career/discover/route.ts");
  assert.match(route, /getDiscoveryAuthorityModel/);
  assert.match(route, /buildPersonalizedSearchIntent/);
  assert.match(route, /buildProviderCriteriaForIntent/);
  assert.match(route, /rankDiscoveryResults/);
  assert.match(route, /searchAuthorizedProvider\(providerCriteria\)/);
});

test("discovery UI explains ranked previews without importing automatically", () => {
  const client = read("app/career/discover/DiscoverClient.tsx");
  assert.match(client, /Why this surfaced/);
  assert.match(client, /Strong evidence/);
  assert.match(client, /Transferable evidence/);
  assert.match(client, /Important gaps/);
  assert.match(client, /ranked discovery previews/);
  assert.doesNotMatch(client, /createOpportunity/);
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

test("Career Home makes search-first journey and separate evaluation visible", () => {
  const home = read("app/career/page.tsx");
  assert.match(home, /Build my career profile/);
  assert.match(home, /Review what CareerOS learned/);
  assert.match(home, /Find jobs for me/);
  assert.match(home, /Understand my matches/);
  assert.match(home, /Manage my opportunities/);
  assert.match(home, /href: "\/career\/discover"/);
  assert.match(home, /href: "\/career\/inbox"/);
  assert.match(home, /href="\/career\/jobs"/);
  assert.match(home, /Beta utility/);
  assert.doesNotMatch(home, /Public feedback beta path/);
  assert.doesNotMatch(home, /provider coverage|private-sector provider/i);
});

test("Career Home keeps the core journey descriptions concise", () => {
  const home = read("app/career/page.tsx");
  const journey = home.slice(home.indexOf("const journey"), home.indexOf("return <main"));
  const descriptions = [...journey.matchAll(/body: (?:hasProfile\s*\?\s*)?"([^"]+)"/g)].map((match) => match[1]);
  assert.equal(descriptions.length, 5);
  for (const description of descriptions) assert.ok(description.split(/\s+/).length <= 16, description);
});

test("saved preference schema is applied by the existing CareerOS startup path", () => {
  const startup = read("scripts/start-careeros.mjs");
  assert.match(startup, /20260820050000_add_career_search_preferences\/migration\.sql/);
});

test("context claim schema is applied by the existing CareerOS startup path", () => {
  const startup = read("scripts/start-careeros.mjs");
  assert.match(startup, /20260822010000_add_career_fact_context_claims\/migration\.sql/);
});

test("context claim migration is additive and idempotent", () => {
  const migration = read("prisma/migrations/20260822010000_add_career_fact_context_claims/migration.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS/);
  assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS/);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS/);
  assert.doesNotMatch(migration, /INSERT INTO|UPDATE\s+"CareerFact"|UPDATE\s+"CareerSource"/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP INDEX|ALTER TABLE "CareerFact"/);
});
