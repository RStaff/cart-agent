import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createCareerP0Store } from "./careerP0Store.mjs";
import { parseCareerText } from "./careerP0Intake.mjs";

async function fixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "careeros-intake-"));
  return createCareerP0Store({ filePath: path.join(dir, "store.json") });
}

test("deterministically proposes source-backed facts without capability overclaim", () => {
  const input = { sourceId: "source_test", sourceType: "RESUME_TEXT", text: "Led Salesforce CRM implementation across three teams. Reduced manual reporting by 30%. Completed a PMP certification." };
  const first = parseCareerText(input);
  const second = parseCareerText(input);
  assert.deepEqual(first.candidates.map((candidate) => candidate.candidateFactId), second.candidates.map((candidate) => candidate.candidateFactId));
  assert.deepEqual(first.candidates.map((candidate) => candidate.sourceExcerpt), second.candidates.map((candidate) => candidate.sourceExcerpt));
  assert.ok(first.candidates.every((candidate) => candidate.status === "PROPOSED"));
  assert.equal(first.candidates.some((candidate) => /enterprise|expert/i.test(candidate.statement)), false);
});

test("parsing is idempotent and review decisions preserve correction history", async () => {
  const store = await fixture();
  const session = await store.createAccount({ email: "intake@example.test", password: "password-a" });
  await store.saveProfile(session.sessionId, { displayName: "Synthetic Candidate" });
  const source = await store.createSource(session.sessionId, { sourceType: "RESUME_TEXT", textContent: "Led a project that improved delivery across two teams." });
  const parsed = parseCareerText({ sourceId: source.id, sourceType: source.sourceType, text: "Led a project that improved delivery across two teams." });
  const first = await store.saveCandidates(session.sessionId, source.id, parsed);
  const second = await store.saveCandidates(session.sessionId, source.id, parsed);
  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  const confirmed = await store.reviewCandidate(session.sessionId, first[0].candidateFactId, "CONFIRM");
  assert.equal(confirmed.careerFact.authorityState, "CUSTOMER_CONFIRMED_SOURCE_BACKED");
  const corrected = await store.reviewCandidate(session.sessionId, first[0].candidateFactId, "CORRECT", "Led a delivery project across two teams.");
  assert.equal(corrected.candidate.status, "CORRECTED");
  assert.equal((await store.listCareerFacts(session.sessionId))[0].statement, "Led a delivery project across two teams.");
});

test("candidate and confirmed facts remain tenant scoped", async () => {
  const store = await fixture();
  const a = await store.createAccount({ email: "a@example.test", password: "password-a" });
  const b = await store.createAccount({ email: "b@example.test", password: "password-b" });
  await store.saveProfile(a.sessionId, { displayName: "A" });
  const source = await store.createSource(a.sessionId, { sourceType: "PROJECT", textContent: "Built a synthetic project with a measurable outcome." });
  const parsed = parseCareerText({ sourceId: source.id, sourceType: source.sourceType, text: "Built a synthetic project with a measurable outcome." });
  const candidates = await store.saveCandidates(a.sessionId, source.id, parsed);
  await store.reviewCandidate(a.sessionId, candidates[0].candidateFactId, "CONFIRM");
  assert.deepEqual(await store.listCandidateFacts(b.sessionId), []);
  assert.deepEqual(await store.listCareerFacts(b.sessionId), []);
});

test("reject and keep-for-later never create confirmed CareerFacts", async () => {
  const store = await fixture();
  const session = await store.createAccount({ email: "review@example.test", password: "password-a" });
  await store.saveProfile(session.sessionId, { displayName: "Review Candidate" });
  const text = "Led a synthetic project across two teams. Completed a synthetic certification program. Worked at a synthetic company.";
  const source = await store.createSource(session.sessionId, { sourceType: "MANUAL_WORK_HISTORY", textContent: text });
  const parsed = parseCareerText({ sourceId: source.id, sourceType: source.sourceType, text });
  const candidates = await store.saveCandidates(session.sessionId, source.id, parsed);
  await store.reviewCandidate(session.sessionId, candidates[0].candidateFactId, "REJECT");
  await store.reviewCandidate(session.sessionId, candidates[1].candidateFactId, "KEEP_FOR_LATER");
  assert.deepEqual(await store.listCareerFacts(session.sessionId), []);
});
