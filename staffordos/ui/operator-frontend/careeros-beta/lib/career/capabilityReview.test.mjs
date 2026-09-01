import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { capabilityAnswerLabel, capabilityReviewComplete, capabilityReviewStatus, capabilityReviewStatusLabel, nextUnreviewedCapabilityIndex, unreviewedCapabilityCount } from "./capabilityReview.mjs";

const reviewed = { decision: { answer: "DIRECT" } };
const open = { decision: null };
const capabilitiesPage = readFileSync(new URL("../../app/career/capabilities/page.tsx", import.meta.url), "utf8");
const reopened = { authorityState: "NEEDS_MORE_EVIDENCE", decision: { answer: "DIRECT" } };

test("capability review preserves next unreviewed behavior while questions remain", () => {
  assert.equal(unreviewedCapabilityCount([reviewed, open]), 1);
  assert.equal(capabilityReviewComplete([reviewed, open]), false);
  assert.equal(nextUnreviewedCapabilityIndex([reviewed, open], 0), 1);
});

test("capability review completes without looping when all questions are answered", () => {
  assert.equal(unreviewedCapabilityCount([reviewed, reviewed]), 0);
  assert.equal(capabilityReviewComplete([reviewed, reviewed]), true);
  assert.equal(nextUnreviewedCapabilityIndex([reviewed, reviewed], 0), -1);
});

test("new confirmed evidence reopens an already-decided capability proposition", () => {
  assert.equal(unreviewedCapabilityCount([reviewed, reopened]), 1);
  assert.equal(capabilityReviewComplete([reviewed, reopened]), false);
  assert.equal(nextUnreviewedCapabilityIndex([reviewed, reopened], 0), 1);
});

test("capability status distinguishes reopened, current, and unreviewed items", () => {
  assert.equal(capabilityReviewStatus(reopened), "NEEDS_REVIEW");
  assert.equal(capabilityReviewStatusLabel(reopened), "Needs review");
  assert.equal(capabilityReviewStatus(reviewed), "REVIEWED_CURRENT");
  assert.equal(capabilityReviewStatus(open), "UNREVIEWED");
});

test("retained capability answers use customer-readable labels", () => {
  assert.equal(capabilityAnswerLabel("DIRECT"), "Yes, directly");
  assert.equal(capabilityAnswerLabel("KEEP_UNRESOLVED"), "I need more context");
});

test("capability overview preserves API order and offers direct selection", () => {
  assert.match(capabilitiesPage, /items\.map\(\(item, itemIndex\)/);
  assert.match(capabilitiesPage, /onClick=\{\(\) => selectCapability\(itemIndex\)\}/);
  assert.match(capabilitiesPage, /type="button"/);
});

test("capability overview explains retained answers without submitting them", () => {
  assert.match(capabilitiesPage, /Current answer: \$\{capabilityAnswerLabel\(item\.decision\.answer\)\}/);
  assert.match(capabilitiesPage, /New confirmed experience is available for review/);
  assert.match(capabilitiesPage, /Your current answer remains in place unless you update it/);
  assert.match(capabilitiesPage, /Selecting one does not change your answers/);
});
