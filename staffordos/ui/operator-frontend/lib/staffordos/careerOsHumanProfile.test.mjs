import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildCareerProfileView } from "../../careeros-beta/lib/career/careerProfileView.mjs";

const profilePage = readFileSync(new URL("../../careeros-beta/app/career/profile/page.tsx", import.meta.url), "utf8");
const intakeReview = readFileSync(new URL("../../careeros-beta/app/career/components/IntakeReview.tsx", import.meta.url), "utf8");

const fact = (overrides = {}) => ({
  id: "fact-1",
  factType: "EMPLOYMENT",
  statement: "Led delivery of a customer-facing platform across several teams.",
  sourceType: "RESUME_TEXT",
  sourceExcerpt: "Led delivery of a customer-facing platform across several teams.",
  scopeStatement: "across several teams",
  authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED",
  status: "CUSTOMER_CONFIRMED",
  ...overrides,
});

test("confirmed facts become grouped human profile sections with secondary evidence", () => {
  const view = buildCareerProfileView({ profile: { displayName: "Synthetic User" }, facts: [fact()] });
  assert.equal(view.sections[0].label, "Experience");
  assert.equal(view.sections[0].facts[0].statement, fact().statement);
  assert.equal(view.sections[0].facts[0].evidence.sourceExcerpt, fact().sourceExcerpt);
  assert.equal(view.sections[0].facts[0].evidence.sourceType, "Resume Text");
  assert.equal(view.sections[0].facts[0].evidence.scopeStatement, fact().scopeStatement);
});

test("unconfirmed candidates remain reviewable and are not confirmed profile facts", () => {
  const view = buildCareerProfileView({ profile: { displayName: "Synthetic User" }, facts: [], candidates: [{ candidateFactId: "candidate-1", statement: "Proposed project experience.", sourceType: "PROJECT", status: "PROPOSED" }] });
  assert.equal(view.sections.length, 0);
  assert.equal(view.reviewCandidates.length, 1);
  assert.equal(view.reviewCandidates[0].statement, "Proposed project experience.");
});

test("structural headings and machine-like tokens remain evidence-only without mutation", () => {
  const heading = fact({ id: "fact-heading", statement: "PROFESSIONAL EXPERIENCE", sourceExcerpt: "PROFESSIONAL EXPERIENCE" });
  const token = fact({ id: "fact-token", statement: "BEFORE_MOVE_TO_NEW_JERSEY_IN_2016", sourceExcerpt: "BEFORE_MOVE_TO_NEW_JERSEY_IN_2016" });
  const view = buildCareerProfileView({ profile: { displayName: "Synthetic User" }, facts: [heading, token] });
  assert.equal(view.sections.length, 0);
  assert.deepEqual(view.evidenceOnly.map((item) => item.statement), [heading.statement, token.statement]);
  assert.equal(view.evidenceOnly[1].evidence.sourceExcerpt, token.sourceExcerpt);
});

test("profile reads confirmed facts and review queue remains presentation-only", () => {
  assert.match(profilePage, /listCareerFacts/);
  assert.match(profilePage, /listCandidateFacts/);
  assert.match(profilePage, /HumanCareerProfile/);
  assert.match(intakeReview, /const reviewable = candidates\.filter/);
  assert.doesNotMatch(intakeReview, /candidate\.status === \"CONFIRMED\"/);
});
