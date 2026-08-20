import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { assembleStoryDraft, draftStorageKey, restoreStoryDraft, serializeStoryDraft, skipStoryQuestion } from "./storyDraftPersistence.mjs";

const root = new URL("../../", import.meta.url).pathname;
const read = (relative) => readFileSync(`${root}${relative}`, "utf8");
const storyBuilder = read("app/career/components/CareerStoryBuilder.tsx");
const intakeReview = read("app/career/components/IntakeReview.tsx");
const intakeRoute = read("app/api/career/intake/source/route.ts");
const product = read("lib/career/careerP0Product.mjs");
const capabilitiesPage = read("app/career/capabilities/page.tsx");
const authority = read("lib/career/customerSemanticAuthority.json");
const persistence = read("lib/career/storyDraftPersistence.mjs");

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

test("an active interview draft cannot expose Review strengths", () => {
  assert.match(storyBuilder, /mode === "TALK"/);
  assert.match(storyBuilder, /Finish &amp; submit story/);
  assert.match(storyBuilder, /Save draft and return Home/);
});

test("capability review provides a direct path back to Career Story", () => {
  assert.match(capabilitiesPage, /href="\/career\/onboarding"/);
  assert.match(capabilitiesPage, /Career Story/);
});

test("accepted story drafts are recoverable with truthful local persistence", () => {
  assert.match(storyBuilder, /localStorage/);
  assert.match(storyBuilder, /profile\?\.id/);
  assert.match(persistence, /STORY_DRAFT_STORAGE_PREFIX/);
  assert.match(storyBuilder, /Draft saved on this device/);
  assert.match(storyBuilder, /Save draft and return Home/);
});

test("active interview has a reachable explicit submission path", () => {
  assert.match(storyBuilder, /Finish &amp; submit story/);
  assert.match(storyBuilder, /Submit story for review/);
  assert.match(storyBuilder, /submitTalk/);
});

test("future timeline and contextual-question boundaries remain recorded without implementation", () => {
  assert.match(authority, /FUTURE_CONTEXTUAL_QUESTIONING/);
  assert.match(authority, /SLICE_2_TIMELINE_PRESERVATION/);
  assert.match(authority, /FUTURE_NOT_IMPLEMENTED/);
});

test("kept answers round-trip with question association and final assembly", () => {
  const draft = { experienceContext: "Website migration", talkAnswers: ["UNIQUE_Q1_MIGRATION_SCOPE", "UNIQUE_Q2_JIRA_DECISIONS", null, null, null, null], inputModes: ["VOICE", "TEXT", null, null, null, null], questionIndex: 2, interviewReview: false };
  const storage = new Map();
  storage.set(draftStorageKey("synthetic-profile"), serializeStoryDraft(draft));
  const restored = restoreStoryDraft(storage.get(draftStorageKey("synthetic-profile")), 6);
  assert.equal(restored.questionIndex, 2);
  assert.equal(restored.interviewReview, true);
  assert.equal(restored.talkAnswers[0], "UNIQUE_Q1_MIGRATION_SCOPE");
  assert.equal(restored.talkAnswers[1], "UNIQUE_Q2_JIRA_DECISIONS");
  const assembled = assembleStoryDraft({ ...restored, followUps: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"] });
  assert.match(assembled, /Q1\nUNIQUE_Q1_MIGRATION_SCOPE/);
  assert.match(assembled, /Q2\nUNIQUE_Q2_JIRA_DECISIONS/);
  assert.ok(assembled.indexOf("UNIQUE_Q1_MIGRATION_SCOPE") < assembled.indexOf("UNIQUE_Q2_JIRA_DECISIONS"));
  assert.match(storyBuilder, /Your career story draft/);
});

test("skipping a previously kept answer does not erase it", () => {
  const answers = ["KEPT_ANSWER", null, null];
  assert.deepEqual(skipStoryQuestion(answers, 0), answers);
  assert.deepEqual(skipStoryQuestion(answers, 1), ["KEPT_ANSWER", null, null]);
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
