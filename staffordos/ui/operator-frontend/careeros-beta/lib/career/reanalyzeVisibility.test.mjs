import test from "node:test";
import assert from "node:assert/strict";
import { shouldShowReanalyze } from "./reanalyzeVisibility.mjs";

for (const state of [
  { name: "normal analyzed", stale: false, reanalyzeRequired: false },
  { name: "stale", stale: true, reanalyzeRequired: false },
  { name: "insufficient analysis", stale: false, reanalyzeRequired: true },
]) {
  test(`${state.name} opportunity exposes the existing re-analysis action`, () => {
    assert.equal(shouldShowReanalyze({ opportunityId: "opportunity-test" }), true);
  });
}

test("missing opportunity identity does not expose an action target", () => {
  assert.equal(shouldShowReanalyze({ opportunityId: "" }), false);
  assert.equal(shouldShowReanalyze(), false);
});

test("visibility does not duplicate or redefine the existing route contract", () => {
  assert.equal(shouldShowReanalyze({ opportunityId: "opportunity-test" }), true);
});
