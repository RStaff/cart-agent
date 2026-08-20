import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url).pathname;
const read = (relative) => fs.readFileSync(`${root}${relative}`, "utf8");

test("profile is identity-only and links to Career Story", () => {
  const profile = read("app/career/profile/page.tsx");
  assert.doesNotMatch(profile, /CareerStoryBuilder/);
  assert.match(profile, /href="\/career\/onboarding"/);
  assert.match(profile, /Career Profile/);
});

test("career story retains the existing intake and review surface", () => {
  const story = read("app/career/onboarding/page.tsx");
  assert.match(story, /CareerStoryBuilder/);
  assert.match(story, /Career Story/);
  assert.match(story, /href="\/career\/profile"/);
  assert.match(story, /href="\/career"/);
});

test("home exposes profile and story as distinct destinations", () => {
  const home = read("app/career/page.tsx");
  assert.match(home, /href="\/career\/profile"/);
  assert.match(home, /storyHref\s*=\s*"\/career\/onboarding"/);
  assert.match(home, /href=\{storyHref\}/);
  assert.match(home, /Career Profile/);
  assert.match(home, /Career Story \/ Experience/);
});

test("semantic authority declares the separated surfaces", () => {
  const authority = read("lib/career/customerSemanticAuthority.json");
  for (const key of ["PROFILE_IDENTITY", "CAREER_STORY", "CAREER_EVIDENCE", "CAPABILITY_AUTHORITY", "APPLICATION_ARTIFACTS", "SURFACE_SEPARATION"]) {
    assert.match(authority, new RegExp(`"${key}"`));
  }
});
