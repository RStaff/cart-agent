import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url).pathname;
const read = (relative) => fs.readFileSync(`${root}${relative}`, "utf8");

test("Search now persists the submitted role before discovery", () => {
  const client = read("app/career/discover/DiscoverClient.tsx");
  const search = client.slice(client.indexOf("async function search"), client.indexOf("async function savePreferences"));
  assert.match(search, /searchPayload\(form\)/);
  assert.ok(search.indexOf('method: "PUT"') < search.indexOf('method: "POST"'));
  assert.match(search, /Search preferences could not be saved\. Search was not started\./);
  assert.match(search, /setResults\(/);
});

test("Search now preserves the complete existing preference payload", () => {
  const client = read("app/career/discover/DiscoverClient.tsx");
  const payload = client.slice(client.indexOf("function searchPayload"), client.indexOf("const PRESETS"));
  for (const field of ["requestedTitle", "keywords", "location", "remotePreference", "postedWithinDays", "salaryMin", "resultLimit"]) {
    assert.match(payload, new RegExp(field));
  }
  assert.match(client, /const searchGeneration = useRef\(0\)/);
  assert.match(client, /generation !== searchGeneration\.current/);
});

test("Search preference persistence remains the canonical server authority", () => {
  const route = read("app/api/career/discover/route.ts");
  const put = route.slice(route.indexOf("export async function PUT"), route.indexOf("export async function POST"));
  assert.match(put, /saveSearchPreferences/);
  assert.doesNotMatch(put, /searchUsajobs/);
});
