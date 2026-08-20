import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { assembleStoryDraft, draftStorageKey, restoreStoryDraft, serializeStoryDraft, skipStoryQuestion } from "./storyDraftPersistence.mjs";
import { parseCareerText, sourceDigest } from "./careerP0Intake.mjs";
import { createCareerP0Store } from "./careerP0Store.mjs";

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
  const assembled = assembleStoryDraft({ ...restored, followUps: ["What did you personally do?", "What did you own?", "Q3", "Q4", "Q5", "Q6"] });
  assert.doesNotMatch(assembled, /What did you personally do|What did you own/);
  assert.match(assembled, /UNIQUE_Q1_MIGRATION_SCOPE/);
  assert.match(assembled, /UNIQUE_Q2_JIRA_DECISIONS/);
  assert.ok(assembled.indexOf("UNIQUE_Q1_MIGRATION_SCOPE") < assembled.indexOf("UNIQUE_Q2_JIRA_DECISIONS"));
  assert.match(storyBuilder, /Your career story draft/);
});

test("interviewer prompts and skipped questions never enter source-backed proposals", () => {
  const sourceText = assembleStoryDraft({
    experienceContext: "Cross-functional website migration",
    talkAnswers: ["I coordinated developers and marketing using Jira.", null, "We launched on schedule.", null, null, null],
    followUps: ["What did you personally do in this experience?", "What did you own?", "What changed?", "What was the scope?", "What was accomplished?", "What evidence exists?"]
  });
  assert.doesNotMatch(sourceText, /Experience context|What did you personally do|What did you own|What changed/);
  const parsed = parseCareerText({ sourceId: "synthetic-source", sourceType: "VOICE_TRANSCRIPT", text: sourceText });
  assert.ok(parsed.candidates.length > 0);
  assert.ok(parsed.candidates.every((candidate) => !/Experience context|What did you personally do|What did you own|What changed/.test(candidate.statement)));
  assert.ok(parsed.candidates.every((candidate) => candidate.statement !== "Skipped for now"));
});

test("scope metadata does not promote a responsibility object into scope", () => {
  const parsed = parseCareerText({ sourceId: "synthetic-scope", sourceType: "VOICE_TRANSCRIPT", text: "I was responsible for project schedule, stakeholder communication, and resolving blockers." });
  assert.equal(parsed.candidates[0]?.scopeStatement, null);
});

test("identical source submissions expose an idempotency input to the intake boundary", () => {
  assert.match(intakeRoute, /sourceDigest/);
  assert.match(intakeRoute, /sourceIdentity|CAREEROS_INTAKE_EXTRACTOR_VERSION/);
  assert.match(intakeRoute, /sourceDigest/);
});

test("identical source submissions reuse the existing source and candidate queue", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "careeros-intake-"));
  try {
    const store = createCareerP0Store({ filePath: path.join(directory, "store.json") });
    const account = await store.createAccount({ email: "synthetic@example.test", password: "not-a-real-password", displayName: "Synthetic" });
    await store.saveProfile(account.sessionId, { displayName: "Synthetic", headline: "Test profile" });
    const text = "I coordinated a synthetic website migration using Jira.";
    const input = { sourceType: "VOICE_TRANSCRIPT", textContent: text, sourceDigest: sourceDigest(text) };
    const first = await store.createSource(account.sessionId, input);
    const parsed = parseCareerText({ sourceId: first.id, sourceType: first.sourceType, text });
    const firstCandidates = await store.saveCandidates(account.sessionId, first.id, parsed);
    const second = await store.createSource(account.sessionId, input);
    const secondCandidates = await store.saveCandidates(account.sessionId, second.id, parsed);
    assert.equal(second.id, first.id);
    assert.equal(secondCandidates.length, firstCandidates.length);
    assert.equal((await store.listCandidateFacts(account.sessionId)).length, firstCandidates.length);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
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
