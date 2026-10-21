import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../../careeros-beta/", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");

test("bare origin is session-aware and customer home exposes story continuation", () => {
  const entry = read("app/page.tsx");
  const home = read("app/career/page.tsx");
  assert.match(entry, /redirect\(context \? "\/career" : "\/career\/login"\)/);
  assert.match(home, /Continue building your career story/);
  assert.match(home, /career\/profile/);
  assert.match(home, /career\/capabilities/);
  assert.match(home, /career\/jobs/);
  assert.doesNotMatch(home, /\/os\//);
});

test("root entry does not import operator or private authority surfaces", () => {
  assert.doesNotMatch(read("app/page.tsx"), /\/os\/|Ross|CareerEvidence|operator-frontend/);
  assert.doesNotMatch(read("app/career/page.tsx"), /\/os\/|Ross|CareerEvidence|operator-frontend/);
});
