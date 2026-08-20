import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url).pathname;
const read = (relative) => readFileSync(`${root}${relative}`, "utf8");
const storyBuilder = read("app/career/components/CareerStoryBuilder.tsx");
const intakeReview = read("app/career/components/IntakeReview.tsx");
const intakeRoute = read("app/api/career/intake/source/route.ts");
const product = read("lib/career/careerP0Product.mjs");

test("story submission enters the existing proposed-experience review", () => {
  assert.match(storyBuilder + intakeReview, /Review what CareerOS understands/);
  assert.match(storyBuilder + intakeReview, /Review proposed experience|Review proposed facts/);
  assert.match(storyBuilder, /focusReview/);
  assert.match(intakeReview, /career-story-review/);
});

test("new testimony does not bypass candidate review for capabilities", () => {
  assert.match(storyBuilder, /Review strengths/);
  assert.match(storyBuilder, /hasReviewableCandidates/);
  assert.match(storyBuilder, /Review proposed experience/);
  assert.match(intakeReview, /onReviewStateChange/);
});

test("submission remains candidate-only and capability derivation remains fact-only", () => {
  assert.match(intakeRoute, /saveCandidates/);
  assert.match(intakeRoute, /VOICE_TRANSCRIPT/);
  assert.match(product, /CUSTOMER_CONFIRMED_SOURCE_BACKED/);
  assert.match(product, /deriveCapabilityCandidates\(facts\)/);
  assert.doesNotMatch(product, /CareerFactCandidate.*deriveCapabilityCandidates/);
});

test("proposed experience remains explicitly unconfirmed", () => {
  assert.match(intakeReview, /not confirmed yet/);
  assert.match(intakeReview, /Confirm/);
  assert.match(intakeReview, /Correct/);
  assert.match(intakeReview, /Reject/);
  assert.match(intakeReview, /Later/);
});

test("source-backed chronology remains text and source-order based", () => {
  assert.match(intakeRoute, /sourceType: body\.sourceType, textContent: text/);
  assert.match(product, /sourceOrder/);
  assert.doesNotMatch(intakeRoute, /startYear|endYear|duration|timeline/);
});
