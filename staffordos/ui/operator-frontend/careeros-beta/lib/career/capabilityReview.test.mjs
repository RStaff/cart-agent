import test from "node:test";
import assert from "node:assert/strict";
import { capabilityReviewComplete, nextUnreviewedCapabilityIndex, unreviewedCapabilityCount } from "./capabilityReview.mjs";

const reviewed = { decision: { answer: "DIRECT" } };
const open = { decision: null };

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
