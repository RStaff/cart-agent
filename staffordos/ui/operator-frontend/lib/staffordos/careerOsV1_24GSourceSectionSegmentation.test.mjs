import assert from "node:assert/strict";
import test from "node:test";
import { blocksFor, headingType, run } from "./runCareerOsV1_24GSourceSectionSegmentation.mjs";

test("section aliases are deterministic and prose is not a heading", () => {
  assert.equal(headingType("Key responsibilities"), "RESPONSIBILITIES");
  assert.equal(headingType("What you'll do"), "RESPONSIBILITIES");
  assert.equal(headingType("Strong candidates may also have"), "PREFERRED_QUALIFICATIONS");
  assert.equal(headingType("Logistics"), "LOCATION_WORK_ARRANGEMENT");
  assert.equal(headingType("This role has responsibilities across several teams."), null);
});

test("source blocks retain raw headings, order, and unknown context", () => {
  const blocks = blocksFor({
    jobSourceRecordId: "source-1",
    descriptionText: "Introductory prose\nKey responsibilities\nLead cross-functional programs\nPreferred qualifications\nExperience with automation",
  });
  assert.equal(blocks[0].type, "UNKNOWN_SECTION");
  assert.equal(blocks[0].rawHeading, null);
  assert.equal(blocks[1].rawHeading, "Key responsibilities");
  assert.equal(blocks[1].type, "RESPONSIBILITIES");
  assert.equal(blocks[2].type, "PREFERRED_QUALIFICATIONS");
  assert.equal(blocks[1].sourceOrder < blocks[2].sourceOrder, true);
  assert.equal(blocks[1].blockId, "source-1::block-2");
});

test("80-role section-aware reruns preserve frozen authorities and are deterministic", () => {
  const first = run();
  const second = run();
  assert.deepEqual(first.sectionCounts, second.sectionCounts);
  assert.deepEqual(first.after, second.after);
  assert.equal(first.rows.calibration.length, 40);
  assert.equal(first.rows.holdout.length, 40);
  assert.equal(first.baseline.v2dFormula, "FROZEN_V1_23_V2D");
  assert.deepEqual(first.baseline.v2dWeights, { relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10 });
  assert.equal(first.baseline.calibrationLabelHash, "18023e8a944331b3c938f62174f4ce60881c1c114298c73049bea6f26b135b85");
  assert.equal(first.baseline.holdoutLabelHash, "0d77e5b1ec98285c42cb0115ae9ec4be8bde2077d15740a58cbd0509314593e0");
  assert.equal(first.sectionCounts.sourceRecordsFound, 80);
  assert.equal(first.sectionCounts.unknownSection > 0, true);
});
